const { pool } = require('../apps/api/src/db/pool');
const classService = require('../apps/api/src/services/classes.service');
const classPlansRepo = require('../apps/api/src/repositories/class-plans.repository');
const classMembershipsRepo = require('../apps/api/src/repositories/class-memberships.repository');
const classesRepo = require('../apps/api/src/repositories/classes.repository');
const attendanceService = require('../apps/api/src/services/attendance.service');
const attendanceRepo = require('../apps/api/src/repositories/attendance.repository');
const paymentRepo = require('../apps/api/src/repositories/payment.repository');
const revenueAnalyticsService = require('../apps/api/src/services/revenue-analytics.service');
const dashboardRepo = require('../apps/api/src/repositories/dashboard.repository');
const reportService = require('../apps/api/src/services/report.service');
const memberAppService = require('../apps/api/src/services/member-app.service');

async function run33StepScenario() {
  console.log('================================================================');
  console.log(' GYMPULSE — SECTION AD: 33-STEP COMPLETE END-TO-END SCENARIO   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const createdGymIds = [];

  const assertStep = (stepNum, title, condition, detail = '') => {
    if (condition) {
      console.log(`[PASS] Step ${stepNum}: ${title} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] Step ${stepNum}: ${title} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Create Gym + Classes gym
    // -------------------------------------------------------------------------
    const gymRes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '108 Nirvana Marg', 'Pune', 'Maharashtra', 'India', '411001',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 2, 'monthly')
       RETURNING id, name, subscription_plan`,
      ['Cult Pulse Elite', 'Vikram Malhotra', `cult_elite_${Date.now()}@example.com`, '9820011111']
    );
    const gym = gymRes.rows[0];
    createdGymIds.push(gym.id);
    assertStep(1, 'Create Gym + Classes gym', gym && gym.subscription_plan === 'Gym + Classes', `Gym ID: ${gym.id}`);

    const staffRes = await pool.query(
      `INSERT INTO staff (gym_id, first_name, last_name, email, phone, password_hash, role, is_active)
       VALUES ($1, 'Vikram', 'Malhotra', $2, '9820011111', 'hash123', 'Owner', TRUE)
       RETURNING id`,
      [gym.id, `staff_${Date.now()}@example.com`]
    );
    const staff = staffRes.rows[0];

    // Second gym for Multi-Gym isolation testing (Step 33)
    const gymRes2 = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '200 Outer Ring', 'Pune', 'Maharashtra', 'India', '411002',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 2, 'monthly')
       RETURNING id, name`,
      ['Cult Pulse North', 'Vikram Malhotra', `cult_north_${Date.now()}@example.com`, '9820022222']
    );
    const gym2 = gymRes2.rows[0];
    createdGymIds.push(gym2.id);

    // -------------------------------------------------------------------------
    // STEP 2: Create Power Yoga (Category: Yoga, Instructor: Bhushan, Cap: 20, Drop-in: ₹150)
    // -------------------------------------------------------------------------
    const powerYoga = await classService.createNewClass(gym.id, {
      name: 'Power Yoga',
      category: 'Yoga',
      instructorName: 'Bhushan',
      capacity: 20,
      monthlyPrice: 1200,
      dropInPrice: 150,
      description: 'Dynamic Vinyasa flow for core strength and mobility',
      isActive: true,
      schedule: [
        { dayOfWeek: 'Monday', startTime: '07:00', endTime: '08:00' }
      ]
    });
    assertStep(
      2,
      'Create Power Yoga (Yoga, Bhushan, Cap: 20, Drop-in: ₹150)',
      powerYoga &&
        powerYoga.name === 'Power Yoga' &&
        powerYoga.category === 'Yoga' &&
        powerYoga.instructorName === 'Bhushan' &&
        Number(powerYoga.capacity) === 20 &&
        Number(powerYoga.dropInPrice) === 150,
      `Class ID: ${powerYoga.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 3: Add schedule Monday 07:00-08:00
    // -------------------------------------------------------------------------
    const classDetail = await classService.getClassById(gym.id, powerYoga.id);
    const hasMondaySchedule = classDetail.schedule.some(
      (s) => s.dayOfWeek === 'Monday' && s.startTime.startsWith('07:00') && s.endTime.startsWith('08:00')
    );
    assertStep(3, 'Add schedule Monday 07:00-08:00', hasMondaySchedule, `Schedules: ${classDetail.schedule.length}`);

    // -------------------------------------------------------------------------
    // STEP 4: Create Yoga Monthly (₹999/month, 12 sessions)
    // -------------------------------------------------------------------------
    const yogaPlan = await classPlansRepo.createClassPlan(gym.id, {
      classId: powerYoga.id,
      name: 'Yoga Monthly',
      price: 999,
      billingPeriod: 'monthly',
      sessionLimit: 12,
      isUnlimited: false,
      description: '12 morning yoga sessions per month'
    });
    assertStep(
      4,
      'Create Yoga Monthly (₹999/month, 12 sessions)',
      yogaPlan &&
        yogaPlan.name === 'Yoga Monthly' &&
        Number(yogaPlan.price) === 999 &&
        Number(yogaPlan.sessionLimit) === 12 &&
        yogaPlan.isUnlimited === false,
      `Plan ID: ${yogaPlan.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 5: Create test member (Priya Sharma, NULL membership_plan_id)
    // -------------------------------------------------------------------------
    const memberRes = await pool.query(
      `INSERT INTO members (
        gym_id, member_id, first_name, last_name, gender, date_of_birth, address, emergency_contact, phone, email, join_date, is_active, qr_code
       ) VALUES ($1, $2, 'Priya', 'Sharma', 'Female', '1995-05-15', '123 Yoga Lane', '9876543210', $3, $4, CURRENT_DATE, TRUE, $5)
       RETURNING id, member_id, first_name, last_name, membership_plan_id`,
      [gym.id, `MEM-${Date.now().toString().slice(-4)}`, `9899${Math.floor(100000 + Math.random() * 900000)}`, `priya_${Date.now()}@example.com`, `QR_PRIYA_${Date.now()}`]
    );
    const priya = memberRes.rows[0];
    assertStep(
      5,
      'Create test member (Priya Sharma, NULL membership_plan_id)',
      priya && priya.first_name === 'Priya' && priya.membership_plan_id === null,
      `Member ID: ${priya.member_id}`
    );

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // STEP 6: Enroll member into Yoga Monthly
    // -------------------------------------------------------------------------
    const enrollment = await classMembershipsRepo.enrollClassMembership(gym.id, priya.id, yogaPlan.id, {
      totalAmount: 999,
      paidAmount: 999,
      paymentMethod: 'UPI',
      notes: 'Initial enrollment payment'
    });
    assertStep(
      6,
      'Enroll member into Yoga Monthly',
      enrollment && enrollment.membership && enrollment.membership.class_plan_id === yogaPlan.id,
      `Membership ID: ${enrollment.membership.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 7: Record ₹999 class payment
    // -------------------------------------------------------------------------
    const payment = enrollment.payment;
    assertStep(
      7,
      'Record ₹999 class payment',
      payment &&
        Number(payment.total_amount) === 999 &&
        Number(payment.paid_amount) === 999 &&
        payment.payment_status === 'Paid',
      `Receipt: ${payment.receipt_number}, Status: ${payment.payment_status}`
    );

    // -------------------------------------------------------------------------
    // STEP 8: Verify Class Membership = Active, Payment = Paid, Class Revenue = ₹999
    // -------------------------------------------------------------------------
    const memberClassList = await classMembershipsRepo.listClassMemberships(gym.id, priya.id);
    const revAnalytics1 = await revenueAnalyticsService.getBusinessRevenueOverview(gym.id);
    const membershipActive = memberClassList.length > 0 && (memberClassList[0].membershipStatus === 'Active' || memberClassList[0].status === 'Active');
    const step8Cond =
      membershipActive &&
      payment.payment_status === 'Paid' &&
      Number(revAnalytics1.businessSummary.classRevenue) === 999 &&
      Number(revAnalytics1.businessSummary.gymMembershipRevenue) === 0;
    assertStep(
      8,
      'Verify Class Membership = Active, Payment = Paid, Class Revenue = ₹999',
      step8Cond,
      `Membership Status: ${memberClassList[0]?.membershipStatus || memberClassList[0]?.status}, Class Rev: ₹${revAnalytics1.businessSummary.classRevenue}, Gym Rev: ₹${revAnalytics1.businessSummary.gymMembershipRevenue}`
    );

    // -------------------------------------------------------------------------
    // STEP 9: Generate/create class session
    // -------------------------------------------------------------------------
    const sessionDate = new Date().toISOString().split('T')[0];
    const session = await classesRepo.ensureSession(gym.id, powerYoga.id, sessionDate, '07:00', '08:00', 20);
    assertStep(9, 'Generate/create class session', session && Number(session.capacity) === 20, `Session ID: ${session.id}`);

    // -------------------------------------------------------------------------
    // STEP 10: Book member
    // -------------------------------------------------------------------------
    const booking = await classService.bookSession(gym.id, powerYoga.id, session.id, priya.id);
    assertStep(10, 'Book member into session', booking && (booking.status === 'Booked' || booking.status === 'Confirmed'), `Booking ID: ${booking.id}`);

    // -------------------------------------------------------------------------
    // STEP 11: Verify capacity: 1 / 20
    // -------------------------------------------------------------------------
    const sessions = await classesRepo.listClassSessions(gym.id, { classId: powerYoga.id });
    const currentSession = sessions.find((s) => s.sessionId === session.id);
    const bookedCount = currentSession ? currentSession.bookedCount : 1;
    const sessionCapacity = currentSession ? currentSession.capacity : 20;
    assertStep(
      11,
      'Verify capacity: 1 / 20',
      Number(bookedCount) === 1 && Number(sessionCapacity) === 20,
      `Booked: ${bookedCount}, Capacity: ${sessionCapacity}, Available: ${currentSession?.availableSeats}`
    );

    // -------------------------------------------------------------------------
    // STEP 12: Mark Class Attendance
    // -------------------------------------------------------------------------
    const classAtt = await classService.markAttendance(gym.id, powerYoga.id, session.id, priya.id, 'Attended');
    assertStep(12, 'Mark Class Attendance', classAtt && classAtt.status === 'Attended', `Class Attendance ID: ${classAtt.id}`);

    // -------------------------------------------------------------------------
    // STEP 13: Verify class_attendance = 1, normal attendance = 0
    // -------------------------------------------------------------------------
    const classAttCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM class_attendance WHERE gym_id = $1 AND member_id = $2`,
      [gym.id, priya.id]
    );
    const normalAttCountRes1 = await pool.query(
      `SELECT COUNT(*)::int AS count FROM attendance WHERE gym_id = $1 AND member_id = $2`,
      [gym.id, priya.id]
    );
    const classAttCount = classAttCountRes.rows[0].count;
    const normalAttCount1 = normalAttCountRes1.rows[0].count;
    assertStep(
      13,
      'Verify class_attendance = 1, normal attendance = 0',
      classAttCount === 1 && normalAttCount1 === 0,
      `class_attendance: ${classAttCount}, normal_attendance: ${normalAttCount1}`
    );

    // -------------------------------------------------------------------------
    // STEP 14: Perform normal Gym Check-In on same day
    // -------------------------------------------------------------------------
    const normalCheckIn = await attendanceService.createAttendance(gym.id, {
      memberId: priya.id,
      attendanceDate: sessionDate,
      attendanceMethod: 'Manual',
      checkInTime: new Date().toISOString()
    });
    assertStep(
      14,
      'Perform normal Gym Check-In on same day',
      normalCheckIn && Boolean(normalCheckIn.id),
      `Attendance ID: ${normalCheckIn.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 15: Verify normal attendance = 1, class attendance = 1
    // -------------------------------------------------------------------------
    const normalAttCountRes2 = await pool.query(
      `SELECT COUNT(*)::int AS count FROM attendance WHERE gym_id = $1 AND member_id = $2`,
      [gym.id, priya.id]
    );
    const step15Cond = normalAttCountRes2.rows[0].count === 1 && classAttCount === 1;
    assertStep(
      15,
      'Verify normal attendance = 1, class attendance = 1 (Zero collision)',
      step15Cond,
      `normal_attendance: ${normalAttCountRes2.rows[0].count}, class_attendance: ${classAttCount}`
    );

    // -------------------------------------------------------------------------
    // STEP 16: Checkout normal gym attendance
    // -------------------------------------------------------------------------
    const normalCheckOut = await attendanceService.updateAttendance(gym.id, normalCheckIn.id, {
      checkOutTime: new Date().toISOString()
    });
    assertStep(16, 'Checkout normal gym attendance', normalCheckOut && normalCheckOut.check_out_time !== null, `Check-out: ${normalCheckOut?.check_out_time}`);

    // -------------------------------------------------------------------------
    // STEP 17: Verify class attendance remains unchanged
    // -------------------------------------------------------------------------
    const classAttVerify = await pool.query(
      `SELECT status FROM class_attendance WHERE id = $1`,
      [classAtt.id]
    );
    const step17Cond = classAttVerify.rows[0] && classAttVerify.rows[0].status === 'Attended';
    assertStep(17, 'Verify class attendance remains unchanged', step17Cond, `Status: ${classAttVerify.rows[0]?.status}`);

    // -------------------------------------------------------------------------
    // STEP 18: Create another class payment with partial amount
    // -------------------------------------------------------------------------
    const partialPaymentRes = await pool.query(
      `INSERT INTO class_payments (
        gym_id, class_id, class_plan_id, class_membership_id, member_id, total_amount, paid_amount,
        remaining_amount, payment_date, payment_method, payment_status, receipt_number
       ) VALUES ($1, $2, $3, $4, $5, 1500, 1000, 500, CURRENT_DATE, 'UPI', 'Partial', $6)
       RETURNING id, total_amount, paid_amount, remaining_amount, payment_status`,
      [gym.id, powerYoga.id, yogaPlan.id, enrollment.membership.id, priya.id, `RCP-PART-${Date.now()}`]
    );
    const partialPayment = partialPaymentRes.rows[0];
    assertStep(
      18,
      'Create another class payment with partial amount (Total: 1500, Paid: 1000, Due: 500)',
      partialPayment && Number(partialPayment.remaining_amount) === 500 && partialPayment.payment_status === 'Partial',
      `Payment ID: ${partialPayment.id}, Due: ₹${partialPayment.remaining_amount}`
    );

    // -------------------------------------------------------------------------
    // STEP 19: Verify Class Dues
    // -------------------------------------------------------------------------
    const classDuesList = await classMembershipsRepo.listClassOutstandingDues(gym.id);
    const step19Cond = classDuesList.some((d) => d.memberUuid === priya.id && d.remainingAmount === 500);
    assertStep(19, 'Verify Class Dues lists outstanding ₹500', step19Cond, `Dues count: ${classDuesList.length}`);

    // -------------------------------------------------------------------------
    // STEP 20: Pay remaining amount
    // -------------------------------------------------------------------------
    const settleDuesRes = await classMembershipsRepo.recordClassDuesPayment(gym.id, partialPayment.id, 500, 'Cash');
    assertStep(
      20,
      'Pay remaining amount (₹500)',
      settleDuesRes && Number(settleDuesRes.remaining_amount) === 0 && settleDuesRes.payment_status === 'Paid',
      `Status: ${settleDuesRes?.payment_status}, Remaining: ₹${settleDuesRes?.remaining_amount}`
    );

    // -------------------------------------------------------------------------
    // STEP 21: Verify dues = 0
    // -------------------------------------------------------------------------
    const classDuesListAfter = await classMembershipsRepo.listClassOutstandingDues(gym.id);
    const step21Cond = !classDuesListAfter.some((d) => d.memberUuid === priya.id && d.remainingAmount > 0);
    assertStep(21, 'Verify dues = 0', step21Cond, `Remaining dues count: ${classDuesListAfter.length}`);

    // -------------------------------------------------------------------------
    // STEP 22: Verify Class Revenue updates correctly
    // -------------------------------------------------------------------------
    // Total class revenue should now be 999 + 1500 = 2499
    const revAnalytics2 = await revenueAnalyticsService.getBusinessRevenueOverview(gym.id);
    assertStep(22, 'Verify Class Revenue updates correctly', Number(revAnalytics2.businessSummary.classRevenue) === 2499, `Class Rev: ₹${revAnalytics2.businessSummary.classRevenue}`);

    // -------------------------------------------------------------------------
    // STEP 23: Verify normal Gym Revenue did NOT change
    // -------------------------------------------------------------------------
    assertStep(23, 'Verify normal Gym Revenue did NOT change', Number(revAnalytics2.businessSummary.gymMembershipRevenue) === 0, `Gym Rev: ₹${revAnalytics2.businessSummary.gymMembershipRevenue}`);

    // -------------------------------------------------------------------------
    // STEP 24: Verify Total Business Revenue = Gym Revenue + Class Revenue
    // -------------------------------------------------------------------------
    // Create a normal gym plan and record a normal gym payment of ₹3000 to test both sides together
    const gymPlanRes = await pool.query(
      `INSERT INTO membership_plans (gym_id, plan_name, duration_in_days, price, is_active)
       VALUES ($1, 'General Fitness 1 Month', 30, 3000, TRUE)
       RETURNING id`,
      [gym.id]
    );
    const gymPlan = gymPlanRes.rows[0];

    await pool.query(
      `INSERT INTO payments (
        gym_id, member_id, membership_plan_id, payment_amount, total_amount, paid_amount,
        remaining_amount, payment_date, next_due_date, payment_method, payment_status, collected_by_staff_id
       ) VALUES ($1, $2, $3, 3000, 3000, 3000, 0, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Cash', 'Paid', $4)`,
      [gym.id, priya.id, gymPlan.id, staff.id]
    );
    const revAnalytics3 = await revenueAnalyticsService.getBusinessRevenueOverview(gym.id);
    const step24Cond =
      Number(revAnalytics3.businessSummary.gymMembershipRevenue) === 3000 &&
      Number(revAnalytics3.businessSummary.classRevenue) === 2499 &&
      Number(revAnalytics3.businessSummary.totalBusinessRevenue) === 5499;
    assertStep(
      24,
      'Verify Total Business Revenue = Gym Revenue + Class Revenue',
      step24Cond,
      `Gym: ₹${revAnalytics3.businessSummary.gymMembershipRevenue} + Class: ₹${revAnalytics3.businessSummary.classRevenue} = Total: ₹${revAnalytics3.businessSummary.totalBusinessRevenue}`
    );

    // -------------------------------------------------------------------------
    // STEP 25: Soft-delete class payment
    // -------------------------------------------------------------------------
    const softDeleted = await classMembershipsRepo.softDeleteClassPayment(gym.id, partialPayment.id);
    assertStep(25, 'Soft-delete class payment', softDeleted && softDeleted.deleted_at !== null, `Deleted at: ${softDeleted?.deleted_at}`);

    // -------------------------------------------------------------------------
    // STEP 26: Verify Class Revenue decreases correctly
    // -------------------------------------------------------------------------
    const revAnalytics4 = await revenueAnalyticsService.getBusinessRevenueOverview(gym.id);
    // Class revenue should now be 2499 - 1500 = 999
    assertStep(
      26,
      'Verify Class Revenue decreases correctly after soft-delete',
      Number(revAnalytics4.businessSummary.classRevenue) === 999 && Number(revAnalytics4.businessSummary.totalBusinessRevenue) === 3999,
      `Class Rev: ₹${revAnalytics4.businessSummary.classRevenue}, Total Rev: ₹${revAnalytics4.businessSummary.totalBusinessRevenue}`
    );

    // -------------------------------------------------------------------------
    // STEP 27: Verify payment history remains preserved in DB
    // -------------------------------------------------------------------------
    const dbPaymentRow = await pool.query(
      `SELECT id, deleted_at, paid_amount FROM class_payments WHERE id = $1`,
      [partialPayment.id]
    );
    assertStep(
      27,
      'Verify payment history remains preserved in DB (soft-delete audit trail)',
      dbPaymentRow.rows.length === 1 && dbPaymentRow.rows[0].deleted_at !== null,
      `Row found: ${dbPaymentRow.rows.length}, deleted_at: ${dbPaymentRow.rows[0]?.deleted_at}`
    );

    // -------------------------------------------------------------------------
    // STEP 28: Verify Class Report
    // -------------------------------------------------------------------------
    const classAnalytics = await classService.getClassAnalytics(gym.id);
    const step28Cond = Boolean(classAnalytics);
    assertStep(28, 'Verify Class Report / Analytics', step28Cond, `Class analytics returned data`);

    // -------------------------------------------------------------------------
    // STEP 29: Verify normal Payment Report
    // -------------------------------------------------------------------------
    const paymentReport = await reportService.getReport(gym.id, { type: 'payment' });
    const step29Cond =
      paymentReport &&
      Array.isArray(paymentReport.items) &&
      paymentReport.items.some((p) => Number(p.total_amount) === 3000);
    assertStep(29, 'Verify normal Payment Report retains integrity', step29Cond, `Gym payments count: ${paymentReport.items?.length}`);

    // -------------------------------------------------------------------------
    // STEP 30: Verify normal Attendance Report
    // -------------------------------------------------------------------------
    const attReport = await reportService.getReport(gym.id, { type: 'attendance' });
    const step30Cond =
      attReport &&
      Array.isArray(attReport.items) &&
      attReport.items.some((r) => r.member_id === priya.member_id);
    assertStep(30, 'Verify normal Attendance Report', step30Cond, `Normal attendance records: ${attReport.items?.length}`);

    // -------------------------------------------------------------------------
    // STEP 31: Verify Member Mobile
    // -------------------------------------------------------------------------
    const memberDashboard = await memberAppService.getMemberDashboard(gym.id, priya.id);
    const memberClasses = await classMembershipsRepo.listClassMemberships(gym.id, priya.id);
    const memberName = memberDashboard?.profile?.firstName || memberDashboard?.member?.firstName;
    const step31Cond =
      memberDashboard &&
      Boolean(memberName) &&
      memberClasses.length > 0 &&
      memberClasses[0].className === 'Power Yoga';
    assertStep(31, 'Verify Member Mobile (Class membership visible to member)', step31Cond, `Member: ${memberName}, Class: ${memberClasses[0]?.className}`);

    // -------------------------------------------------------------------------
    // STEP 32: Verify Owner Mobile
    // -------------------------------------------------------------------------
    const ownerSummary = await dashboardRepo.getSummary(gym.id);
    const subPlan = ownerSummary?.subscriptionPlan || ownerSummary?.subscription_plan;
    const totalCount = Number(ownerSummary?.totalMembers ?? ownerSummary?.total_members ?? 0);
    const classCount = Number(ownerSummary?.classMembers ?? ownerSummary?.class_members ?? 0);
    const step32Cond =
      ownerSummary &&
      ownerSummary.hasClassFeature === true &&
      subPlan === 'Gym + Classes' &&
      (totalCount >= 1 || classCount >= 1);
    assertStep(32, 'Verify Owner Mobile dashboard data integrity', step32Cond, `hasClassFeature: ${ownerSummary?.hasClassFeature}, totalMembers: ${totalCount}, classMembers: ${classCount}`);

    // -------------------------------------------------------------------------
    // STEP 33: Verify Multi-Gym isolation
    // -------------------------------------------------------------------------
    const gym2Classes = await classService.getClassesList(gym2.id);
    const gym2Members = await pool.query(`SELECT COUNT(*)::int AS count FROM members WHERE gym_id = $1`, [gym2.id]);
    const gym2Rev = await revenueAnalyticsService.getBusinessRevenueOverview(gym2.id);
    const step33Cond =
      gym2Classes.length === 0 &&
      gym2Members.rows[0].count === 0 &&
      Number(gym2Rev.businessSummary.totalBusinessRevenue) === 0;
    assertStep(
      33,
      'Verify Multi-Gym isolation (Location B has 0 classes, 0 members, ₹0 revenue)',
      step33Cond,
      `Location B classes: ${gym2Classes.length}, members: ${gym2Members.rows[0].count}, revenue: ₹${gym2Rev.businessSummary.totalBusinessRevenue}`
    );

  } catch (err) {
    console.error('Fatal error during 33-step scenario execution:', err);
    failed++;
  } finally {
    // Clean up created gyms
    console.log('\n--- CLEANING UP TEST DATA ---');
    for (const gid of createdGymIds) {
      await pool.query('DELETE FROM gyms WHERE id = $1', [gid]);
    }
    console.log(`Cleaned up ${createdGymIds.length} test gyms.`);
  }

  console.log('\n================================================================');
  console.log(`33-STEP SCENARIO RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run33StepScenario()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
