require('../apps/api/node_modules/dotenv').config({ path: './apps/api/.env' });
const http = require('http');
const { pool } = require('../apps/api/src/db/pool');

const BASE_URL = 'http://localhost:5000/api/v1';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS  ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${testName}`);
    failed++;
  }
}

async function runTrialTestSuite() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   GYMPULSE — 3-DAY TRIAL & SUBSCRIPTION TEST RUNNER   ');
  console.log('══════════════════════════════════════════════════════════\n');

  const testEmail = `trial_owner_${Date.now()}@example.com`;
  let ownerToken = null;
  let gymId = null;

  try {
    // 1. Signup New Owner
    const signupRes = await makeRequest('POST', '/auth/create-gym-account', {
      gymName: 'Trial Test Fitness',
      firstName: 'Trial',
      lastName: 'Owner',
      email: testEmail,
      phone: '9998887776',
      password: 'Password@123'
    });

    assert(signupRes.status === 201 && signupRes.data.success, '1. New owner signup succeeds');
    ownerToken = signupRes.data.data.token;
    gymId = signupRes.data.data.gym.id || signupRes.data.data.owner.gymId;
    console.log('DEBUG signupRes.data:', signupRes.data);

    // 2 & 3. Check Gym DB for 3-Day Trial Timestamps
    const dbGymRes = await pool.query(
      `SELECT trial_started_at, trial_ends_at, subscription_status FROM gyms WHERE id = $1`,
      [gymId]
    );
    const gymRow = dbGymRes.rows[0];
    console.log('DEBUG gymRow:', gymRow);

    assert(gymRow && gymRow.subscription_status === 'TRIAL', '2. New owner receives subscription_status = "TRIAL"');
    
    const startedAt = new Date(gymRow.trial_started_at);
    const endsAt = new Date(gymRow.trial_ends_at);
    const diffDays = Math.round((endsAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
    assert(diffDays === 3, '3. trial_ends_at is set to exactly +3 days from trial_started_at');

    // 4. Login during trial works
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'Password@123'
    });
    assert(loginRes.status === 200 && loginRes.data.success, '4. Login during trial works');

    // 5. Growth features work during trial
    const membersRes = await makeRequest('GET', '/members', null, ownerToken);
    assert(membersRes.status === 200, '5. Growth features (/members) work during active trial');

    // 6. Pro staff management blocked during trial
    const staffRes = await makeRequest('GET', '/staff', null, ownerToken);
    assert(staffRes.status === 403 && staffRes.data.error?.code === 'FEATURE_LOCKED', '6. Pro feature (/staff) returns 403 FEATURE_LOCKED during trial');

    // 7. Classes blocked during trial
    const classesRes = await makeRequest('GET', '/classes', null, ownerToken);
    assert(classesRes.status === 403 && classesRes.data.error?.code === 'FEATURE_LOCKED', '7. Gym + Classes feature (/classes) returns 403 FEATURE_LOCKED during trial');

    // 8. WhatsApp blocked during trial
    const waRes = await makeRequest('GET', '/whatsapp/settings', null, ownerToken);
    assert(waRes.status === 403 && waRes.data.error?.code === 'FEATURE_LOCKED', '8. WhatsApp automation returns 403 FEATURE_LOCKED during trial');

    // 9. Advanced Analytics blocked during trial
    const analyticsRes = await makeRequest('GET', '/dashboard/analytics', null, ownerToken);
    assert(analyticsRes.status === 403 && analyticsRes.data.error?.code === 'FEATURE_LOCKED', '9. Advanced Analytics returns 403 FEATURE_LOCKED during trial');

    // 10, 11, 12. Verify Trial Timestamp Stability (No Reset on Re-login or Query)
    const secondLoginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'Password@123'
    });
    const recheckedGym = await pool.query(
      `SELECT trial_started_at, trial_ends_at FROM gyms WHERE id = $1`,
      [gymId]
    );
    assert(
      recheckedGym.rows[0].trial_started_at.toISOString() === startedAt.toISOString(),
      '10, 11, 12. trial_started_at remains identical on second login (never resets)'
    );

    // 13 & 14 & 15. Simulate Expired Trial
    await pool.query(
      `UPDATE gyms SET trial_ends_at = NOW() - INTERVAL '1 hour' WHERE id = $1`,
      [gymId]
    );

    const expiredLoginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'Password@123'
    });
    assert(expiredLoginRes.status === 200, '14. Expired owner can still log in');

    const expiredMembersRes = await makeRequest('GET', '/members', null, ownerToken);
    assert(
      expiredMembersRes.status === 403 && expiredMembersRes.data.error?.code === 'SUBSCRIPTION_REQUIRED',
      '13 & 15. Protected product API (/members) returns HTTP 403 SUBSCRIPTION_REQUIRED after trial expiry'
    );

    // 16. Subscription / Plans area remains accessible after expiry
    const summaryRes = await makeRequest('GET', '/dashboard/summary', null, ownerToken);
    console.log('DEBUG summaryRes.data:', summaryRes.data);
    assert(summaryRes.status === 200 && summaryRes.data?.data?.isTrialExpired, '16. Dashboard summary / subscription endpoint remains accessible after expiry');

    // 17. Paid Growth subscription activation
    await pool.query(
      `UPDATE gyms SET subscription_status = 'ACTIVE', subscription_plan = 'Growth', subscription_end_date = CURRENT_DATE + INTERVAL '1 year' WHERE id = $1`,
      [gymId]
    );
    const paidGrowthMembers = await makeRequest('GET', '/members', null, ownerToken);
    const paidGrowthStaff = await makeRequest('GET', '/staff', null, ownerToken);
    assert(
      paidGrowthMembers.status === 200 && paidGrowthStaff.status === 403,
      '17. Paid Growth restores Growth features and continues blocking Pro/Classes'
    );

    // 18. Paid Pro subscription activation
    await pool.query(
      `UPDATE gyms SET subscription_status = 'ACTIVE', subscription_plan = 'Pro' WHERE id = $1`,
      [gymId]
    );
    const paidProStaff = await makeRequest('GET', '/staff', null, ownerToken);
    const paidProClasses = await makeRequest('GET', '/classes', null, ownerToken);
    assert(
      paidProStaff.status === 200 && paidProClasses.status === 403,
      '18. Paid Pro restores Growth + Pro features and continues blocking Classes'
    );

    // 19. Paid Gym + Classes subscription activation
    await pool.query(
      `UPDATE gyms SET subscription_status = 'ACTIVE', subscription_plan = 'Gym + Classes' WHERE id = $1`,
      [gymId]
    );
    const paidClassesRes = await makeRequest('GET', '/classes', null, ownerToken);
    assert(paidClassesRes.status === 200, '19. Paid Gym + Classes restores Growth + Pro + Classes access');

  } catch (err) {
    console.error('Test Suite Error:', err);
    failed++;
  } finally {
    if (gymId) {
      await pool.query(`DELETE FROM staff WHERE gym_id = $1`, [gymId]);
      await pool.query(`DELETE FROM gyms WHERE id = $1`, [gymId]);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`   TEST SUMMARY: Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
  console.log('══════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTrialTestSuite();
