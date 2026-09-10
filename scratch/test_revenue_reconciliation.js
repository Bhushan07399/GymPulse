/**
 * SUPER ADMIN REVENUE RECONCILIATION TEST SUITE
 * 
 * Tests strict financial reconciliation:
 * 1. sum(plan MRR contributions) === total MRR
 * 2. sum(billing-cycle MRR contributions) === total MRR
 * 3. ARR === Math.round(MRR * 12 * 100) / 100
 * 4. Dashboard MRR === Revenue MRR
 * 5. Dashboard ARR === Revenue ARR
 * 6. Base-plan pricing isolation: location count does NOT inflate MRR
 * 7. Trial, suspended, and expired gyms contribute ₹0 to MRR
 * 8. Zero non-canonical plans (STARTER / ENTERPRISE) in breakdowns
 * 9. Honest reporting of unrecorded cash when gateway is not active
 */

const http = require('http');
const assert = require('assert');
const jwt = require('../apps/api/node_modules/jsonwebtoken');
const { pool } = require('../apps/api/src/db/pool');
const { app } = require('../apps/api/src/app');
const { env } = require('../apps/api/src/config/env');
const { CANONICAL_PLANS, calculateGymMRR, calculatePortfolioMetrics } = require('../apps/api/src/config/pricing');

let server;
let baseUrl;
let superAdminToken;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runReconciliation() {
  console.log('================================================================');
  console.log(' SUPER ADMIN REVENUE RECONCILIATION & AUDIT TEST SUITE          ');
  console.log('================================================================\n');

  // Start API server
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Super Admin Auth
  const loginRes = await request('POST', '/api/v1/admin/auth/login', {}, {
    email: 'admin@obo.fit',
    password: 'Admin@123456',
  });
  assert.strictEqual(loginRes.status, 200, 'Super admin login must succeed');
  superAdminToken = loginRes.data.data.token;

  // 1. Unit math test for calculateGymMRR
  console.log('--- TEST 1: Individual Gym Canonical MRR Yields ---');
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Growth', billing_cycle: 'monthly', subscription_status: 'ACTIVE', is_active: true }), 499);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Growth', billing_cycle: 'yearly', subscription_status: 'ACTIVE', is_active: true }), 416.58);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Pro', billing_cycle: 'monthly', subscription_status: 'ACTIVE', is_active: true }), 999);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Pro', billing_cycle: 'yearly', subscription_status: 'ACTIVE', is_active: true }), 833.25);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Gym + Classes', billing_cycle: 'monthly', subscription_status: 'ACTIVE', is_active: true }), 1499);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Gym + Classes', billing_cycle: 'yearly', subscription_status: 'ACTIVE', is_active: true }), 1249.92);

  // Exclusions
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Growth', billing_cycle: 'monthly', subscription_status: 'TRIAL', is_active: true }), 0);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Pro', billing_cycle: 'monthly', subscription_status: 'SUSPENDED', is_active: true }), 0);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Gym + Classes', billing_cycle: 'monthly', subscription_status: 'EXPIRED', is_active: true }), 0);
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Growth', billing_cycle: 'monthly', subscription_status: 'ACTIVE', is_active: false }), 0);

  // Multi-gym location independence: max_locations = 10 must yield same MRR as single location
  assert.strictEqual(calculateGymMRR({ subscription_plan: 'Gym + Classes', billing_cycle: 'monthly', is_multi_gym: true, max_locations: 10, subscription_status: 'ACTIVE', is_active: true }), 1499);
  console.log('  ✓ Individual gym MRR yields strictly follow canonical rules (Trial/Suspended = ₹0, Locations = no multiplier)');

  // 2. Fetch Dashboard and Revenue API responses
  console.log('\n--- TEST 2: Dashboard vs Revenue Cross-Endpoint Parity ---');
  const dashRes = await request('GET', '/api/v1/admin/dashboard', {
    Authorization: `Bearer ${superAdminToken}`,
  });
  assert.strictEqual(dashRes.status, 200);
  const dashData = dashRes.data.data;

  const revRes = await request('GET', '/api/v1/admin/revenue', {
    Authorization: `Bearer ${superAdminToken}`,
  });
  assert.strictEqual(revRes.status, 200);
  const revData = revRes.data.data;

  // Strict cross-endpoint reconciliation
  assert.strictEqual(dashData.businessMetrics.mrr, revData.mrr, 'Dashboard MRR must exactly match Revenue MRR');
  assert.strictEqual(dashData.businessMetrics.arr, revData.arr, 'Dashboard ARR must exactly match Revenue ARR');
  assert.strictEqual(revData.arr, Math.round(revData.mrr * 12 * 100) / 100, 'ARR must strictly equal round(MRR * 12)');
  console.log(`  ✓ Dashboard MRR (₹${dashData.businessMetrics.mrr}) === Revenue MRR (₹${revData.mrr})`);
  console.log(`  ✓ Dashboard ARR (₹${dashData.businessMetrics.arr}) === Revenue ARR (₹${revData.arr})`);
  console.log(`  ✓ ARR === round(MRR * 12)`);

  // 3. Reconcile Plan Breakdown
  console.log('\n--- TEST 3: Plan Contribution Reconciliation ---');
  assert(Array.isArray(revData.byPlan), 'byPlan must be an array');
  assert.strictEqual(revData.byPlan.length, 3, 'Must have exactly 3 canonical plans');

  let sumPlanMRR = 0;
  let totalPlanSubscribers = 0;
  for (const p of revData.byPlan) {
    assert(CANONICAL_PLANS.includes(p.plan), `Plan ${p.plan} must be canonical`);
    assert(typeof p.mrrContribution === 'number', 'mrrContribution must be a number');
    assert(p.mrrContribution >= 0, 'mrrContribution must be >= 0');
    assert.strictEqual(p.mrrContribution, p.total, 'mrrContribution must equal total for backwards compatibility');
    sumPlanMRR += p.mrrContribution;
    totalPlanSubscribers += p.subscribers;
  }
  sumPlanMRR = Math.round(sumPlanMRR * 100) / 100;
  assert.strictEqual(sumPlanMRR, revData.mrr, `sum(byPlan.mrrContribution) [${sumPlanMRR}] must equal total MRR [${revData.mrr}]`);
  console.log(`  ✓ sum(byPlan.mrrContribution) [₹${sumPlanMRR}] strictly equals total MRR [₹${revData.mrr}]`);
  console.log(`  ✓ Plan subscribers total: ${totalPlanSubscribers} active gyms`);

  // 4. Reconcile Billing Frequency Breakdown
  console.log('\n--- TEST 4: Billing Frequency Reconciliation ---');
  assert(Array.isArray(revData.byCycle), 'byCycle must be an array');
  assert.strictEqual(revData.byCycle.length, 2, 'Must have monthly and yearly cycles');

  let sumCycleMRR = 0;
  let totalCycleSubscribers = 0;
  for (const c of revData.byCycle) {
    assert(['monthly', 'yearly'].includes(c.cycle), `Cycle ${c.cycle} must be monthly or yearly`);
    assert(typeof c.mrrContribution === 'number', 'mrrContribution must be a number');
    assert(c.mrrContribution >= 0, 'mrrContribution must be >= 0');
    assert.strictEqual(c.mrrContribution, c.total, 'mrrContribution must equal total for backwards compatibility');
    sumCycleMRR += c.mrrContribution;
    totalCycleSubscribers += c.subscribers;
  }
  sumCycleMRR = Math.round(sumCycleMRR * 100) / 100;
  assert.strictEqual(sumCycleMRR, revData.mrr, `sum(byCycle.mrrContribution) [${sumCycleMRR}] must equal total MRR [${revData.mrr}]`);
  assert.strictEqual(totalPlanSubscribers, totalCycleSubscribers, 'Total subscribers across plans and cycles must match');
  console.log(`  ✓ sum(byCycle.mrrContribution) [₹${sumCycleMRR}] strictly equals total MRR [₹${revData.mrr}]`);
  console.log(`  ✓ Plan subscribers (${totalPlanSubscribers}) === Cycle subscribers (${totalCycleSubscribers})`);

  // 5. Cash Data Integrity
  console.log('\n--- TEST 5: SaaS Cash Data Integrity ---');
  if (revData.hasRecordedCash) {
    assert(typeof revData.cashCollectedThisMonth === 'number');
    console.log(`  ✓ Recorded SaaS cash present: ₹${revData.cashCollectedThisMonth}`);
  } else {
    assert.strictEqual(revData.cashCollectedThisMonth, null, 'Unrecorded cash must report null');
    assert.strictEqual(revData.hasRecordedCash, false);
    console.log('  ✓ Unrecorded cash correctly exposed as hasRecordedCash = false and null amount');
  }

  // 6. Multi-tenant Injection & Re-computation Test
  console.log('\n--- TEST 6: Dynamic Tenant Injection & Re-reconciliation ---');
  const tempTime = Date.now();
  const testGymRes = await pool.query(
    `INSERT INTO gyms (
      name, owner_name, email, phone, address, city, state, country, pincode,
      subscription_plan, subscription_start_date, subscription_end_date, is_active,
      subscription_status, is_multi_gym, max_locations, billing_cycle
    ) VALUES (
      $1, 'Recon Owner', $2, '9998887776', 'Address', 'Pune', 'MH', 'India', '411001',
      'Pro', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true,
      'ACTIVE', true, 8, 'monthly'
    ) RETURNING id`,
    [`Recon Gym ${tempTime}`, `recon-${tempTime}@test.fit`]
  );
  const testGymId = testGymRes.rows[0].id;

  try {
    const updatedRevRes = await request('GET', '/api/v1/admin/revenue', {
      Authorization: `Bearer ${superAdminToken}`,
    });
    const updatedData = updatedRevRes.data.data;

    // Monthly Pro must add exactly ₹999 to MRR regardless of max_locations: 8
    const expectedNewMrr = Math.round((revData.mrr + 999) * 100) / 100;
    assert.strictEqual(updatedData.mrr, expectedNewMrr, `New MRR must be previous MRR + 999`);
    assert.strictEqual(updatedData.arr, Math.round(updatedData.mrr * 12 * 100) / 100);

    const proGroup = updatedData.byPlan.find((p) => p.plan === 'Pro');
    assert.strictEqual(proGroup.mrrContribution, Math.round((revData.byPlan.find((p) => p.plan === 'Pro').mrrContribution + 999) * 100) / 100);
    assert.strictEqual(proGroup.subscribers, revData.byPlan.find((p) => p.plan === 'Pro').subscribers + 1);

    // Sum verification again
    const newPlanSum = Math.round(updatedData.byPlan.reduce((acc, p) => acc + p.mrrContribution, 0) * 100) / 100;
    assert.strictEqual(newPlanSum, updatedData.mrr);
    console.log(`  ✓ Adding Pro gym with 8 locations increased MRR by exactly ₹999 (from ₹${revData.mrr} to ₹${updatedData.mrr})`);
    console.log('  ✓ Reconciled sums hold perfectly after portfolio mutation');
  } finally {
    await pool.query(`DELETE FROM gyms WHERE id = $1`, [testGymId]);
  }

  console.log('\n================================================================');
  console.log(' ALL REVENUE RECONCILIATION TESTS PASSED: 0 ERRORS               ');
  console.log('================================================================\n');

  server.close();
  await pool.end();
}

runReconciliation().catch((err) => {
  console.error('Reconciliation test failed:', err);
  if (server) server.close();
  process.exit(1);
});
