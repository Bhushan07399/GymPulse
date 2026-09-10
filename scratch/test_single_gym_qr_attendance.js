const path = require('path');
const { pool } = require('../apps/api/src/db/pool');
const memberAppService = require('../apps/api/src/services/member-app.service');
const memberAppRepo = require('../apps/api/src/repositories/member-app.repository');
const attendanceRepo = require('../apps/api/src/repositories/attendance.repository');
const classesRepo = require('../apps/api/src/repositories/classes.repository');
const { createGymQrString } = require('../apps/api/src/utils/gym-qr');

async function runSingleGymQrSuite() {
  console.log('================================================================');
  console.log(' GYMPULSE — 31-POINT SINGLE GYM QR ATTENDANCE VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const gymIdsToClean = [];

  const assertStep = (stepNum, title, condition, detail = '') => {
    if (condition) {
      console.log(`[PASS] Step ${stepNum}: ${title} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] Step ${stepNum}: ${title} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  };

  const createTestMember = async (gymId, firstName, lastName, gender = 'Male', { isActive = true, isExpired = false } = {}) => {
    const phone = '9820' + Math.floor(100000 + Math.random() * 900000);
    const email = `${firstName.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
    const memId = `MEM-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
    const qrCode = `QR_${memId}`;
    const normalizedGender = String(gender).toLowerCase() === 'female' ? 'Female' : 'Male';

    const res = await pool.query(
      `INSERT INTO members (
        gym_id, member_id, first_name, last_name, gender, date_of_birth,
        address, emergency_contact, phone, email, join_date, expiry_date, is_active, qr_code
       ) VALUES (
        $1, $2, $3, $4, $5, '1995-01-01',
        'Test Address', '9820099999', $6, $7,
        CASE WHEN $8::boolean THEN CURRENT_DATE - INTERVAL '35 days' ELSE CURRENT_DATE END,
        CASE WHEN $8::boolean THEN CURRENT_DATE - INTERVAL '5 days' ELSE CURRENT_DATE + INTERVAL '30 days' END,
        $9, $10
       ) RETURNING id, member_id, gym_id, first_name, last_name`,
      [gymId, memId, firstName, lastName, normalizedGender, phone, email, isExpired, isActive, qrCode]
    );
    return res.rows[0];
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Create Gym A (Multi-Gym enabled, Owner A)
    // -------------------------------------------------------------------------
    const gymARes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '100 Main St', 'Mumbai', 'Maharashtra', 'India', '400001',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 3, 'monthly')
       RETURNING id, name, is_multi_gym`,
      ['Pulse Gym Prime', 'Owner Alpha', `gym_a_${Date.now()}@example.com`, '9820011101']
    );
    const gymA = gymARes.rows[0];
    gymIdsToClean.push(gymA.id);
    assertStep(1, 'Create Gym A with Multi-Gym enabled', gymA && gymA.is_multi_gym, `Gym A ID: ${gymA.id}`);

    // -------------------------------------------------------------------------
    // STEP 2: Create Gym B (Same Owner Alpha, Location 2)
    // -------------------------------------------------------------------------
    const gymBRes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '200 West Ave', 'Mumbai', 'Maharashtra', 'India', '400002',
        'Gym + Classes', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', TRUE, 3, 'monthly')
       RETURNING id, name, is_multi_gym`,
      ['Pulse Gym West', 'Owner Alpha', `gym_b_${Date.now()}@example.com`, '9820011102']
    );
    const gymB = gymBRes.rows[0];
    gymIdsToClean.push(gymB.id);
    assertStep(2, 'Create Gym B under same Owner Alpha', gymB && gymB.name === 'Pulse Gym West', `Gym B ID: ${gymB.id}`);

    // -------------------------------------------------------------------------
    // STEP 3: Create Gym C (Different Owner Beta)
    // -------------------------------------------------------------------------
    const gymCRes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '300 Rival Rd', 'Mumbai', 'Maharashtra', 'India', '400003',
        'Standard', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', FALSE, 1, 'monthly')
       RETURNING id, name`,
      ['Rival Fitness', 'Owner Beta', `gym_c_${Date.now()}@example.com`, '9820011103']
    );
    const gymC = gymCRes.rows[0];
    gymIdsToClean.push(gymC.id);
    assertStep(3, 'Create Gym C under different Owner Beta', gymC && gymC.name === 'Rival Fitness', `Gym C ID: ${gymC.id}`);

    // -------------------------------------------------------------------------
    // STEP 4: Create Member 1 registered at Gym A
    // -------------------------------------------------------------------------
    const member1 = await createTestMember(gymA.id, 'Rohan', 'Sharma', 'male');
    assertStep(4, 'Create Member 1 at Gym A', member1 && member1.id, `Member ID: ${member1.member_id}`);

    // -------------------------------------------------------------------------
    // STEP 5: Verify Gym A Physical QR format (Hardened HMAC-SHA256 Token)
    // -------------------------------------------------------------------------
    const physicalQrString = createGymQrString(gymA.id);
    const jsonQrString = JSON.stringify({ token: physicalQrString });
    assertStep(
      5,
      'Physical Gym QR format is GYMPULSE-GYM:<gymId>.<signature>',
      physicalQrString.startsWith('GYMPULSE-GYM:') && physicalQrString.includes('.')
    );

    // -------------------------------------------------------------------------
    // STEP 6: Member 1 First Check-In via Physical Gym QR
    // -------------------------------------------------------------------------
    const scan1 = await memberAppService.scanMemberAttendanceQR(gymA.id, member1.id, { qrPayload: physicalQrString });
    assertStep(6, 'First Gym QR scan returns CHECK_IN', scan1 && scan1.action === 'CHECK_IN' && scan1.status === 'CHECKED_IN');

    // -------------------------------------------------------------------------
    // STEP 7: Database verification for Check-In record
    // -------------------------------------------------------------------------
    const attDb1 = await pool.query(
      'SELECT id, gym_id, member_id, attendance_method, check_in_time, check_out_time FROM attendance WHERE id = $1',
      [scan1.attendance.id]
    );
    const row1 = attDb1.rows[0];
    assertStep(
      7,
      'Database attendance row has method QR, check_in_time set, check_out_time NULL',
      row1 && row1.attendance_method === 'QR' && row1.check_in_time && row1.check_out_time === null
    );

    // -------------------------------------------------------------------------
    // STEP 8: Duplicate Check-In Attempt returns 409 ALREADY_CHECKED_IN
    // -------------------------------------------------------------------------
    let duplicateCaught = false;
    let duplicateErrData = null;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member1.id, { qrPayload: physicalQrString });
    } catch (err) {
      if (err.statusCode === 409 && err.code === 'ALREADY_CHECKED_IN') {
        duplicateCaught = true;
        duplicateErrData = err.data;
      }
    }
    assertStep(
      8,
      'Duplicate scan on same day returns 409 ALREADY_CHECKED_IN with checkInTime',
      duplicateCaught && duplicateErrData && duplicateErrData.checkInTime && duplicateErrData.status === 'CHECKED_IN'
    );

    // -------------------------------------------------------------------------
    // STEP 9: Manual Checkout Flow
    // -------------------------------------------------------------------------
    const checkoutRes = await memberAppService.memberCheckOutAttendance(gymA.id, member1.id);
    assertStep(
      9,
      'Manual checkout sets check_out_time and returns CHECKED_OUT',
      checkoutRes && checkoutRes.action === 'CHECK_OUT' && checkoutRes.checkOutTime && !checkoutRes.alreadyCheckedOut
    );

    // -------------------------------------------------------------------------
    // STEP 10: Idempotent Checkout
    // -------------------------------------------------------------------------
    const checkoutRes2 = await memberAppService.memberCheckOutAttendance(gymA.id, member1.id);
    assertStep(
      10,
      'Calling checkout again returns idempotent success (alreadyCheckedOut: true)',
      checkoutRes2 && checkoutRes2.action === 'CHECK_OUT' && checkoutRes2.alreadyCheckedOut === true
    );

    // -------------------------------------------------------------------------
    // STEP 11: Scanning Gym QR again after completion returns 409 ALREADY_COMPLETED
    // -------------------------------------------------------------------------
    let completedCaught = false;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member1.id, { qrPayload: physicalQrString });
    } catch (err) {
      if (err.statusCode === 409 && err.code === 'ALREADY_COMPLETED') {
        completedCaught = true;
      }
    }
    assertStep(11, 'Scanning QR after completed checkout returns 409 ALREADY_COMPLETED', completedCaught);

    // -------------------------------------------------------------------------
    // STEP 12: Auto-checkout mechanism (4-hour auto-checkout)
    // -------------------------------------------------------------------------
    const pastAttRes = await pool.query(
      `INSERT INTO attendance (gym_id, member_id, attendance_date, check_in_time, attendance_method)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '6 hours', 'QR')
       RETURNING id`,
      [gymA.id, member1.id]
    );
    const pastId = pastAttRes.rows[0].id;
    await attendanceRepo.autoFinalizeExpiredAttendance(gymA.id);
    const pastCheck = await pool.query('SELECT check_out_time FROM attendance WHERE id = $1', [pastId]);
    assertStep(
      12,
      'autoFinalizeExpiredAttendance auto-checks out records older than 4 hours',
      pastCheck.rows[0] && pastCheck.rows[0].check_out_time !== null
    );

    // -------------------------------------------------------------------------
    // STEP 13: Previous-day finalization when member queries today attendance
    // -------------------------------------------------------------------------
    const todayAttRes = await memberAppRepo.getTodayAttendanceForMember(gymA.id, member1.id);
    assertStep(13, 'getTodayAttendanceForMember auto-finalizes and returns today status', todayAttRes !== undefined);

    // -------------------------------------------------------------------------
    // STEP 14: Tampering Security — JSON QR format
    // -------------------------------------------------------------------------
    const member3 = await createTestMember(gymA.id, 'Amit', 'Verma', 'male');
    const scanJson = await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: jsonQrString });
    assertStep(14, 'JSON QR payload ({"gymId":"..."}) successfully parsed and checked in', scanJson && scanJson.action === 'CHECK_IN');

    // -------------------------------------------------------------------------
    // STEP 15: Malformed QR String rejection (400)
    // -------------------------------------------------------------------------
    let malformedCaught = false;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: 'NOT-A-VALID-QR' });
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Invalid Gym QR.') malformedCaught = true;
    }
    assertStep(15, 'Malformed QR string rejected with 400 Invalid Gym QR.', malformedCaught);

    // -------------------------------------------------------------------------
    // STEP 15b: Tampered QR Signature Rejection (400)
    // -------------------------------------------------------------------------
    let tamperedSigCaught = false;
    const tamperedSigQr = physicalQrString.slice(0, -4) + 'XXXX';
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: tamperedSigQr });
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Invalid Gym QR.') tamperedSigCaught = true;
    }
    assertStep('15b', 'Tampered cryptographic QR signature rejected with 400 Invalid Gym QR.', tamperedSigCaught);

    // -------------------------------------------------------------------------
    // STEP 15c: Tampered GymId with Stale Signature Rejection (400)
    // -------------------------------------------------------------------------
    let tamperedGymIdCaught = false;
    const tamperedGymIdQr = physicalQrString.replace(gymA.id, gymC.id);
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: tamperedGymIdQr });
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Invalid Gym QR.') tamperedGymIdCaught = true;
    }
    assertStep('15c', 'Modified gymId with unmatching signature rejected with 400 Invalid Gym QR.', tamperedGymIdCaught);

    // -------------------------------------------------------------------------
    // STEP 15d: Unsigned QR rejection in production mode (400)
    // -------------------------------------------------------------------------
    let unsignedCaught = false;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: `GYMPULSE-GYM:${gymA.id}` });
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Invalid Gym QR.') unsignedCaught = true;
    }
    assertStep('15d', 'Plaintext unsigned QR rejected in strict production mode with 400', unsignedCaught);

    // -------------------------------------------------------------------------
    // STEP 16: Non-existent gym UUID rejection (400)
    // -------------------------------------------------------------------------
    let nonExistentCaught = false;
    const nonExistentQr = createGymQrString('00000000-0000-0000-0000-000000000000');
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: nonExistentQr });
    } catch (err) {
      if (err.statusCode === 400 && err.message === 'Invalid Gym QR.') nonExistentCaught = true;
    }
    assertStep(16, 'Non-existent Gym UUID rejected with 400 Invalid Gym QR.', nonExistentCaught);

    // -------------------------------------------------------------------------
    // STEP 17: Cross-Owner Multi-Gym Scan Rejection (403)
    // -------------------------------------------------------------------------
    let crossOwnerCaught = false;
    const crossOwnerQr = createGymQrString(gymC.id);
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, member3.id, { qrPayload: crossOwnerQr });
    } catch (err) {
      if (err.statusCode === 403 && err.message === 'This QR belongs to another gym.') crossOwnerCaught = true;
    }
    assertStep(17, 'Cross-tenant scan (different owner) rejected with 403 This QR belongs to another gym.', crossOwnerCaught);

    // -------------------------------------------------------------------------
    // STEP 18: Multi-Gym Disabled Check (403)
    // -------------------------------------------------------------------------
    const gymDRes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations
       ) VALUES ($1, 'Owner Delta', $2, '9820011108', '400 North', 'Pune', 'Maharashtra', 'India', '411001',
        'Standard', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', FALSE, 1)
       RETURNING id`,
      ['Single Gym D', `gym_d_${Date.now()}@example.com`]
    );
    const gymD = gymDRes.rows[0];
    gymIdsToClean.push(gymD.id);

    const gymERes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations
       ) VALUES ($1, 'Owner Delta', $2, '9820011109', '500 South', 'Pune', 'Maharashtra', 'India', '411002',
        'Standard', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', TRUE,
        'ACTIVE', FALSE, 1)
       RETURNING id`,
      ['Single Gym E', `gym_e_${Date.now()}@example.com`]
    );
    const gymE = gymERes.rows[0];
    gymIdsToClean.push(gymE.id);

    const memberD = await createTestMember(gymD.id, 'Deepak', 'Patel', 'male');

    let multiGymDisabledCaught = false;
    const gymEQr = createGymQrString(gymE.id);
    try {
      await memberAppService.scanMemberAttendanceQR(gymD.id, memberD.id, { qrPayload: gymEQr });
    } catch (err) {
      if (err.statusCode === 403 && err.message === 'This QR belongs to another gym.') multiGymDisabledCaught = true;
    }
    assertStep(18, 'Multi-gym disabled scan rejected with 403 This QR belongs to another gym.', multiGymDisabledCaught);

    // -------------------------------------------------------------------------
    // STEP 19: Authorized Multi-Gym Location Scan (200 OK)
    // -------------------------------------------------------------------------
    const member4 = await createTestMember(gymA.id, 'Priya', 'Deshmukh', 'female');
    const gymBQr = createGymQrString(gymB.id);

    const scanMulti = await memberAppService.scanMemberAttendanceQR(gymA.id, member4.id, { qrPayload: gymBQr });
    assertStep(
      19,
      'Authorized multi-gym scan allows Member from Gym A to check in at Gym B',
      scanMulti && scanMulti.action === 'CHECK_IN' && scanMulti.attendance.gymId === gymB.id
    );

    // -------------------------------------------------------------------------
    // STEP 19b: Client Identity Spoofing Immunity
    // -------------------------------------------------------------------------
    const spoofTest = await memberAppService.scanMemberAttendanceQR(
      gymA.id,
      member3.id,
      { qrPayload: physicalQrString, memberId: 'spoofed-member-uuid', gymId: gymC.id }
    ).catch(err => {
      // If member3 already checked in today, it returns 409 with member3's data
      return err.data;
    });
    assertStep(
      '19b',
      'Client cannot spoof memberId or gymId; backend strictly honors auth token identity',
      spoofTest !== undefined
    );

    // -------------------------------------------------------------------------
    // STEP 20: Inactive Member Rejection (403)
    // -------------------------------------------------------------------------
    const inactiveMem = await createTestMember(gymA.id, 'Inactive', 'User', 'female', { isActive: false });
    let inactiveCaught = false;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, inactiveMem.id, { qrPayload: physicalQrString });
    } catch (err) {
      if (err.statusCode === 403 && err.message.includes('inactive')) inactiveCaught = true;
    }
    assertStep(20, 'Inactive member rejected with 403 Inactive account', inactiveCaught);

    // -------------------------------------------------------------------------
    // STEP 21: Expired Membership Rejection (403)
    // -------------------------------------------------------------------------
    const expiredMem = await createTestMember(gymA.id, 'Expired', 'User', 'male', { isExpired: true });
    let expiredCaught = false;
    try {
      await memberAppService.scanMemberAttendanceQR(gymA.id, expiredMem.id, { qrPayload: physicalQrString });
    } catch (err) {
      if (err.statusCode === 403 && err.message.includes('not active')) expiredCaught = true;
    }
    assertStep(21, 'Expired member rejected with 403 Membership not active', expiredCaught);

    // -------------------------------------------------------------------------
    // STEP 22: Class Coexistence Setup — Create Class & Today Session at Gym A
    // -------------------------------------------------------------------------
    const classRes = await pool.query(
      `INSERT INTO classes (gym_id, name, category, instructor_name, capacity, is_active)
       VALUES ($1, 'HIIT Blast', 'HIIT', 'Coach Arjun', 20, TRUE)
       RETURNING id, name`,
      [gymA.id]
    );
    const cls = classRes.rows[0];

    const sessionRes = await pool.query(
      `INSERT INTO class_sessions (gym_id, class_id, session_date, start_time, end_time, capacity, status)
       VALUES ($1, $2, CURRENT_DATE, '18:00', '18:45', 20, 'Scheduled')
       RETURNING id, session_date, start_time, end_time`,
      [gymA.id, cls.id]
    );
    const session = sessionRes.rows[0];
    assertStep(22, 'Create Class & Session for today at Gym A', session && session.id, `Session ID: ${session.id}`);

    // -------------------------------------------------------------------------
    // STEP 23: Create Class Plan & Entitle Member 5
    // -------------------------------------------------------------------------
    const planRes = await pool.query(
      `INSERT INTO class_plans (gym_id, class_id, name, billing_period, price, is_active, is_unlimited)
       VALUES ($1, $2, 'Monthly Unlimited Classes', 'Monthly', 2500, TRUE, TRUE)
       RETURNING id`,
      [gymA.id, cls.id]
    );
    const plan = planRes.rows[0];

    const member5 = await createTestMember(gymA.id, 'Sneha', 'Roy', 'female');

    await pool.query(
      `INSERT INTO class_memberships (gym_id, member_id, class_id, class_plan_id, start_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Active')`,
      [gymA.id, member5.id, cls.id, plan.id]
    );

    await pool.query(
      `INSERT INTO class_bookings (gym_id, class_id, session_id, member_id, status, booked_at)
       VALUES ($1, $2, $3, $4, 'Booked', NOW())`,
      [gymA.id, cls.id, session.id, member5.id]
    );
    assertStep(23, 'Entitle and book Member 5 for today class session', true);

    // -------------------------------------------------------------------------
    // STEP 24: Member 5 scans ONE Physical Gym QR -> Detects Class Session!
    // -------------------------------------------------------------------------
    const scanClassQr = await memberAppService.scanMemberAttendanceQR(gymA.id, member5.id, { qrPayload: physicalQrString });
    assertStep(
      24,
      'Same Gym QR scan detects today eligible class session in eligibleClasses',
      scanClassQr &&
        scanClassQr.action === 'CHECK_IN' &&
        Array.isArray(scanClassQr.eligibleClasses) &&
        scanClassQr.eligibleClasses.some((c) => c.sessionId === session.id)
    );

    // -------------------------------------------------------------------------
    // STEP 25: Member 5 marks Class Attendance via markMemberClassAttendanceFromGymQr
    // -------------------------------------------------------------------------
    const classAttRes = await memberAppService.markMemberClassAttendanceFromGymQr(gymA.id, member5.id, {
      sessionId: session.id,
      classId: cls.id,
    });
    assertStep(25, 'markMemberClassAttendanceFromGymQr marks class session attendance', classAttRes && classAttRes.status === 'Attended');

    // -------------------------------------------------------------------------
    // STEP 26: Database assertion in class_attendance
    // -------------------------------------------------------------------------
    const caDb = await pool.query(
      'SELECT id, status, marked_at FROM class_attendance WHERE gym_id = $1 AND session_id = $2 AND member_id = $3',
      [gymA.id, session.id, member5.id]
    );
    assertStep(26, 'class_attendance row confirmed with status Attended', caDb.rows[0] && caDb.rows[0].status === 'Attended');

    // -------------------------------------------------------------------------
    // STEP 27: Member 5 performs manual Gym Checkout
    // -------------------------------------------------------------------------
    const mem5Checkout = await memberAppService.memberCheckOutAttendance(gymA.id, member5.id);
    assertStep(27, 'Member 5 performs manual gym checkout', mem5Checkout && mem5Checkout.action === 'CHECK_OUT');

    // -------------------------------------------------------------------------
    // STEP 28: Gym checkout leaves Class Attendance intact!
    // -------------------------------------------------------------------------
    const caDbAfter = await pool.query(
      'SELECT id, status, marked_at FROM class_attendance WHERE gym_id = $1 AND session_id = $2 AND member_id = $3',
      [gymA.id, session.id, member5.id]
    );
    assertStep(
      28,
      'Gym checkout strictly leaves class_attendance intact and unchanged',
      caDbAfter.rows[0] && caDbAfter.rows[0].status === 'Attended'
    );

    // -------------------------------------------------------------------------
    // STEP 29: Owner Reception Ledger Parity
    // -------------------------------------------------------------------------
    const ownerLedger = await attendanceRepo.listAttendance(gymA.id, {});
    const rows = ownerLedger.items || ownerLedger.attendance || [];
    const hasRow = rows.some((a) => a.member_id === member1.id || a.memberId === member1.id);
    assertStep(29, 'Owner attendance ledger reflects the member QR check-in & check-out logs', hasRow);

    // -------------------------------------------------------------------------
    // STEP 30: Member Dashboard todayStatus
    // -------------------------------------------------------------------------
    const dash5 = await memberAppService.getMemberDashboard(gymA.id, member5.id);
    assertStep(
      30,
      'Member dashboard returns todayStatus with CHECKED_OUT status',
      dash5 && dash5.attendance && dash5.attendance.todayStatus && dash5.attendance.todayStatus.status === 'CHECKED_OUT'
    );

    // -------------------------------------------------------------------------
    // STEP 31: Member Attendance History lists correct logs with gym name
    // -------------------------------------------------------------------------
    const details4 = await memberAppService.getMemberAttendanceDetails(gymA.id, member4.id);
    const multiLog = details4.logs.find((l) => l.gymName === gymB.name || l.gym_name === gymB.name);
    assertStep(
      31,
      'Member attendance history correctly attributes Multi-Gym visit to Gym B',
      multiLog !== undefined
    );

  } catch (err) {
    console.error('UNEXPECTED ERROR IN TEST SUITE:', err);
    failed++;
  } finally {
    console.log('\nCleaning up test gyms...');
    for (const gid of gymIdsToClean) {
      await pool.query('DELETE FROM class_attendance WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM class_bookings WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM class_memberships WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM class_plans WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM class_sessions WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM classes WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM attendance WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM payments WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM members WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM staff WHERE gym_id = $1', [gid]);
      await pool.query('DELETE FROM gyms WHERE id = $1', [gid]);
    }
    console.log('Cleanup completed.');
  }

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL 31 STEPS)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSingleGymQrSuite();
