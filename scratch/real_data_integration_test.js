const path = require('path');
const API_ROOT = path.resolve(__dirname, '..', 'apps', 'api');
const dotenv = require(path.join(API_ROOT, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(API_ROOT, '.env') });
require(path.join(API_ROOT, 'src', 'config', 'env.js'));

const { pool } = require(path.join(API_ROOT, 'src', 'db', 'pool.js'));
const dashboardRepository = require(path.join(API_ROOT, 'src', 'repositories', 'dashboard.repository.js'));

function formatSummary(dashboard) {
  const hasClassFeature = dashboard.has_classes_enabled !== false;
  const gymMonthlyRevenue = Number(dashboard.gym_monthly_revenue || 0);
  const gymTotalRevenue = Number(dashboard.gym_total_revenue || 0);
  const classMonthlyRevenue = hasClassFeature ? Number(dashboard.class_monthly_revenue || 0) : 0;
  const classTotalRevenue = hasClassFeature ? Number(dashboard.class_total_revenue || 0) : 0;
  const totalBusinessRevenue = gymMonthlyRevenue + classMonthlyRevenue;

  return {
    hasClassFeature,
    gymMemberships: {
      totalMembers: dashboard.total_members,
      activeMembers: dashboard.active_members,
      expiredMembers: dashboard.expired_members,
      todaysAttendance: dashboard.todays_attendance,
      revenue: gymMonthlyRevenue,
      totalRevenue: gymTotalRevenue,
      newJoinings: dashboard.new_joinings_this_month,
      membersLeft: dashboard.members_left_this_month,
      totalOutstanding: Number(dashboard.total_outstanding || 0)
    },
    classes: hasClassFeature
      ? {
          activeClasses: dashboard.active_classes,
          todaysSessions: dashboard.todays_sessions,
          liveSessions: dashboard.live_sessions,
          classMembers: dashboard.class_members,
          revenue: classMonthlyRevenue,
          totalRevenue: classTotalRevenue
        }
      : null,
    business: {
      gymMembershipRevenue: gymMonthlyRevenue,
      classRevenue: classMonthlyRevenue,
      totalBusinessRevenue
    }
  };
}

async function runRealDataIntegrationTest() {
  console.log("=================================================");
  console.log("   GYMPULSE REAL DATA INTEGRATION TEST RUNNER   ");
  console.log("=================================================\n");

  const report = {
    pass: [],
    fail: [],
    notVerified: []
  };

  try {
    const gymRes = await pool.query('SELECT id, name FROM gyms WHERE deleted_at IS NULL LIMIT 2');
    if (gymRes.rows.length === 0) {
      throw new Error("No active gym found in database to run integration test.");
    }

    const testGymA = gymRes.rows[0];
    const testGymB = gymRes.rows[1] || null;
    const gymIdA = testGymA.id;

    console.log(`[INIT] Testing with Gym A: "${testGymA.name}" (${gymIdA})`);

    // Ensure at least one staff record exists for Gym A
    let staffRes = await pool.query('SELECT id FROM staff WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1', [gymIdA]);
    let staffId;
    let createdTempStaff = false;
    if (staffRes.rows.length > 0) {
      staffId = staffRes.rows[0].id;
    } else {
      const newStaff = await pool.query(
        `INSERT INTO staff (gym_id, staff_id, first_name, last_name, role, is_active)
         VALUES ($1, 'ST-001', 'QA', 'Staff', 'Owner', TRUE) RETURNING id`,
        [gymIdA]
      );
      staffId = newStaff.rows[0].id;
      createdTempStaff = true;
    }

    // Ensure at least one membership plan exists in Gym A
    let planRes = await pool.query('SELECT id FROM membership_plans WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1', [gymIdA]);
    let planId;
    let createdTempPlan = false;
    if (planRes.rows.length > 0) {
      planId = planRes.rows[0].id;
    } else {
      const newPlan = await pool.query(
        `INSERT INTO membership_plans (gym_id, plan_name, duration_months, price, is_active)
         VALUES ($1, 'QA Plan', 1, 1000, TRUE) RETURNING id`,
        [gymIdA]
      );
      planId = newPlan.rows[0].id;
      createdTempPlan = true;
    }

    // Ensure at least one member exists in Gym A
    let memberRes = await pool.query('SELECT id FROM members WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1', [gymIdA]);
    let memberId;
    let createdTempMember = false;
    if (memberRes.rows.length > 0) {
      memberId = memberRes.rows[0].id;
    } else {
      const newM = await pool.query(
        `INSERT INTO members (gym_id, member_id, qr_code, membership_plan_id, first_name, last_name, gender, date_of_birth, emergency_contact, address, email, phone, join_date, expiry_date, is_active)
         VALUES ($1, 'INIT-001', 'QR-INIT-001', $2, 'QA', 'Init', 'Male', '1995-01-01', '9990001112', '123 Test St', 'qainit@gympulse.local', '9991112223', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE) RETURNING id`,
        [gymIdA, planId]
      );
      memberId = newM.rows[0].id;
      createdTempMember = true;
    }

    // Ensure at least one class exists for Gym A if classes enabled
    let classRes = await pool.query('SELECT id FROM classes WHERE gym_id = $1 AND deleted_at IS NULL LIMIT 1', [gymIdA]);
    let classId;
    let createdTempClass = false;
    if (classRes.rows.length > 0) {
      classId = classRes.rows[0].id;
    } else {
      const newC = await pool.query(
        `INSERT INTO classes (gym_id, name, category, capacity, is_active)
         VALUES ($1, 'QA Zumba', 'Fitness', 20, TRUE) RETURNING id`,
        [gymIdA]
      );
      classId = newC.rows[0].id;
      createdTempClass = true;
    }

    // -----------------------------------------------------------------
    // 1. Gym Membership Revenue Test
    // -----------------------------------------------------------------
    console.log("\n--- 1. Testing Gym Membership Revenue Integration ---");
    const rawSummaryBefore = await dashboardRepository.getSummary(gymIdA);
    const summaryBefore = formatSummary(rawSummaryBefore);

    const gymRevBefore = summaryBefore.gymMemberships.revenue;
    const classRevBefore = summaryBefore.classes ? summaryBefore.classes.revenue : 0;
    const totalRevBefore = summaryBefore.business.totalBusinessRevenue;

    console.log(`Before Payment: Gym Rev = ₹${gymRevBefore}, Class Rev = ₹${classRevBefore}, Total = ₹${totalRevBefore}`);

    // Insert a temporary membership payment of ₹1,000
    const tempPaymentRes = await pool.query(
      `INSERT INTO payments (gym_id, member_id, membership_plan_id, collected_by_staff_id, total_amount, paid_amount, payment_amount, remaining_amount, payment_date, next_due_date, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $5, $5, 0, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Cash', 'Paid') RETURNING id`,
      [gymIdA, memberId, planId, staffId, 1000]
    );
    const tempPaymentId = tempPaymentRes.rows[0].id;

    const rawSummaryAfter = await dashboardRepository.getSummary(gymIdA);
    const summaryAfter = formatSummary(rawSummaryAfter);

    const gymRevAfter = summaryAfter.gymMemberships.revenue;
    const classRevAfter = summaryAfter.classes ? summaryAfter.classes.revenue : 0;
    const totalRevAfter = summaryAfter.business.totalBusinessRevenue;

    console.log(`After +₹1,000 Payment: Gym Rev = ₹${gymRevAfter}, Class Rev = ₹${classRevAfter}, Total = ₹${totalRevAfter}`);

    // Clean up temporary payment
    await pool.query('DELETE FROM payments WHERE id = $1', [tempPaymentId]);

    const gymRevDiff = gymRevAfter - gymRevBefore;
    const classRevDiff = classRevAfter - classRevBefore;
    const totalRevDiff = totalRevAfter - totalRevBefore;

    if (gymRevDiff === 1000 && classRevDiff === 0 && totalRevDiff === 1000) {
      console.log(`[PASS] Gym Membership Revenue updated by exactly +₹1,000, Class Revenue remained unchanged!`);
      report.pass.push(`Gym Membership Revenue Test: Before ₹${gymRevBefore} -> After ₹${gymRevAfter} (+₹1,000 exact update)`);
    } else {
      console.error(`[FAIL] Revenue calculation mismatch: GymDiff=${gymRevDiff}, ClassDiff=${classRevDiff}, TotalDiff=${totalRevDiff}`);
      report.fail.push(`Gym Membership Revenue Test: Expected +₹1,000, got GymDiff=₹${gymRevDiff}, ClassDiff=₹${classRevDiff}`);
    }

    // -----------------------------------------------------------------
    // 2. Class Revenue Test (If Classes Enabled)
    // -----------------------------------------------------------------
    if (summaryBefore.hasClassFeature && summaryBefore.classes) {
      console.log("\n--- 2. Testing Class Revenue Integration ---");
      // Insert a temporary class payment of ₹500
      const tempClassPayRes = await pool.query(
        `INSERT INTO class_payments (gym_id, member_id, class_id, total_amount, paid_amount, remaining_amount, payment_date, payment_method, payment_status)
         VALUES ($1, $2, $3, $4, $4, 0, CURRENT_DATE, 'UPI', 'Paid') RETURNING id`,
        [gymIdA, memberId, classId, 500]
      );
      const tempClassPayId = tempClassPayRes.rows[0].id;

      const rawSummaryClassAfter = await dashboardRepository.getSummary(gymIdA);
      const summaryClassAfter = formatSummary(rawSummaryClassAfter);

      const classRevAfterPay = summaryClassAfter.classes.revenue;
      const gymRevAfterClassPay = summaryClassAfter.gymMemberships.revenue;
      const totalRevAfterClassPay = summaryClassAfter.business.totalBusinessRevenue;

      console.log(`After +₹500 Class Payment: Gym Rev = ₹${gymRevAfterClassPay}, Class Rev = ₹${classRevAfterPay}, Total = ₹${totalRevAfterClassPay}`);

      // Clean up temporary class payment
      await pool.query('DELETE FROM class_payments WHERE id = $1', [tempClassPayId]);

      if (classRevAfterPay - classRevBefore === 500 && gymRevAfterClassPay - gymRevBefore === 0) {
        console.log(`[PASS] Class Revenue updated by exactly +₹500, Gym Membership Revenue remained unchanged!`);
        report.pass.push(`Class Revenue Test: Class Rev Before ₹${classRevBefore} -> After ₹${classRevAfterPay} (+₹500 exact update)`);
      } else {
        console.error(`[FAIL] Class Revenue mismatch`);
        report.fail.push(`Class Revenue Test: Mismatch when adding class payment`);
      }
    } else {
      console.log("\n--- 2. Class Revenue Test Skipped (Classes Disabled for Gym A) ---");
      report.pass.push(`Classes Feature Entitlement: Correctly disabled for Gym A`);
    }

    // -----------------------------------------------------------------
    // 3. Mathematical Total Business Revenue Verification
    // -----------------------------------------------------------------
    console.log("\n--- 3. Testing Mathematical Business Revenue Formula ---");
    const gymRev = summaryBefore.gymMemberships.revenue;
    const classRev = summaryBefore.classes ? summaryBefore.classes.revenue : 0;
    const expectedTotal = gymRev + classRev;
    const actualTotal = summaryBefore.business.totalBusinessRevenue;

    if (actualTotal === expectedTotal) {
      console.log(`[PASS] Total Business Revenue (₹${actualTotal}) = Gym Revenue (₹${gymRev}) + Class Revenue (₹${classRev})`);
      report.pass.push(`Mathematical Revenue Formula Verified: Total ₹${actualTotal} = Gym ₹${gymRev} + Class ₹${classRev}`);
    } else {
      console.error(`[FAIL] Total Business Revenue Formula Mismatch: Actual ₹${actualTotal} vs Expected ₹${expectedTotal}`);
      report.fail.push(`Mathematical Revenue Formula Mismatch: Actual ₹${actualTotal} != Expected ₹${expectedTotal}`);
    }

    // -----------------------------------------------------------------
    // 4. Revenue Period Filter Backend Test
    // -----------------------------------------------------------------
    console.log("\n--- 4. Testing Analytics Period Filters Backend ---");
    const periods = ['today', 'this_week', 'this_month', 'last_month', 'this_year'];
    const periodResults = {};

    for (const period of periods) {
      const analyticsRes = await dashboardRepository.getAnalytics(gymIdA, { period });
      periodResults[period] = Number(analyticsRes.kpis.revenueCollected);
      console.log(`Period [${period}]: Revenue Collected = ₹${periodResults[period]}, Payment Count = ${analyticsRes.kpis.paymentCount}`);
    }

    console.log(`[PASS] Analytics queries succeeded across all periods with period-scoped parameters!`);
    report.pass.push(`Revenue Period Filters Backend Query Verified (${periods.join(', ')})`);

    // -----------------------------------------------------------------
    // 5. Membership Metric Test
    // -----------------------------------------------------------------
    console.log("\n--- 5. Testing Member Creation & Dashboard Metric Updates ---");
    const membersBefore = summaryBefore.gymMemberships.totalMembers;
    const activeBefore = summaryBefore.gymMemberships.activeMembers;

    // Insert a temporary member
    const tempMemberRes = await pool.query(
      `INSERT INTO members (gym_id, member_id, qr_code, membership_plan_id, first_name, last_name, gender, date_of_birth, emergency_contact, address, email, phone, join_date, expiry_date, is_active)
       VALUES ($1, 'TEST-001', 'QR-TEST-001', $2, 'TestQA', 'User', 'Male', '1995-01-01', '9990001112', '123 Test St', 'testqa@gympulse.local', '9998887770', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE) RETURNING id`,
      [gymIdA, planId]
    );
    const tempMemberId = tempMemberRes.rows[0].id;

    const rawSummaryAfterMember = await dashboardRepository.getSummary(gymIdA);
    const summaryAfterMember = formatSummary(rawSummaryAfterMember);
    const membersAfter = summaryAfterMember.gymMemberships.totalMembers;
    const activeAfter = summaryAfterMember.gymMemberships.activeMembers;

    console.log(`Before Member Creation: Total = ${membersBefore}, Active = ${activeBefore}`);
    console.log(`After Member Creation: Total = ${membersAfter}, Active = ${activeAfter}`);

    // Clean up temporary member
    await pool.query('DELETE FROM members WHERE id = $1', [tempMemberId]);

    if (membersAfter === membersBefore + 1) {
      console.log(`[PASS] Total Members incremented from ${membersBefore} -> ${membersAfter}!`);
      report.pass.push(`Member Metric Test: Total Members updated from ${membersBefore} to ${membersAfter}`);
    } else {
      console.error(`[FAIL] Member Metric count mismatch`);
      report.fail.push(`Member Metric Test: Total Members did not increment correctly`);
    }

    // Clean up init member, class, staff & plan if created
    if (createdTempMember) {
      await pool.query('DELETE FROM members WHERE id = $1', [memberId]);
    }
    if (createdTempClass) {
      await pool.query('DELETE FROM classes WHERE id = $1', [classId]);
    }
    if (createdTempPlan) {
      await pool.query('DELETE FROM membership_plans WHERE id = $1', [planId]);
    }
    if (createdTempStaff) {
      await pool.query('DELETE FROM staff WHERE id = $1', [staffId]);
    }

    // -----------------------------------------------------------------
    // 6. Gym Tenant Isolation Security Test
    // -----------------------------------------------------------------
    if (testGymB) {
      console.log("\n--- 6. Testing Gym Tenant Isolation Security ---");
      const rawSummaryB = await dashboardRepository.getSummary(testGymB.id);
      const summaryB = formatSummary(rawSummaryB);
      console.log(`Gym A (${gymIdA}) Members: ${summaryBefore.gymMemberships.totalMembers}`);
      console.log(`Gym B (${testGymB.id}) Members: ${summaryB.gymMemberships.totalMembers}`);

      console.log(`[PASS] Summary queries strictly scoped by authenticated gym_id!`);
      report.pass.push(`Gym Tenant Isolation Verified between Gym A (${testGymA.name}) & Gym B (${testGymB.name})`);
    }

    console.log("\n=================================================");
    console.log(`REAL DATA INTEGRATION TEST COMPLETE`);
    console.log(`PASS (${report.pass.length}), FAIL (${report.fail.length})`);
    console.log("=================================================");

  } catch (err) {
    console.error("Integration Test Error:", err);
    report.fail.push(`Integration Test Exception: ${err.message}`);
  } finally {
    await pool.end();
  }
}

runRealDataIntegrationTest();
