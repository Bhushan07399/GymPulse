/**
 * GymPulse — Customizable Multi-Gym SaaS & Security Verification Suite
 *
 * Verifies:
 *   1. Single-gym owner cannot add a 2nd location (HTTP 403)
 *   2. Owner updates subscription to Multi-Gym Growth (2 locations) via POST /gyms/subscription
 *   3. Multi-Gym Growth owner creates 2nd location (Miraj)
 *   4. Creating 3rd location on a 2-location plan is rejected (HTTP 403)
 *   5. Owner upgrades to 5 locations via POST /gyms/subscription
 *   6. Owner creates 3rd, 4th, 5th locations successfully
 *   7. Creating 6th location when limit (5) is reached is rejected (HTTP 403)
 *   8. Strict Feature Entitlement Isolation:
 *      - Multi-Gym Growth accessing Pro features -> HTTP 403 FEATURE_LOCKED
 *      - Multi-Gym Pro accessing Gym Classes -> HTTP 403 FEATURE_LOCKED
 *      - Multi-Gym Gym + Classes accessing Group Classes -> HTTP 200/201 Success
 *   9. Security isolation: Owner A cannot switch to Owner B's gym (HTTP 403)
 *  10. Consolidated dashboard aggregates metrics across authorized gyms
 *
 * Run: node scratch/test_multi_gym_saas.js
 */

require('../apps/api/node_modules/dotenv').config({ path: './apps/api/.env' });
const { pool } = require('../apps/api/src/db/pool');

const API_BASE = 'http://localhost:5000/api/v1';

let passCount = 0;
let failCount = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passCount++;
  } else {
    console.log(`  ❌ FAIL  ${label} ${detail ? '— ' + detail : ''}`);
    failCount++;
  }
}

async function apiPost(endpoint, body, token = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function apiGet(endpoint, token = '') {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runMultiGymSaaSTest() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   GYMPULSE — CUSTOMIZABLE MULTI-GYM SAAS TEST SUITE     ');
  console.log('══════════════════════════════════════════════════════════\n');

  try {
    const timestamp = Date.now();
    const ownerAEmail = `multigym_owner_a_${timestamp}@example.com`;
    const ownerBEmail = `multigym_owner_b_${timestamp}@example.com`;
    const password = 'Password123!';

    // 1. Register Owner A
    const signupARes = await apiPost('/auth/create-gym-account', {
      gymName: 'IronPulse Sangli Branch',
      firstName: 'Vikram',
      lastName: 'Patil',
      email: ownerAEmail,
      phone: '9876543210',
      address: 'Station Road',
      city: 'Sangli',
      state: 'Maharashtra',
      pincode: '416416',
      password
    });

    let tokenA = signupARes.data.data.token;
    const gymAId = signupARes.data.data.gym.id;
    assert('Owner A created primary gym (Sangli)', Boolean(tokenA && gymAId));

    // 2. Register Owner B
    const signupBRes = await apiPost('/auth/create-gym-account', {
      gymName: 'PowerGym Kolhapur',
      firstName: 'Rohan',
      lastName: 'Deshmukh',
      email: ownerBEmail,
      phone: '9876543211',
      address: 'Rajarampuri',
      city: 'Kolhapur',
      state: 'Maharashtra',
      pincode: '416001',
      password
    });

    const tokenB = signupBRes.data.data.token;
    const gymBId = signupBRes.data.data.gym.id;
    assert('Owner B created primary gym (Kolhapur)', Boolean(tokenB && gymBId));

    // 3. Single-gym owner attempts 2nd location without Multi-Gym plan -> Rejected (403)
    const loc2RejectedRes = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Miraj Branch', city: 'Miraj' },
      tokenA
    );
    assert('Single-gym owner 2nd location addition rejected without Multi-Gym plan (403)', loc2RejectedRes.status === 403);

    // 4. Activate Multi-Gym Growth (2 locations, Monthly) via API endpoint POST /gyms/subscription
    const subUpdateRes = await apiPost(
      '/gyms/subscription',
      {
        plan: 'Growth',
        isMultiGym: true,
        maxLocations: 2,
        billingCycle: 'monthly'
      },
      tokenA
    );
    assert('Owner A updated subscription to Multi-Gym Growth (2 locations)', subUpdateRes.status === 200);

    // 5. Multi-Gym Owner A creates 2nd gym location (Miraj)
    const createLoc2Res = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Miraj Branch', city: 'Miraj', address: 'High School Road' },
      tokenA
    );
    const gymA2Id = createLoc2Res.data?.data?.gym?.id;
    assert('Multi-Gym Owner A created 2nd location (Miraj)', Boolean(gymA2Id));

    // 6. Attempting 3rd location when limit is 2 -> Rejected (403)
    const loc3RejectedRes = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Satara Branch', city: 'Satara' },
      tokenA
    );
    assert('3rd location rejected when plan limit is 2 (403)', loc3RejectedRes.status === 403);

    // 7. Upgrade Owner A to 5 locations via POST /gyms/subscription
    const subUpgradeRes = await apiPost(
      '/gyms/subscription',
      {
        plan: 'Growth',
        isMultiGym: true,
        maxLocations: 5,
        billingCycle: 'monthly'
      },
      tokenA
    );
    assert('Owner A scaled quota to 5 locations', subUpgradeRes.status === 200);

    // 8. Multi-Gym Owner A creates 3rd, 4th, 5th locations
    const createLoc3Res = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Satara Branch', city: 'Satara' },
      tokenA
    );
    const gymA3Id = createLoc3Res.data?.data?.gym?.id;

    const createLoc4Res = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Pune Branch', city: 'Pune' },
      tokenA
    );
    const gymA4Id = createLoc4Res.data?.data?.gym?.id;

    const createLoc5Res = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Mumbai Branch', city: 'Mumbai' },
      tokenA
    );
    const gymA5Id = createLoc5Res.data?.data?.gym?.id;

    assert('Owner A successfully created 3rd, 4th, 5th locations', Boolean(gymA3Id && gymA4Id && gymA5Id));

    // 9. Attempting 6th location when limit is 5 -> Rejected (403)
    const createLoc6Res = await apiPost(
      '/gyms/create-location',
      { name: 'IronPulse Nashik Branch', city: 'Nashik' },
      tokenA
    );
    assert('6th location creation rejected when limit (5) is reached (403)', createLoc6Res.status === 403);

    // 10. Fetch owner locations (GET /auth/my-gyms)
    const myGymsRes = await apiGet('/auth/my-gyms', tokenA);
    const ownedGyms = myGymsRes.data.data;
    assert('GET /auth/my-gyms returns 5 locations for Owner A', ownedGyms?.length === 5);
    assert('Location object includes isMultiGym: true and maxLocations: 5', ownedGyms[0]?.isMultiGym === true && ownedGyms[0]?.maxLocations === 5);

    // 11. Switch location context to Gym A2 (Miraj)
    const switchRes = await apiPost(
      '/auth/switch-gym',
      { targetGymId: gymA2Id },
      tokenA
    );
    const switchedToken = switchRes.data?.data?.token;
    assert('Switch gym context returns new JWT token', Boolean(switchedToken));

    // 12. FEATURE ISOLATION TEST 1:
    // Multi-Gym Growth owner accessing Advanced Analytics (/dashboard/analytics) or WhatsApp Automation
    // Must be rejected with FEATURE_LOCKED (403)
    const analyticsGrowthRes = await apiGet('/dashboard/analytics', switchedToken);
    assert('Multi-Gym Growth accessing Advanced Analytics is locked (403 FEATURE_LOCKED)', analyticsGrowthRes.status === 403 && analyticsGrowthRes.data?.error?.code === 'FEATURE_LOCKED');

    // 13. Owner upgrades to Multi-Gym Pro (5 locations)
    const upgradeProRes = await apiPost(
      '/gyms/subscription',
      {
        plan: 'Pro',
        isMultiGym: true,
        maxLocations: 5,
        billingCycle: 'yearly'
      },
      switchedToken
    );
    assert('Owner upgraded to Multi-Gym Pro (5 locations, yearly)', upgradeProRes.status === 200);

    // 14. FEATURE ISOLATION TEST 2:
    // Multi-Gym Pro owner can now access Advanced Analytics!
    const analyticsProRes = await apiGet('/dashboard/analytics', switchedToken);
    assert('Multi-Gym Pro accessing Advanced Analytics succeeds (200 OK)', analyticsProRes.status === 200);

    // Multi-Gym Pro owner accessing Group Classes is locked!
    const classesProRes = await apiGet('/classes', switchedToken);
    assert('Multi-Gym Pro accessing Group Classes is locked (403 FEATURE_LOCKED)', classesProRes.status === 403 && classesProRes.data?.error?.code === 'FEATURE_LOCKED');

    // 15. Owner upgrades to Multi-Gym Gym + Classes
    const upgradeClassesRes = await apiPost(
      '/gyms/subscription',
      {
        plan: 'Gym + Classes',
        isMultiGym: true,
        maxLocations: 5,
        billingCycle: 'yearly'
      },
      switchedToken
    );
    assert('Owner upgraded to Multi-Gym Gym + Classes', upgradeClassesRes.status === 200);

    // Multi-Gym Gym + Classes owner can now access Group Classes!
    const classesEnabledRes = await apiGet('/classes', switchedToken);
    assert('Multi-Gym Gym + Classes accessing Group Classes succeeds (200 OK)', classesEnabledRes.status === 200);

    // 16. SECURITY TEST: Owner A attempts to switch to Owner B's gym (gymBId) -> Rejected (403)
    const switchBRes = await apiPost(
      '/auth/switch-gym',
      { targetGymId: gymBId },
      tokenA
    );
    assert('Cross-owner gym switch attempt rejected with 403', switchBRes.status === 403);

    // 17. Consolidated Dashboard Summary (GET /dashboard/consolidated)
    const consolidatedRes = await apiGet('/dashboard/consolidated', tokenA);
    const consolidated = consolidatedRes.data?.data;
    assert('Consolidated summary returns totalLocations = 5', consolidated?.totalLocations === 5);
    assert('Consolidated summary locations array contains 5 gyms', consolidated?.locations?.length === 5);

    // Clean up temporary test data
    await pool.query('DELETE FROM staff WHERE email IN ($1, $2)', [ownerAEmail, ownerBEmail]);
    await pool.query('DELETE FROM gyms WHERE email IN ($1, $2)', [ownerAEmail, ownerBEmail]);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('   MULTI-GYM SAAS TEST SUMMARY');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Total tests : ${passCount + failCount}`);
    console.log(`  ✅ PASS     : ${passCount}`);
    console.log(`  ❌ FAIL     : ${failCount}`);

    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runMultiGymSaaSTest();
