/**
 * MASTER SUPER ADMIN AUTOMATED PRODUCTION TEST SUITE — v1.0.4
 *
 * Tests all Super Admin Control Center capabilities:
 * 1. Super Admin Authentication & Token Separation
 * 2. Strict Server-Side Authorization (Rejecting Owner, Staff, Member tokens)
 * 3. Platform Dashboard Summary (MRR, ARR, Operations, Health)
 * 4. Gyms Directory, Search, & Status Filters
 * 5. Gym Detail, Lifecycle Actions (Suspend, Reactivate, Extend Trial, Change Plan, Adjust Locations)
 * 6. Subscriptions & Subscription Event History
 * 7. Revenue & Financial Analytics (Strict B2B SaaS MRR/ARR accounting)
 * 8. Usage & Unit Economics (WhatsApp direct cost, Shared infra allocation, Contribution margins)
 * 9. WhatsApp Operations & Delivery Intelligence (Masked logs, Failure reasons, Modes)
 * 10. Platform Users Directory (Masked phones, Role filtering)
 * 11. Alerts Center (Lifecycle: ACTIVE -> ACKNOWLEDGED -> RESOLVED)
 * 12. Immutable Security Audit Logs (State diff inspection)
 * 13. System Health Telemetry (Truthful live probe)
 * 14. Settings & Admin User Access Management (Cost rules, New admin, Deactivation)
 */

const http = require('http');
const assert = require('assert');
const jwt = require('../apps/api/node_modules/jsonwebtoken');
const { pool } = require('../apps/api/src/db/pool');
const { ensureSchema } = require('../apps/api/src/db/migrate');
const { app } = require('../apps/api/src/app');
const { env } = require('../apps/api/src/config/env');

let server;
let baseUrl;
let superAdminToken;
let superAdminUser;
let ownerToken;
let staffToken;
let memberToken;
let testGymId;
let testOwnerId;
let testGymName;

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result
        .then(() => {
          testsPassed++;
          console.log(`  ✓ ${name}`);
        })
        .catch((err) => {
          console.error(`  ✗ ${name}`);
          console.error(`    Error: ${err.message}`);
          throw err;
        });
    } else {
      testsPassed++;
      console.log(`  ✓ ${name}`);
      return Promise.resolve();
    }
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    return Promise.reject(err);
  }
}

async function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function setupTestData() {
  console.log('--- Initializing Test Environment & Database ---');
  await ensureSchema();

  // Create a dedicated test gym
  testGymName = `OBO Test Center ${Date.now()}`;
  const gymEmail = `admin-gym-${Date.now()}@test.fit`;
  const gymPhone = '98765' + Math.floor(10000 + Math.random() * 90000);

  const gymRes = await pool.query(
    `INSERT INTO gyms (
      name, owner_name, email, phone, address, city, state, country, pincode,
      subscription_plan, subscription_start_date, subscription_end_date, is_active,
      subscription_status, is_multi_gym, max_locations, billing_cycle
     ) VALUES ($1, 'Test Owner', $2, $3, '100 Marine Drive', 'Mumbai', 'Maharashtra', 'India', '400020',
      'Growth', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', true,
      'ACTIVE', false, 1, 'monthly'
     ) RETURNING *`,
    [testGymName, gymEmail, gymPhone]
  );
  testGymId = gymRes.rows[0].id;

  // Create test owner staff record
  const ownerEmail = `owner-${Date.now()}@test.fit`;
  const ownerRes = await pool.query(
    `INSERT INTO staff (
      gym_id, first_name, last_name, email, phone, role, password_hash, is_active, created_at, updated_at
     ) VALUES ($1, 'Test', 'Owner', $2, '9876543210', 'Owner', 'hash123', true, NOW(), NOW())
     RETURNING *`,
    [testGymId, ownerEmail]
  );
  testOwnerId = ownerRes.rows[0].id;

  // Ensure default super admin exists
  const adminRes = await pool.query(
    `SELECT * FROM admin_users WHERE email = 'admin@obo.fit' AND is_active = true LIMIT 1`
  );
  assert(adminRes.rows.length > 0, 'Default super admin must exist in DB');

  // Owner token
  ownerToken = jwt.sign(
    { userId: testOwnerId, gymId: testGymId, role: 'OWNER' },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

  // Staff token
  staffToken = jwt.sign(
    { userId: 'staff-123', gymId: testGymId, role: 'RECEPTIONIST' },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

  // Member token
  memberToken = jwt.sign(
    { userId: 'member-123', gymId: testGymId, role: 'MEMBER' },
    env.jwtSecret,
    { expiresIn: '1d' }
  );

  console.log(`Test Gym ID: ${testGymId}`);
}

async function runSuite() {
  console.log('================================================================');
  console.log(' GYMPULSE / OBO — SUPER ADMIN CONTROL CENTER PRODUCTION SUITE  ');
  console.log('================================================================\n');

  await setupTestData();

  // Start API server on ephemeral port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`API test server running at ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // MODULE 1: SUPER ADMIN AUTHENTICATION
    // -------------------------------------------------------------
    console.log('--- MODULE 1: Super Admin Authentication ---');

    await runTest('POST /api/v1/admin/auth/login rejects non-existent email', async () => {
      const res = await request('POST', '/api/v1/admin/auth/login', {}, {
        email: 'nobody@nowhere.com',
        password: 'password123',
      });
      assert.strictEqual(res.status, 401);
    });

    await runTest('POST /api/v1/admin/auth/login rejects incorrect password', async () => {
      const res = await request('POST', '/api/v1/admin/auth/login', {}, {
        email: 'admin@obo.fit',
        password: 'wrong_password',
      });
      assert.strictEqual(res.status, 401);
    });

    await runTest('POST /api/v1/admin/auth/login authenticates with valid credentials', async () => {
      const res = await request('POST', '/api/v1/admin/auth/login', {}, {
        email: 'admin@obo.fit',
        password: 'Admin@123456',
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.token, 'Must return token');
      assert.strictEqual(res.data.data.admin.email, 'admin@obo.fit');
      assert.strictEqual(res.data.data.admin.role, 'SUPER_ADMIN');
      superAdminToken = res.data.data.token;
      superAdminUser = res.data.data.admin;
    });

    await runTest('GET /api/v1/admin/auth/me returns authenticated super admin', async () => {
      const res = await request('GET', '/api/v1/admin/auth/me', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.admin.email, 'admin@obo.fit');
      assert.strictEqual(res.data.data.admin.role, 'SUPER_ADMIN');
    });

    await runTest('GET /api/v1/admin/auth/me rejects unauthenticated request', async () => {
      const res = await request('GET', '/api/v1/admin/auth/me', {});
      assert.strictEqual(res.status, 401);
    });

    // -------------------------------------------------------------
    // MODULE 2: STRICT SERVER-SIDE AUTHORIZATION (RBAC)
    // -------------------------------------------------------------
    console.log('\n--- MODULE 2: Strict Super Admin RBAC & Tenant Isolation ---');

    await runTest('Reject Gym Owner token from Super Admin routes with 403 Forbidden', async () => {
      const res = await request('GET', '/api/v1/admin/dashboard', {
        Authorization: `Bearer ${ownerToken}`,
      });
      assert.strictEqual(res.status, 403);
    });

    await runTest('Reject Gym Staff token from Super Admin routes with 403 Forbidden', async () => {
      const res = await request('GET', '/api/v1/admin/gyms', {
        Authorization: `Bearer ${staffToken}`,
      });
      assert.strictEqual(res.status, 403);
    });

    await runTest('Reject Member token from Super Admin routes with 403 Forbidden', async () => {
      const res = await request('GET', '/api/v1/admin/subscriptions', {
        Authorization: `Bearer ${memberToken}`,
      });
      assert.strictEqual(res.status, 403);
    });

    // -------------------------------------------------------------
    // MODULE 3: DASHBOARD SUMMARY TELEMETRY
    // -------------------------------------------------------------
    console.log('\n--- MODULE 3: Dashboard Summary Telemetry ---');

    await runTest('GET /api/v1/admin/dashboard returns platform metrics', async () => {
      const res = await request('GET', '/api/v1/admin/dashboard', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert(data.primaryMetrics, 'Must include primaryMetrics');
      assert(typeof data.primaryMetrics.totalGyms === 'number');
      assert(typeof data.primaryMetrics.activeGyms === 'number');
      assert(data.businessMetrics, 'Must include businessMetrics');
      assert(typeof data.businessMetrics.mrr === 'number');
      assert(typeof data.businessMetrics.arr === 'number');
      assert(data.operations, 'Must include operations');
      assert(data.systemHealth, 'Must include systemHealth');
    });

    // -------------------------------------------------------------
    // MODULE 4: GYMS DIRECTORY & FILTERING
    // -------------------------------------------------------------
    console.log('\n--- MODULE 4: Gyms Directory & Filtering ---');

    await runTest('GET /api/v1/admin/gyms returns paginated list of gyms', async () => {
      const res = await request('GET', '/api/v1/admin/gyms?page=1&limit=10', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.gyms));
      assert(res.data.data.gyms.length > 0);
      assert(res.data.data.total >= 1);
      assert.strictEqual(res.data.data.page, 1);
    });

    await runTest('GET /api/v1/admin/gyms filters by status', async () => {
      const res = await request('GET', '/api/v1/admin/gyms?status=ACTIVE', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      for (const gym of res.data.data.gyms) {
        assert.strictEqual(gym.subscriptionStatus.toUpperCase(), 'ACTIVE');
      }
    });

    await runTest('GET /api/v1/admin/gyms searches by gym name', async () => {
      const res = await request('GET', `/api/v1/admin/gyms?search=OBO+Test+Center`, {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(res.data.data.gyms.some((g) => g.id === testGymId));
    });

    await runTest('GET /api/v1/admin/gyms returns only canonical plans and supports plan filtering', async () => {
      const res = await request('GET', '/api/v1/admin/gyms?limit=50', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const canonicalPlans = ['Growth', 'Pro', 'Gym + Classes'];
      for (const gym of res.data.data.gyms) {
        assert(
          canonicalPlans.includes(gym.subscriptionPlan),
          `Gym plan "${gym.subscriptionPlan}" must be canonical (${canonicalPlans.join(', ')})`
        );
        assert.notStrictEqual(gym.subscriptionPlan.toUpperCase(), 'STARTER');
        assert.notStrictEqual(gym.subscriptionPlan.toUpperCase(), 'ENTERPRISE');
      }

      // Filter by Growth
      const filterRes = await request('GET', '/api/v1/admin/gyms?plan=Growth', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(filterRes.status, 200);
      for (const gym of filterRes.data.data.gyms) {
        assert.strictEqual(gym.subscriptionPlan, 'Growth');
      }
    });

    // -------------------------------------------------------------
    // MODULE 5: GYM DETAIL & OPERATIONAL ACTIONS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 5: Gym Detail & Operational Actions ---');

    await runTest('GET /api/v1/admin/gyms/:id returns full tenant profile & usage', async () => {
      const res = await request('GET', `/api/v1/admin/gyms/${testGymId}`, {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.gym.id, testGymId);
      assert(res.data.data.members, 'Must return members summary');
      assert(Array.isArray(res.data.data.recentAuditHistory));
    });

    await runTest('POST /api/v1/admin/gyms/:id/suspend suspends tenant and logs event', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/gyms/${testGymId}/suspend`,
        { Authorization: `Bearer ${superAdminToken}` },
        { reason: 'Overdue balance test' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.subscription_status, 'SUSPENDED');

      // Verify audit log
      const auditRes = await pool.query(
        `SELECT * FROM admin_audit_logs WHERE action = 'GYM_SUSPENDED' AND gym_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(auditRes.rows.length, 1);

      // Verify subscription history event
      const histRes = await pool.query(
        `SELECT * FROM gym_subscription_history WHERE gym_id = $1 AND event_type = 'SUSPENDED' ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(histRes.rows.length, 1);
    });

    await runTest('POST /api/v1/admin/gyms/:id/reactivate reactivates suspended tenant', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/gyms/${testGymId}/reactivate`,
        { Authorization: `Bearer ${superAdminToken}` },
        { reason: 'Payment cleared via wire' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.subscription_status, 'ACTIVE');

      // Verify audit log
      const auditRes = await pool.query(
        `SELECT * FROM admin_audit_logs WHERE action = 'GYM_REACTIVATED' AND gym_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(auditRes.rows.length, 1);
    });

    await runTest('POST /api/v1/admin/gyms/:id/extend-trial extends trial days', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/gyms/${testGymId}/extend-trial`,
        { Authorization: `Bearer ${superAdminToken}` },
        { days: 14, reason: 'Sales requested extension' }
      );
      assert.strictEqual(res.status, 200);
      assert(res.data.data.trial_ends_at, 'Trial ends at must be populated');

      const histRes = await pool.query(
        `SELECT * FROM gym_subscription_history WHERE gym_id = $1 AND event_type = 'TRIAL_EXTENDED' ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(histRes.rows.length, 1);
    });

    await runTest('POST /api/v1/admin/gyms/:id/change-subscription upgrades plan & cycle', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/gyms/${testGymId}/change-subscription`,
        { Authorization: `Bearer ${superAdminToken}` },
        { subscriptionPlan: 'Gym + Classes', billingCycle: 'yearly', reason: 'Customer upgraded to Gym + Classes Annual' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.subscription_plan, 'Gym + Classes');
      assert.strictEqual(res.data.data.billing_cycle, 'yearly');

      const histRes = await pool.query(
        `SELECT * FROM gym_subscription_history WHERE gym_id = $1 AND event_type = 'PLAN_UPGRADE' ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(histRes.rows.length, 1);
      assert.strictEqual(histRes.rows[0].plan, 'Gym + Classes');
      assert.strictEqual(histRes.rows[0].billing_cycle, 'yearly');
    });

    await runTest('POST /api/v1/admin/gyms/:id/adjust-locations overrides max physical locations', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/gyms/${testGymId}/adjust-locations`,
        { Authorization: `Bearer ${superAdminToken}` },
        { maxLocations: 5, reason: 'Multi-franchise expansion grant' }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.max_locations, 5);

      const auditRes = await pool.query(
        `SELECT * FROM admin_audit_logs WHERE action = 'LOCATION_LIMIT_CHANGED' AND gym_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [testGymId]
      );
      assert.strictEqual(auditRes.rows.length, 1);
    });

    // -------------------------------------------------------------
    // MODULE 6: SUBSCRIPTIONS & EVENT HISTORY
    // -------------------------------------------------------------
    console.log('\n--- MODULE 6: Subscriptions & Lifecycle History ---');

    await runTest('GET /api/v1/admin/subscriptions returns all tenant subscriptions with canonical plans', async () => {
      const res = await request('GET', '/api/v1/admin/subscriptions?search=OBO+Test+Center', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.subscriptions));
      assert(res.data.data.subscriptions.some((s) => s.gymId === testGymId));

      // Assert CANONICAL plans only (Growth, Pro, Gym + Classes) and no STARTER / ENTERPRISE
      const canonicalPlans = ['Growth', 'Pro', 'Gym + Classes'];
      for (const sub of res.data.data.subscriptions) {
        assert(
          canonicalPlans.includes(sub.plan),
          `Subscription plan "${sub.plan}" must be one of ${canonicalPlans.join(', ')}`
        );
        assert.notStrictEqual(sub.plan.toUpperCase(), 'STARTER', 'STARTER must never appear in subscriptions');
        assert.notStrictEqual(sub.plan.toUpperCase(), 'ENTERPRISE', 'ENTERPRISE must never appear in subscriptions');
      }
    });

    await runTest('GET /api/v1/admin/subscriptions/history returns global event history with canonical plans', async () => {
      const res = await request('GET', '/api/v1/admin/subscriptions/history?limit=50', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.history));
      assert(res.data.data.history.some((h) => h.gymId === testGymId && h.eventType === 'PLAN_UPGRADE'));

      const canonicalPlans = ['Growth', 'Pro', 'Gym + Classes'];
      for (const item of res.data.data.history) {
        assert(
          canonicalPlans.includes(item.plan),
          `History plan "${item.plan}" must be one of ${canonicalPlans.join(', ')}`
        );
        assert.notStrictEqual(item.plan.toUpperCase(), 'STARTER', 'STARTER must never appear in history');
        assert.notStrictEqual(item.plan.toUpperCase(), 'ENTERPRISE', 'ENTERPRISE must never appear in history');
      }
    });

    // -------------------------------------------------------------
    // MODULE 7: REVENUE & FINANCIAL ANALYTICS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 7: Revenue & Financial Analytics ---');

    await runTest('GET /api/v1/admin/revenue calculates accurate B2B MRR and ARR strictly from canonical plans', async () => {
      const res = await request('GET', '/api/v1/admin/revenue', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert(typeof data.mrr === 'number');
      assert(data.mrr > 0, 'MRR must be positive with active gym');
      assert.strictEqual(data.arr, Math.round(data.mrr * 12 * 100) / 100, 'ARR must strictly equal round(MRR * 12)');
      assert(Array.isArray(data.byPlan), 'Must return byPlan array');
      assert(Array.isArray(data.byCycle), 'Must return byCycle array');

      // Canonical plans validation
      const canonicalPlans = ['Growth', 'Pro', 'Gym + Classes'];
      for (const planGroup of data.byPlan) {
        assert(
          canonicalPlans.includes(planGroup.plan),
          `Revenue byPlan "${planGroup.plan}" must be one of ${canonicalPlans.join(', ')}`
        );
        assert.notStrictEqual(planGroup.plan.toUpperCase(), 'STARTER', 'STARTER must not exist in revenue byPlan');
        assert.notStrictEqual(planGroup.plan.toUpperCase(), 'ENTERPRISE', 'ENTERPRISE must not exist in revenue byPlan');
      }
    });

    // -------------------------------------------------------------
    // MODULE 8: USAGE & UNIT COSTS ANALYTICS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 8: Usage & Operating Costs Analytics ---');

    let createdCostId;
    await runTest('POST /api/v1/admin/usage-costs/operating-costs records platform expense', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/usage-costs/operating-costs',
        { Authorization: `Bearer ${superAdminToken}` },
        {
          category: 'HOSTING',
          provider: 'AWS Lightsail',
          amount: 3000,
          month: '2026-09',
          notes: 'Production Node Server Cluster',
        }
      );
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.category, 'HOSTING');
      assert.strictEqual(Number(res.data.data.amount), 3000);
      createdCostId = res.data.data.id;
    });

    await runTest('GET /api/v1/admin/usage-costs returns per-gym economics & gross margin', async () => {
      const res = await request('GET', '/api/v1/admin/usage-costs?month=2026-09', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert(data.companyEconomics, 'Must return companyEconomics');
      assert(typeof data.companyEconomics.totalCosts === 'number');
      assert(typeof data.companyEconomics.contributionMarginPct === 'number');
      assert(Array.isArray(data.gyms), 'Must return gyms array');
    });

    // -------------------------------------------------------------
    // MODULE 9: WHATSAPP OPERATIONS & DELIVERY INTELLIGENCE
    // -------------------------------------------------------------
    console.log('\n--- MODULE 9: WhatsApp Operations & Intelligence ---');

    await runTest('GET /api/v1/admin/whatsapp/operations returns throughput & modes', async () => {
      // Seed a test whatsapp log
      await pool.query(
        `INSERT INTO whatsapp_logs (gym_id, phone_number, automation_type, template_name, status, error_message, sent_at)
         VALUES ($1, '919876543210', 'PAYMENT_REMINDER', 'payment_reminder_v1', 'DELIVERED', NULL, NOW())`,
        [testGymId]
      );

      const res = await request('GET', '/api/v1/admin/whatsapp/operations?days=30', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert(typeof data.totalMessages === 'number');
      assert(typeof data.deliveryRatePct === 'number');
      assert(data.gymConnectionModes, 'Must return connection modes breakdown');
    });

    await runTest('GET /api/v1/admin/whatsapp/logs returns masked operational logs', async () => {
      const res = await request('GET', '/api/v1/admin/whatsapp/logs?limit=10', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.logs));
      assert(res.data.data.logs.length > 0);
      const log = res.data.data.logs[0];
      assert(log.maskedPhone.includes('*****') || log.maskedPhone.includes('••••'), 'Phone number must be masked in admin responses');
    });

    // -------------------------------------------------------------
    // MODULE 10: PLATFORM USERS DIRECTORY
    // -------------------------------------------------------------
    console.log('\n--- MODULE 10: Platform Users Directory ---');

    await runTest('GET /api/v1/admin/users returns platform directory with masked numbers', async () => {
      const res = await request('GET', '/api/v1/admin/users?role=OWNER&page=1&limit=10', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.users));
      const user = res.data.data.users.find((u) => u.id === testOwnerId);
      assert(user, 'Test owner must appear in users directory');
      assert(user.maskedPhone.includes('*****') || user.maskedPhone.includes('••••'), 'Owner phone must be masked in directory');
    });

    // -------------------------------------------------------------
    // MODULE 11: ALERTS CENTER
    // -------------------------------------------------------------
    console.log('\n--- MODULE 11: Operational Alerts Center ---');

    let testAlertId;
    await runTest('GET /api/v1/admin/alerts returns active platform alerts', async () => {
      const alertKey = `wa-spike-${Date.now()}`;
      const alertRes = await pool.query(
        `INSERT INTO platform_alerts (gym_id, alert_key, severity, title, description, status, created_at)
         VALUES ($1, $2, 'HIGH', 'Spike in WhatsApp Failures', 'Tenant delivery dropped below 80%', 'ACTIVE', NOW())
         RETURNING *`,
        [testGymId, alertKey]
      );
      testAlertId = alertRes.rows[0].id;

      const res = await request('GET', '/api/v1/admin/alerts?status=ACTIVE', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.alerts));
      assert(res.data.data.alerts.some((a) => a.id === testAlertId));
    });

    await runTest('POST /api/v1/admin/alerts/:id/acknowledge acknowledges alert', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/alerts/${testAlertId}/acknowledge`,
        { Authorization: `Bearer ${superAdminToken}` }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'ACKNOWLEDGED');
    });

    await runTest('POST /api/v1/admin/alerts/:id/resolve resolves alert', async () => {
      const res = await request(
        'POST',
        `/api/v1/admin/alerts/${testAlertId}/resolve`,
        { Authorization: `Bearer ${superAdminToken}` }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'RESOLVED');
    });

    // -------------------------------------------------------------
    // MODULE 12: IMMUTABLE AUDIT LOGS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 12: Immutable Audit Logs ---');

    await runTest('GET /api/v1/admin/audit-logs returns complete history with state diffs', async () => {
      const res = await request('GET', '/api/v1/admin/audit-logs?page=1&limit=20', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.logs));
      assert(res.data.data.logs.length > 0);
      const log = res.data.data.logs[0];
      assert(log.action, 'Audit log must specify action');
      assert(log.createdAt, 'Audit log must specify timestamp');
    });

    // -------------------------------------------------------------
    // MODULE 13: SYSTEM HEALTH TELEMETRY
    // -------------------------------------------------------------
    console.log('\n--- MODULE 13: Truthful System Health Telemetry ---');

    await runTest('GET /api/v1/admin/system-health returns live probe of API, DB, and services', async () => {
      const res = await request('GET', '/api/v1/admin/system-health', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      const data = res.data.data;
      assert(data.api, 'Must probe API');
      assert(['HEALTHY', 'UP'].includes(data.api.status));
      assert(['HEALTHY', 'CONNECTED'].includes(data.database.status));
      assert(typeof data.database.latencyMs === 'number');
    });

    // -------------------------------------------------------------
    // MODULE 14: SETTINGS & SUPER ADMIN MANAGEMENT
    // -------------------------------------------------------------
    console.log('\n--- MODULE 14: Settings & Super Admin Governance ---');

    await runTest('GET /api/v1/admin/settings returns cost rules and super admin list', async () => {
      const res = await request('GET', '/api/v1/admin/settings', {
        Authorization: `Bearer ${superAdminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.data.data.costRules));
      assert(Array.isArray(res.data.data.admins));
    });

    await runTest('POST /api/v1/admin/settings/whatsapp-cost-rules saves per-message rate', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/settings/whatsapp-cost-rules',
        { Authorization: `Bearer ${superAdminToken}` },
        {
          provider: 'META',
          countryCode: '91',
          category: 'UTILITY',
          unitCost: 0.15,
          currency: 'INR',
          notes: 'Rate revision test',
          isActive: true,
        }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(Number(res.data.data.unitCost), 0.15);
    });

    let newAdminId;
    const newAdminEmail = `test-admin-${Date.now()}@obo.fit`;
    await runTest('POST /api/v1/admin/settings/admin-users creates new super admin operator', async () => {
      const res = await request(
        'POST',
        '/api/v1/admin/settings/admin-users',
        { Authorization: `Bearer ${superAdminToken}` },
        {
          email: newAdminEmail,
          name: 'Junior Admin',
          password: 'Password@123',
          role: 'SUPER_ADMIN',
        }
      );
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.email, newAdminEmail);
      assert.strictEqual(res.data.data.role, 'SUPER_ADMIN');
      newAdminId = res.data.data.id;
    });

    await runTest('PATCH /api/v1/admin/settings/admin-users/:id/status toggles admin active state', async () => {
      // Deactivate
      const res = await request(
        'PATCH',
        `/api/v1/admin/settings/admin-users/${newAdminId}/status`,
        { Authorization: `Bearer ${superAdminToken}` },
        { isActive: false }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.isActive, false);

      // Verify deactivated admin cannot log in
      const loginRes = await request('POST', '/api/v1/admin/auth/login', {}, {
        email: newAdminEmail,
        password: 'Password@123',
      });
      assert.strictEqual(loginRes.status, 403);
    });

    // -------------------------------------------------------------
    // FINAL REPORT
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(` ALL SUPER ADMIN TESTS PASSED: ${testsPassed} / ${testsTotal} assertions`);
    console.log('================================================================\n');

  } finally {
    if (server) {
      server.close();
    }
  }
}

runSuite()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error in super admin test suite:', err);
    process.exit(1);
  });
