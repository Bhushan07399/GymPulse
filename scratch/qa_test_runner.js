const http = require('http');
const path = require('path');

// Test suite for GymPulse Management Mobile App QA
async function runQATests() {
  console.log("=================================================");
  console.log("   GYMPULSE MANAGEMENT MOBILE APP QA RUNNER     ");
  console.log("=================================================\n");

  const results = {
    pass: [],
    fail: [],
    notVerified: []
  };

  // 1. HTTP Frontend Route Verification
  const frontendRoutes = [
    { path: '/dashboard', name: 'Mobile Home Dashboard' },
    { path: '/dashboard/members', name: 'Members Module' },
    { path: '/dashboard/attendance', name: 'Attendance Module' },
    { path: '/dashboard/payments', name: 'Payments Module' },
    { path: '/dashboard/business-analytics', name: 'Business Analytics Route' }
  ];

  console.log("--- 1. Testing Frontend Route Responses ---");
  for (const route of frontendRoutes) {
    await new Promise((resolve) => {
      http.get('http://localhost:3001' + route.path, (res) => {
        if (res.statusCode === 200) {
          console.log(`[PASS] ${route.name} (${route.path}) -> HTTP 200 OK`);
          results.pass.push(`Frontend Route ${route.path} returned HTTP 200 OK`);
        } else {
          console.error(`[FAIL] ${route.name} (${route.path}) -> HTTP ${res.statusCode}`);
          results.fail.push(`Frontend Route ${route.path} returned HTTP ${res.statusCode}`);
        }
        resolve();
      }).on('error', (err) => {
        console.error(`[FAIL] ${route.name} (${route.path}) -> Error: ${err.message}`);
        results.fail.push(`Frontend Route ${route.path} error: ${err.message}`);
        resolve();
      });
    });
  }

  // 2. Backend API Endpoint Verification
  console.log("\n--- 2. Testing Backend API Health & Security ---");
  await new Promise((resolve) => {
    http.get('http://localhost:5000/api/v1/health', (res) => {
      if (res.statusCode === 200) {
        console.log(`[PASS] Backend API Health -> HTTP 200 OK`);
        results.pass.push(`Backend API Health check passed`);
      } else {
        console.error(`[FAIL] Backend API Health -> HTTP ${res.statusCode}`);
        results.fail.push(`Backend API Health returned HTTP ${res.statusCode}`);
      }
      resolve();
    }).on('error', (err) => {
      console.error(`[FAIL] Backend API Health -> Error: ${err.message}`);
      results.fail.push(`Backend API Health error: ${err.message}`);
      resolve();
    });
  });

  // 3. Unauthorized Classes API Protection Check (Security Test)
  console.log("\n--- 3. Testing Protected Classes Endpoint Authorization ---");
  await new Promise((resolve) => {
    // Unauthenticated request to /api/v1/classes should return 401/403
    http.get('http://localhost:5000/api/v1/classes/dashboard', (res) => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        console.log(`[PASS] Protected Classes API correctly rejected unauthenticated request -> HTTP ${res.statusCode}`);
        results.pass.push(`Backend Classes API securely enforced authorization (HTTP ${res.statusCode})`);
      } else {
        console.error(`[FAIL] Protected Classes API allowed request -> HTTP ${res.statusCode}`);
        results.fail.push(`Backend Classes API security flaw: returned HTTP ${res.statusCode}`);
      }
      resolve();
    }).on('error', (err) => {
      console.error(`[FAIL] Protected Classes API Error: ${err.message}`);
      results.fail.push(`Classes API security test error: ${err.message}`);
      resolve();
    });
  });

  console.log("\n=================================================");
  console.log(`SUMMARY: PASS (${results.pass.length}), FAIL (${results.fail.length})`);
  console.log("=================================================");
}

runQATests();
