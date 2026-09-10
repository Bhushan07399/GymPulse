const { pool } = require('../apps/api/src/db/pool');
const classService = require('../apps/api/src/services/classes.service');
const classPlansRepo = require('../apps/api/src/repositories/class-plans.repository');
const classMembershipsRepo = require('../apps/api/src/repositories/class-memberships.repository');
const attendanceService = require('../apps/api/src/services/attendance.service');
const attendanceRepo = require('../apps/api/src/repositories/attendance.repository');
const paymentRepo = require('../apps/api/src/repositories/payment.repository');
const revenueAnalyticsService = require('../apps/api/src/services/revenue-analytics.service');
const dashboardRepo = require('../apps/api/src/repositories/dashboard.repository');
const classesRepo = require('../apps/api/src/repositories/classes.repository');

async function runCompleteClassDomainAudit() {
  console.log('================================================================');
  console.log('GYMPULSE — COMPLETE CLASS MODULE + ATTENDANCE + REVENUE AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const testAssert = (desc, cond, details = '') => {
    if (cond) {
      console.log(`  [PASS] ${desc} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  const createdGymIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP TEST GYMS
    // -------------------------------------------------------------------------
    console.log('--- 1. SETTING UP TEST GYMS ---');

    // Tenant A: Gym + Classes
    const gymResA = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '100 Fitness Park', 'Pune', 'Maharashtra', 'India', '411001',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 2, 'monthly')
       RETURNING id, name`,
      ['Cult Pulse - A', 'Vikram Malhotra', `cult_a_${Date.now()}@example.com`, '9820011111']
    );
    const gymA = gymResA.rows[0];
    createdGymIds.push(gymA.id);

    const staffResA = await pool.query(
      `INSERT INTO staff (gym_id, first_name, last_name, email, phone, password_hash, role, is_active)
       VALUES ($1, 'Vikram', 'Malhotra', $2, '9820011111', 'hash123', 'Owner', TRUE)
       RETURNING id`,
      [gymA.id, `staff_a_${Date.now()}@example.com`]
    );
    const staffA = staffResA.rows[0];

    // Tenant A Location B: Multi-Gym second location
    const gymResB = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '200 Fitness Park', 'Pune', 'Maharashtra', 'India', '411002',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 2, 'monthly')
       RETURNING id, name`,
      ['Cult Pulse - B', 'Vikram Malhotra', `cult_b_${Date.now()}@example.com`, '9820022222']
    );
    const gymB = gymResB.rows[0];
    createdGymIds.push(gymB.id);

    // Tenant C: Pro Plan (No Classes)
    const gymResC = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '300 Iron Gym', 'Mumbai', 'Maharashtra', 'India', '400001',
        'Pro', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', FALSE, 1, 'monthly')
       RETURNING id, name`,
      ['Pro Iron Gym', 'Rahul Roy', `pro_iron_${Date.now()}@example.com`, '9820033333']
    );
    const gymC = gymResC.rows[0];
    createdGymIds.push(gymC.id);

    testAssert('Created test gyms (Gym + Classes, Multi-Gym B, Pro Plan C)', true, `A: ${gymA.id}, B: ${gymB.id}, C: ${gymC.id}`);

    // -------------------------------------------------------------------------
    // 2. CLASS ENTITLEMENT GATING AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 2. AUDITING CLASS ENTITLEMENT GATING ---');
    const statsA = await dashboardRepo.getSummary(gymA.id);
    const statsC = await dashboardRepo.getSummary(gymC.id);

    testAssert('Gym + Classes tier has hasClassFeature = true', statsA.hasClassFeature === true);
    testAssert('Pro tier has hasClassFeature = false', statsC.hasClassFeature === false);

    // -------------------------------------------------------------------------
    // 3. ZERO-CLASS FLOW AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 3. AUDITING ZERO-CLASS FLOW ---');
    const initialClassesA = await classService.getClassesList(gymA.id);
    testAssert('Starts with 0 classes in Gym A', initialClassesA.length === 0);

    // -------------------------------------------------------------------------
    // 4. CLASS CREATION AUDIT (SECTION 1)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. AUDITING CLASS ENTITY & CREATION ---');
    const createdClassA = await classService.createNewClass(gymA.id, {
      name: 'Power Yoga',
      category: 'Yoga',
      instructorName: 'Sarah Jenkins',
      capacity: 20,
      monthlyPrice: 1200,
      dropInPrice: 150,
      description: 'High-intensity morning flow',
      schedule: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '08:00' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '08:00' },
        { dayOfWeek: 5, startTime: '07:00', endTime: '08:00' }
      ]
    });

    testAssert('Power Yoga class created with valid UUID', Boolean(createdClassA.id));
    testAssert('Class entity has correct monthlyPrice = 1200', Number(createdClassA.monthlyPrice) === 1200);
    testAssert('Class entity has correct dropInPrice = 150', Number(createdClassA.dropInPrice) === 150);
    testAssert('Class entity has correct capacity = 20', Number(createdClassA.capacity) === 20);
    testAssert('Class entity has 3 recurring schedule slots', createdClassA.schedule.length === 3);

    // Edit class capacity and instructor
    const updatedClassA = await classService.updateExistingClass(gymA.id, createdClassA.id, {
      name: 'Power Yoga Advanced',
      category: 'Yoga',
      instructorName: 'Sarah Jenkins Master',
      capacity: 25,
      monthlyPrice: 1300,
      dropInPrice: 160
    });
    testAssert('Class edited successfully (capacity = 25, price = 1300)', updatedClassA.capacity === 25 && updatedClassA.monthlyPrice === 1300);

    // -------------------------------------------------------------------------
    // 5. CLASS PLAN LOGIC AUDIT (SECTION 2)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. AUDITING CLASS SUBSCRIPTION PLAN LOGIC ---');
    // Note: Class monthly retail fee is ₹1300, but packaged Class Plan is ₹999/month
    const createdPlanA = await classPlansRepo.createClassPlan(gymA.id, {
      classId: createdClassA.id,
      name: 'Yoga Monthly Pass',
      price: 999,
      billingPeriod: 'Monthly',
      sessionLimit: 12,
      isUnlimited: false,
      description: '12 sessions per month for Power Yoga'
    });

    testAssert('Class Plan created with price ₹999 distinct from retail fee ₹1300', createdPlanA.price === 999);
    testAssert('Class Plan links to Power Yoga as primary class', createdPlanA.classId === createdClassA.id);
    testAssert('Class Plan sessionLimit = 12, isUnlimited = false', createdPlanA.sessionLimit === 12 && createdPlanA.isUnlimited === false);

    // -------------------------------------------------------------------------
    // 6. MEMBER CLASS ENROLLMENT AUDIT (SECTION 4)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. AUDITING MEMBER CLASS ENROLLMENT ---');
    // Create member Priya Sharma
    const memberRes = await pool.query(
      `INSERT INTO members (
        gym_id, member_id, first_name, last_name, gender, date_of_birth, address, emergency_contact, phone, email, join_date, is_active, qr_code
       ) VALUES ($1, $2, 'Priya', 'Sharma', 'Female', '1995-05-15', '123 Yoga Lane', '9876543210', '9876500001', 'priya@example.com', CURRENT_DATE, TRUE, 'QR_PRIYA_01')
       RETURNING id, member_id, first_name, last_name, membership_plan_id`,
      [gymA.id, `MEM-${Date.now().toString().slice(-4)}`]
    );
    const priya = memberRes.rows[0];

    testAssert('Created member Priya Sharma with NULL membership_plan_id', priya.membership_plan_id === null);

    // Enroll Priya into "Yoga Monthly Pass" with partial payment: ₹500 paid, ₹499 due
    const enrollment = await classMembershipsRepo.enrollClassMembership(gymA.id, priya.id, createdPlanA.id, {
      totalAmount: 999,
      paidAmount: 500,
      paymentMethod: 'UPI',
      notes: 'Initial partial payment'
    });

    testAssert('Class membership created with Active status', enrollment.membership.status === 'Active');
    testAssert('Class membership sessions_allowed = 12, sessions_used = 0', Number(enrollment.membership.sessions_allowed) === 12 && Number(enrollment.membership.sessions_used) === 0);
    testAssert('Class payment recorded with total: 999, paid: 500, remaining: 499, status: Partial',
      Number(enrollment.payment.total_amount) === 999 &&
      Number(enrollment.payment.paid_amount) === 500 &&
      Number(enrollment.payment.remaining_amount) === 499 &&
      enrollment.payment.payment_status === 'Partial'
    );

    // CRITICAL DOMAIN SEPARATION CHECK:
    const priyaAfterEnroll = (await pool.query('SELECT membership_plan_id FROM members WHERE id = $1', [priya.id])).rows[0];
    testAssert('CRITICAL: Enrolling in class plan does NOT grant normal gym membership (remains null)', priyaAfterEnroll.membership_plan_id === null);

    // -------------------------------------------------------------------------
    // 7. CLASS SESSIONS & BOOKING AUDIT (SECTION 7 & 8)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. AUDITING CLASS SESSIONS & BOOKING ---');
    // Ensure session for today
    const todayDate = new Date().toISOString().split('T')[0];
    const session = await classesRepo.ensureSession(gymA.id, createdClassA.id, todayDate, '07:00', '08:00', 25);

    // Book session for Priya
    const booking = await classService.bookSession(gymA.id, createdClassA.id, session.id, priya.id);
    testAssert('Class session booked successfully', booking.status === 'Booked' || booking.status === 'Confirmed');

    // Verify session booking count in class_bookings is 1
    const countRes = await pool.query(
      `SELECT COUNT(*) AS active_count FROM class_bookings WHERE session_id = $1 AND status = 'Booked'`,
      [session.id]
    );
    testAssert('Session active booking count is 1', Number(countRes.rows[0].active_count) === 1);

    // Verify member session quota decremented / sessions_used incremented
    const membershipAfterBooking = (await pool.query('SELECT sessions_used FROM class_memberships WHERE id = $1', [enrollment.membership.id])).rows[0];
    testAssert('Class membership sessions_used incremented to 1', membershipAfterBooking.sessions_used === 1);

    // Verify duplicate booking prevention
    let duplicatePrevented = false;
    try {
      await classService.bookSession(gymA.id, createdClassA.id, session.id, priya.id);
    } catch (err) {
      duplicatePrevented = true;
    }
    testAssert('Duplicate class session booking is prevented', duplicatePrevented);

    // CRITICAL CHECK: Booking must not touch normal gym attendance
    const gymAttendanceForPriyaBefore = await attendanceRepo.findAttendanceByMemberAndDate(gymA.id, priya.id, todayDate);
    testAssert('CRITICAL: Class booking created 0 rows in normal gym attendance', gymAttendanceForPriyaBefore === null);

    // -------------------------------------------------------------------------
    // 8. CLASS ATTENDANCE VS NORMAL GYM ATTENDANCE (SECTIONS 9 & 10)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. AUDITING CLASS ATTENDANCE & NORMAL GYM ATTENDANCE INDEPENDENCE ---');
    // Mark class attendance
    const classAtt = await classService.markAttendance(
      gymA.id,
      createdClassA.id,
      session.id,
      priya.id,
      'Attended'
    );
    testAssert('Class attendance marked as Attended', classAtt.status === 'Attended');

    // Verify normal gym attendance is still unaffected
    const gymAttendanceForPriyaAfterClassAtt = await attendanceRepo.findAttendanceByMemberAndDate(gymA.id, priya.id, todayDate);
    testAssert('CRITICAL: Class attendance does NOT create or affect normal gym attendance', gymAttendanceForPriyaAfterClassAtt === null);

    // Now perform NORMAL Gym Check-in for Priya on the SAME day:
    const nowIso = new Date().toISOString();
    const normalCheckInResult = await attendanceService.createAttendance(
      gymA.id,
      {
        memberId: priya.id,
        attendanceDate: todayDate,
        attendanceMethod: 'Manual',
        checkInTime: nowIso
      }
    );
    testAssert('CRITICAL: Same member can check into Normal Gym on same day without collision', Boolean(normalCheckInResult.id));

    // Verify duplicate normal check-in returns 409 business conflict
    let normalDuplicateConflict = false;
    try {
      await attendanceService.createAttendance(
        gymA.id,
        {
          memberId: priya.id,
          attendanceDate: todayDate,
          attendanceMethod: 'Manual',
          checkInTime: new Date(Date.now() + 1800000).toISOString()
        }
      );
    } catch (err) {
      if (err.statusCode === 409 || err.message.includes('already been checked in today')) {
        normalDuplicateConflict = true;
      }
    }
    testAssert('Normal gym duplicate same-day check-in throws 409 business conflict', normalDuplicateConflict);

    // Normal gym check-out
    const checkOutResult = await attendanceService.updateAttendance(gymA.id, normalCheckInResult.id, {
      checkOutTime: new Date(Date.now() + 3600000).toISOString()
    });
    testAssert('Normal gym check-out works cleanly', Boolean(checkOutResult.check_out_time || checkOutResult.checkOutTime));

    // Verify class attendance was NOT touched by normal gym checkout
    const classAttCheck = (await pool.query('SELECT status FROM class_attendance WHERE id = $1', [classAtt.id])).rows[0];
    testAssert('Class attendance remains intact after normal gym check-out', classAttCheck.status === 'Attended');

    // -------------------------------------------------------------------------
    // 9. REVENUE & PAYMENT DOMAIN ISOLATION (SECTIONS 11, 12, 13, 14)
    // -------------------------------------------------------------------------
    console.log('\n--- 9. AUDITING REVENUE & PAYMENT DOMAIN ISOLATION ---');

    // Currently: Priya paid ₹500 for Class Plan. Normal gym payment = ₹0.
    const revAnalytics1 = await revenueAnalyticsService.getBusinessRevenueOverview(gymA.id);
    testAssert('Gym Membership Revenue is ₹0 (excludes class payment)', revAnalytics1.businessSummary.gymMembershipRevenue === 0);
    testAssert('Class Revenue is ₹500 (includes only class payments)', revAnalytics1.businessSummary.classRevenue === 500);
    testAssert('Total Combined Business Revenue is ₹500', revAnalytics1.businessSummary.totalBusinessRevenue === 500);

    // Now create a normal gym member and record a normal gym payment of ₹2500
    const normalMemberRes = await pool.query(
      `INSERT INTO members (
        gym_id, member_id, first_name, last_name, gender, date_of_birth, address, emergency_contact, phone, email, join_date, is_active, qr_code
       ) VALUES ($1, $2, 'Rohan', 'Verma', 'Male', '1990-08-20', '456 Iron Street', '9876543211', '9876500002', 'rohan@example.com', CURRENT_DATE, TRUE, 'QR_ROHAN_01')
       RETURNING id, member_id`,
      [gymA.id, `MEM-${Date.now().toString().slice(-4)}B`]
    );
    const rohan = normalMemberRes.rows[0];

    const normalPlanRes = await pool.query(
      `INSERT INTO membership_plans (gym_id, plan_name, duration_in_days, price, is_active)
       VALUES ($1, 'Annual Iron Gold', 365, 2500, TRUE)
       RETURNING id`,
      [gymA.id]
    );
    const normalPlan = normalPlanRes.rows[0];

    await paymentRepo.createPayment({
      gymId: gymA.id,
      memberId: rohan.id,
      membershipPlanId: normalPlan.id,
      paymentAmount: 2500,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 2500,
      paidAmount: 2500,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      paymentDate: todayDate,
      nextDueDate: todayDate,
      collectedByStaffId: staffA.id
    });

    const revAnalytics2 = await revenueAnalyticsService.getBusinessRevenueOverview(gymA.id);
    testAssert('Normal Gym Revenue updated to ₹2500', revAnalytics2.businessSummary.gymMembershipRevenue === 2500);
    testAssert('Class Revenue strictly REMAINS ₹500 (no leakage)', revAnalytics2.businessSummary.classRevenue === 500);
    testAssert('Total Business Revenue is ₹3000 (2500 + 500)', revAnalytics2.businessSummary.totalBusinessRevenue === 3000);

    // Dashboard repository stats check
    const dashStatsA = await dashboardRepo.getSummary(gymA.id);
    testAssert('Dashboard gym_total_revenue = 2500', Number(dashStatsA.gym_total_revenue) === 2500);
    testAssert('Dashboard class_total_revenue = 500', Number(dashStatsA.class_total_revenue) === 500);
    testAssert('Dashboard total_revenue = 3000', Number(dashStatsA.gym_total_revenue) + Number(dashStatsA.class_total_revenue) === 3000);

    // -------------------------------------------------------------------------
    // 10. CLASS DUES & DUES PAYMENT AUDIT (SECTION 14)
    // -------------------------------------------------------------------------
    console.log('\n--- 10. AUDITING CLASS DUES & DUES PAYMENT ---');
    const classDues = await classMembershipsRepo.listClassOutstandingDues(gymA.id);
    testAssert('Class outstanding dues lists Priya with remainingAmount = 499',
      classDues.length === 1 && classDues[0].remainingAmount === 499 && classDues[0].memberName === 'Priya Sharma'
    );

    // Verify normal gym dues query does NOT list class dues
    const gymOutstanding = await paymentRepo.getOutstandingPayments(gymA.id);
    const priyaInGymDues = gymOutstanding.members.find(m => m.id === priya.id && m.remainingAmount > 0);
    testAssert('CRITICAL: Normal gym outstanding dues does NOT list Priya class dues', !priyaInGymDues);

    // Record class dues payment: pay remaining ₹499
    const paidDues = await classMembershipsRepo.recordClassDuesPayment(gymA.id, enrollment.payment.id, 499, 'UPI');
    testAssert('Class dues payment recorded: remaining = 0, status = Paid, paid = 999',
      Number(paidDues.remaining_amount) === 0 && paidDues.payment_status === 'Paid' && Number(paidDues.paid_amount) === 999
    );

    const classDuesAfter = await classMembershipsRepo.listClassOutstandingDues(gymA.id);
    testAssert('Class outstanding dues is now 0 after full dues payment', classDuesAfter.length === 0);

    const revAnalytics3 = await revenueAnalyticsService.getBusinessRevenueOverview(gymA.id);
    testAssert('Class Revenue updated to ₹999 after full dues payment', revAnalytics3.businessSummary.classRevenue === 999);
    testAssert('Total Business Revenue updated to ₹3499 (2500 + 999)', revAnalytics3.businessSummary.totalBusinessRevenue === 3499);

    // -------------------------------------------------------------------------
    // 11. SOFT DELETE AUDIT FOR CLASS PAYMENTS
    // -------------------------------------------------------------------------
    console.log('\n--- 11. AUDITING CLASS PAYMENT SOFT DELETION ---');
    const softDeleted = await classMembershipsRepo.softDeleteClassPayment(gymA.id, enrollment.payment.id);
    testAssert('Class payment soft-deleted (deleted_at set)', Boolean(softDeleted.id));

    // Revenue analytics must exclude soft-deleted class payment
    const revAnalyticsAfterSoftDelete = await revenueAnalyticsService.getBusinessRevenueOverview(gymA.id);
    testAssert('Class Revenue decremented back to ₹0 after soft-delete', revAnalyticsAfterSoftDelete.businessSummary.classRevenue === 0);
    testAssert('Total Business Revenue is ₹2500 after class payment soft-delete', revAnalyticsAfterSoftDelete.businessSummary.totalBusinessRevenue === 2500);

    // Audit trail verification in database
    const dbPaymentRow = (await pool.query('SELECT deleted_at FROM class_payments WHERE id = $1', [enrollment.payment.id])).rows[0];
    testAssert('Class payment audit row preserved in DB with deleted_at timestamp', dbPaymentRow.deleted_at !== null);

    // -------------------------------------------------------------------------
    // 12. MULTI-GYM LOCATION ISOLATION AUDIT (SECTION 19)
    // -------------------------------------------------------------------------
    console.log('\n--- 12. AUDITING MULTI-GYM LOCATION ISOLATION ---');
    const classesGymB = await classService.getClassesList(gymB.id);
    testAssert('Location B has 0 classes (no leakage from Location A)', classesGymB.length === 0);

    const membersGymB = await pool.query('SELECT id FROM members WHERE gym_id = $1', [gymB.id]);
    testAssert('Location B has 0 members (no leakage from Location A)', membersGymB.rows.length === 0);

    const revGymB = await revenueAnalyticsService.getBusinessRevenueOverview(gymB.id);
    testAssert('Location B has ₹0 revenue (independent financial ledger)', revGymB.businessSummary.totalBusinessRevenue === 0);

  } catch (err) {
    console.error('UNEXPECTED ERROR DURING AUDIT:', err);
    failed++;
  } finally {
    // -------------------------------------------------------------------------
    // 13. TEARDOWN & CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- 13. CLEANING UP TEST DATA ---');
    for (const gymId of createdGymIds) {
      try {
        await pool.query('DELETE FROM gyms WHERE id = $1', [gymId]);
      } catch (e) {
        console.error('Error cleaning up gym', gymId, e.message);
      }
    }
    console.log(`Cleaned up ${createdGymIds.length} test gyms.`);
  }

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCompleteClassDomainAudit();
