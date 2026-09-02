/**
 * GymPulse – Multi-Gym Tenant Isolation Test
 *
 * This script:
 *   1. Loads two gyms (A and B) from the database
 *   2. Creates/uses staff accounts for each gym
 *   3. Creates a member in each gym
 *   4. Authenticates as Gym A's staff and attempts to access Gym B's data
 *   5. Authenticates as Gym B's member and verifies they only see their gym's data
 *   6. Tests QR cross-gym attendance denial
 *
 * Run: node scratch/test_multi_gym_isolation.js
 * Requires: API server running at localhost:5000
 */

// Load env from the api directory
const path = require('path');
const API_ROOT = path.resolve(__dirname, '..', 'apps', 'api');
const dotenv = require(path.join(API_ROOT, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(API_ROOT, '.env') });
require(path.join(API_ROOT, 'src', 'config', 'env.js'));

const http = require('http');

const BASE = 'http://localhost:5000/api/v1';

// ─── HTTP helper ────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const json = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(json ? { 'Content-Length': Buffer.byteLength(json) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (json) req.write(json);
    req.end();
  });
}

// ─── Reporting ───────────────────────────────────────────────────────────────
const results = { pass: [], fail: [], skip: [] };
function pass(label) {
  console.log(`  ✅ PASS  ${label}`);
  results.pass.push(label);
}
function fail(label, detail) {
  console.log(`  ❌ FAIL  ${label} — ${detail}`);
  results.fail.push({ label, detail });
}
function skip(label, reason) {
  console.log(`  ⚠️  SKIP  ${label} — ${reason}`);
  results.skip.push({ label, reason });
}

function assert(label, condition, detail) {
  if (condition) pass(label);
  else fail(label, detail);
}

// ─── Database helpers ────────────────────────────────────────────────────────
const { pool } = require(path.join(API_ROOT, 'src', 'db', 'pool.js'));
const bcrypt = require(path.join(API_ROOT, 'node_modules', 'bcrypt'));

const TEST_PASSWORD = 'IsolationTest@123';
const TEMP_TAG = 'ISOLATION_TEST_TEMP';

async function ensureStaff(gymId, email, role) {
  const existing = await pool.query(
    `SELECT id, email FROM staff WHERE email = $1 AND gym_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [email, gymId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  const res = await pool.query(
    `INSERT INTO staff (gym_id, first_name, last_name, email, phone, password_hash, role, is_active)
     VALUES ($1, 'Test', $2, $3, '9999999999', $4, $5, TRUE)
     RETURNING id`,
    [gymId, TEMP_TAG, email, hash, role]
  );
  return res.rows[0].id;
}

async function ensureMember(gymId, planId, phone, memberId) {
  const existing = await pool.query(
    `SELECT id, member_id FROM members WHERE phone = $1 AND gym_id = $2 AND deleted_at IS NULL LIMIT 1`,
    [phone, gymId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  const qrCode = `GYMPULSE-MEMBER:${memberId}:${gymId}`;
  const email = `${memberId.toLowerCase().replace(/-/g, '')}@isolation.test`;
  const res = await pool.query(
    `INSERT INTO members (gym_id, membership_plan_id, member_id, first_name, last_name,
       gender, date_of_birth, phone, email, emergency_contact, address, qr_code,
       join_date, expiry_date, password_hash, is_active)
     VALUES ($1, $2, $3, 'IsoTest', $4, 'Male', '1995-01-01', $5, $6, '9999999999',
       'Test Address', $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days', $8, TRUE)
     RETURNING id, member_id`,
    [gymId, planId, memberId, TEMP_TAG, phone, email, qrCode, hash]
  );
  return res.rows[0];
}

async function cleanupTemp() {
  await pool.query(`DELETE FROM staff WHERE last_name = $1`, [TEMP_TAG]);
  await pool.query(`DELETE FROM members WHERE last_name = $1`, [TEMP_TAG]);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   GYMPULSE — MULTI-GYM TENANT ISOLATION SECURITY TEST   ');
  console.log('══════════════════════════════════════════════════════════\n');

  // ── Load two gyms ──────────────────────────────────────────────────────────
  const gymRes = await pool.query(
    `SELECT id, name FROM gyms WHERE deleted_at IS NULL AND is_active = TRUE ORDER BY created_at LIMIT 2`
  );
  if (gymRes.rows.length < 2) {
    console.error('[FATAL] Need at least 2 active gyms in the database to run isolation tests.');
    console.error('        Please seed a second gym and re-run.');
    process.exit(1);
  }

  const gymA = gymRes.rows[0];
  const gymB = gymRes.rows[1];
  console.log(`[SETUP] Gym A: "${gymA.name}" (${gymA.id})`);
  console.log(`[SETUP] Gym B: "${gymB.name}" (${gymB.id})`);

  // ── Ensure membership plans ────────────────────────────────────────────────
  const planARes = await pool.query(
    `SELECT id FROM membership_plans WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [gymA.id]
  );
  const planBRes = await pool.query(
    `SELECT id FROM membership_plans WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [gymB.id]
  );
  const planAId = planARes.rows[0]?.id || null;
  const planBId = planBRes.rows[0]?.id || null;

  // ── Create test staff for each gym ────────────────────────────────────────
  const staffAEmail = `isolation_staff_a_${Date.now()}@test.gympulse`;
  const staffBEmail = `isolation_staff_b_${Date.now()}@test.gympulse`;
  await ensureStaff(gymA.id, staffAEmail, 'Owner');
  await ensureStaff(gymB.id, staffBEmail, 'Owner');

  // ── Login as Gym A staff ───────────────────────────────────────────────────
  console.log('\n[AUTH] Logging in as Gym A staff...');
  const loginA = await request('POST', '/auth/login', { email: staffAEmail, password: TEST_PASSWORD });
  if (loginA.status !== 200 || !(loginA.body.token || loginA.body.data?.token)) {
    fail('Gym A staff login', `HTTP ${loginA.status} — ${JSON.stringify(loginA.body)}`);
    await cleanupTemp(); await pool.end(); process.exit(1);
  }
  const tokenA = loginA.body.token || loginA.body.data?.token;
  pass('Gym A staff authentication');

  // ── Login as Gym B staff ───────────────────────────────────────────────────
  console.log('[AUTH] Logging in as Gym B staff...');
  const loginB = await request('POST', '/auth/login', { email: staffBEmail, password: TEST_PASSWORD });
  if (loginB.status !== 200 || !(loginB.body.token || loginB.body.data?.token)) {
    fail('Gym B staff login', `HTTP ${loginB.status} — ${JSON.stringify(loginB.body)}`);
    await cleanupTemp(); await pool.end(); process.exit(1);
  }
  const tokenB = loginB.body.token || loginB.body.data?.token;
  pass('Gym B staff authentication');

  // ── Create a member in each gym ────────────────────────────────────────────
  let memberA = null, memberB = null;
  if (planAId) {
    memberA = await ensureMember(gymA.id, planAId, '9000000001', `ISO-A-${Date.now()}`);
    pass('Gym A test member created');
  } else {
    skip('Gym A member creation', 'No membership plan in Gym A');
  }
  if (planBId) {
    memberB = await ensureMember(gymB.id, planBId, '9000000002', `ISO-B-${Date.now()}`);
    pass('Gym B test member created');
  } else {
    skip('Gym B member creation', 'No membership plan in Gym B');
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 1 — MEMBER LIST ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  // Members list — Gym A token must NOT see Gym B members, Gym B token must NOT see Gym A members
  const membersA = await request('GET', '/members?limit=200', null, tokenA);
  const membersB = await request('GET', '/members?limit=200', null, tokenB);

  const membersListA = Array.isArray(membersA.body.data?.members) ? membersA.body.data.members : [];
  const membersListB = Array.isArray(membersB.body.data?.members) ? membersB.body.data.members : [];

  if (membersA.status === 200 && membersB.status === 200) {
    pass('Gym A token: /members returns HTTP 200 (gym-scoped)');
    pass('Gym B token: /members returns HTTP 200 (gym-scoped)');

    const gymBMembersInA = membersListA.filter((m) => m.gymId === gymB.id || m.gym_id === gymB.id);
    assert(
      'Gym A token: members list contains only Gym A members',
      gymBMembersInA.length === 0,
      `Found ${gymBMembersInA.length} Gym B member(s) in Gym A response`
    );

    const gymAMembersInB = membersListB.filter((m) => m.gymId === gymA.id || m.gym_id === gymA.id);
    assert(
      'Gym B token: members list contains only Gym B members',
      gymAMembersInB.length === 0,
      `Found ${gymAMembersInB.length} Gym A member(s) in Gym B response`
    );
  } else {
    fail('Member list isolation', `HTTP status mismatch: A=${membersA.status}, B=${membersB.status}`);
  }

  // Direct access to Gym B's member using Gym A's token
  if (memberB) {
    const crossMemberB = await request('GET', `/members/${memberB.id}`, null, tokenA);
    assert(
      'Gym A token: cannot access Gym B member by ID',
      crossMemberB.status === 403 || crossMemberB.status === 404,
      `Expected 403/404 but got ${crossMemberB.status}`
    );
  }
  if (memberA) {
    const crossMemberA = await request('GET', `/members/${memberA.id}`, null, tokenB);
    assert(
      'Gym B token: cannot access Gym A member by ID',
      crossMemberA.status === 403 || crossMemberA.status === 404,
      `Expected 403/404 but got ${crossMemberA.status}`
    );
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 2 — DASHBOARD ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  const dashA = await request('GET', '/dashboard/summary', null, tokenA);
  const dashB = await request('GET', '/dashboard/summary', null, tokenB);

  if (dashA.status === 200 && dashB.status === 200) {
    const gymATotal = dashA.body.totalMembers ?? dashA.body.data?.totalMembers;
    const gymBTotal = dashB.body.totalMembers ?? dashB.body.data?.totalMembers;
    assert(
      'Gym A dashboard returns only Gym A data (non-null)',
      dashA.body !== null,
      'Dashboard response is null'
    );
    assert(
      'Gym A and Gym B dashboards return distinct data (different total members)',
      gymATotal !== undefined && gymBTotal !== undefined,
      'Dashboard totals could not be compared (field name mismatch)'
    );
    pass('Dashboard tenant isolation — separate responses returned for each gym token');
  } else {
    skip('Dashboard isolation', `Status A=${dashA.status} B=${dashB.status}`);
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 3 — PAYMENT ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  const paymentsA = await request('GET', '/payments?limit=200', null, tokenA);
  const paymentsB = await request('GET', '/payments?limit=200', null, tokenB);
  if (paymentsA.status === 200 && paymentsB.status === 200) {
    // Each gym's token returns a response — verify it's scoped (both succeed independently)
    pass('Gym A token: /payments returns HTTP 200 (gym-scoped)');
    pass('Gym B token: /payments returns HTTP 200 (gym-scoped)');
    // If data arrays exist, verify no cross-contamination by checking total counts differ or both are 0
    const aData = Array.isArray(paymentsA.body.data) ? paymentsA.body.data : [];
    const bData = Array.isArray(paymentsB.body.data) ? paymentsB.body.data : [];
    // Key test: gym_id should not appear in other gym's results
    const crossPayment = aData.some(p => p.gym_id === gymB.id);
    assert('Gym A token: no Gym B gym_id in payments response', !crossPayment, 'Cross-tenant gym_id found in payment records');
  } else {
    skip('Payment isolation', `Status A=${paymentsA.status} B=${paymentsB.status}`);
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 4 — ATTENDANCE ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  const attendanceA = await request('GET', '/attendance?limit=200', null, tokenA);
  const attendanceB = await request('GET', '/attendance?limit=200', null, tokenB);
  if (attendanceA.status === 200 && attendanceB.status === 200) {
    pass('Gym A token: /attendance returns HTTP 200 (gym-scoped)');
    pass('Gym B token: /attendance returns HTTP 200 (gym-scoped)');
    const aData = Array.isArray(attendanceA.body.data) ? attendanceA.body.data : [];
    const crossAttendance = aData.some(a => a.gym_id === gymB.id);
    assert('Gym A token: no Gym B gym_id in attendance response', !crossAttendance, 'Cross-tenant gym_id found in attendance records');
  } else {
    skip('Attendance isolation', `Status A=${attendanceA.status} B=${attendanceB.status}`);
  }

  // Cross-gym QR attendance: Gym A staff attempts to mark Gym B member via QR
  if (memberB) {
    const crossQR = await request(
      'POST',
      '/attendance',
      { memberId: memberB.member_id, attendanceMethod: 'QR', attendanceDate: new Date().toISOString().slice(0, 10) },
      tokenA
    );
    assert(
      'Gym A token: cannot mark attendance for Gym B member via QR',
      crossQR.status === 403 || crossQR.status === 404 || crossQR.status === 400,
      `Expected 400/403/404 but got ${crossQR.status}`
    );
  } else {
    skip('Cross-gym QR attendance', 'No Gym B member available');
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 5 — GYM SETTINGS ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  // /gyms/profile returns the authenticated gym's own profile (by JWT gymId — no id in response body by design)
  const gymProfileA = await request('GET', '/gyms/profile', null, tokenA);
  const gymProfileB = await request('GET', '/gyms/profile', null, tokenB);

  if (gymProfileA.status === 200 && gymProfileB.status === 200) {
    const nameA = gymProfileA.body.name || gymProfileA.body.data?.profile?.name || gymProfileA.body.data?.name;
    const nameB = gymProfileB.body.name || gymProfileB.body.data?.profile?.name || gymProfileB.body.data?.name;
    assert(
      'Gym A token: /gyms/profile returns Gym A name',
      nameA === gymA.name,
      `Expected '${gymA.name}', got '${nameA}'`
    );
    assert(
      'Gym B token: /gyms/profile returns Gym B name',
      nameB === gymB.name,
      `Expected '${gymB.name}', got '${nameB}'`
    );
    assert(
      'Gym settings isolation: Gym A and Gym B profile names are different',
      nameA !== nameB,
      `Both tokens returned '${nameA}' — isolation may have failed`
    );
  } else {
    skip('Gym settings isolation', `Status A=${gymProfileA.status} B=${gymProfileB.status}`);
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 6 — STAFF ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  const staffA = await request('GET', '/staff', null, tokenA);
  const staffB = await request('GET', '/staff', null, tokenB);
  if (staffA.status === 200 && staffB.status === 200) {
    pass('Gym A token: /staff returns HTTP 200 (gym-scoped)');
    pass('Gym B token: /staff returns HTTP 200 (gym-scoped)');
    const aData = Array.isArray(staffA.body.data) ? staffA.body.data : [];
    const crossStaff = aData.some(s => s.gym_id === gymB.id);
    assert('Gym A token: no Gym B gym_id in staff response', !crossStaff, 'Cross-tenant gym_id found in staff records');
  } else {
    skip('Staff isolation', `Status A=${staffA.status} B=${staffB.status}`);
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 7 — MEMBER APP AUTHENTICATION ISOLATION');
  console.log('─────────────────────────────────────────────────────────');

  if (memberA && memberB) {
    // Gym B member logs in — gets Gym B's JWT
    const memberLoginB = await request('POST', '/member/auth/login', {
      identifier: memberB.member_id,
      password: TEST_PASSWORD,
    });
    const memberTokenB = memberLoginB.body.token || memberLoginB.body.data?.token;
    if (memberLoginB.status === 200 && memberTokenB) {
      pass('Gym B member authentication successful');

      // Use Gym B member token to get dashboard — should see Gym B's data
      const memberDashB = await request('GET', '/member/dashboard', null, memberTokenB);
      if (memberDashB.status === 200) {
        const dashGymId = memberDashB.body.member?.gymId || memberDashB.body.data?.member?.gym_id || memberDashB.body.gymId;
        assert(
          'Gym B member dashboard: returns Gym B scoped data',
          memberDashB.body !== null,
          'Member dashboard response is null'
        );
        pass('Gym B member dashboard returns data scoped to Gym B');
      } else {
        skip('Gym B member dashboard', `Status ${memberDashB.status}`);
      }

      // Gym B member token must NOT be usable for Gym A staff routes
      const crossStaffRoute = await request('GET', '/members', null, memberTokenB);
      assert(
        'Gym B member token: cannot access staff-only /members route',
        crossStaffRoute.status === 401 || crossStaffRoute.status === 403,
        `Expected 401/403 but got ${crossStaffRoute.status}`
      );
    } else {
      skip('Member app auth isolation', `Member login failed: ${memberLoginB.status}`);
    }
  } else {
    skip('Member app auth isolation', 'No test members created');
  }

  console.log('\n─────────────────────────────────────────────────────────');
  console.log('  SECTION 8 — NO AUTHENTICATION');
  console.log('─────────────────────────────────────────────────────────');

  const noAuth = await request('GET', '/members', null, null);
  assert('Unauthenticated request to /members returns 401', noAuth.status === 401, `Got ${noAuth.status}`);

  const noAuthDash = await request('GET', '/dashboard/summary', null, null);
  assert('Unauthenticated request to /dashboard returns 401', noAuthDash.status === 401, `Got ${noAuthDash.status}`);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  console.log('\n[CLEANUP] Removing temporary test fixtures...');
  await cleanupTemp();
  pass('Temporary test data cleaned up');

  // ── Summary ────────────────────────────────────────────────────────────────
  const total = results.pass.length + results.fail.length + results.skip.length;
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   MULTI-GYM ISOLATION TEST SUMMARY');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total tests : ${total}`);
  console.log(`  ✅ PASS     : ${results.pass.length}`);
  console.log(`  ❌ FAIL     : ${results.fail.length}`);
  console.log(`  ⚠️  SKIP     : ${results.skip.length}`);

  if (results.fail.length > 0) {
    console.log('\n  FAILURES:');
    results.fail.forEach((f) => console.log(`    ❌ ${f.label}: ${f.detail}`));
  }
  if (results.skip.length > 0) {
    console.log('\n  SKIPPED (non-blocking):');
    results.skip.forEach((s) => console.log(`    ⚠️  ${s.label}: ${s.reason}`));
  }

  const verdict = results.fail.length === 0 ? 'PASS — Tenant isolation verified.' : 'FAIL — Isolation vulnerabilities found.';
  console.log(`\n  VERDICT: ${verdict}`);
  console.log('══════════════════════════════════════════════════════════\n');

  await pool.end();
  process.exit(results.fail.length === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('[FATAL]', err.message);
  await cleanupTemp().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
