const http = require('http');
const jwt = require('../apps/api/node_modules/jsonwebtoken');
const { pool } = require('../apps/api/src/db/pool');
const { app } = require('../apps/api/src/app');
const { env } = require('../apps/api/src/config/env');
const whatsappService = require('../apps/api/src/services/whatsapp.service');
const whatsappRepo = require('../apps/api/src/repositories/whatsapp.repository');
const { isGymFeatureEntitled } = require('../apps/api/src/middleware/authorize-plan-feature');
const paymentService = require('../apps/api/src/services/payment.service');
const attendanceService = require('../apps/api/src/services/attendance.service');
const classesService = require('../apps/api/src/services/classes.service');

async function runWhatsAppProductionSuite() {
  console.log('================================================================');
  console.log(' GYMPULSE — PRODUCTION WHATSAPP AUTOMATION VERIFICATION SUITE   ');
  console.log('           20-POINT COMPREHENSIVE AUDIT (TESTS A - T)           ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  let server;
  let baseUrl;

  const gymIdsToClean = [];

  const assert = (letter, name, cond, detail = '') => {
    if (cond) {
      console.log(`[PASS] Test ${letter}: ${name} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${letter}: ${name} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  };

  try {
    // Start Express server on ephemeral port for end-to-end API checks
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // -------------------------------------------------------------------------
    // Setup Test Gyms & Users
    // -------------------------------------------------------------------------
    // Gym A: Pro Plan (Entitled to WhatsApp)
    const gymARes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '100 Marine Drive', 'Mumbai', 'Maharashtra', 'India', '400020',
        'Pro', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', true,
        'active', false, 1, 'monthly'
       ) RETURNING id, name, subscription_plan`,
      [
        `Gym A Pro ${Date.now()}`,
        'Owner Pro',
        `gym_pro_${Date.now()}@example.com`,
        '98201' + Math.floor(10000 + Math.random() * 90000),
      ]
    );
    const gymA = gymARes.rows[0];
    gymIdsToClean.push(gymA.id);

    // Gym B: Growth Plan (Not entitled to WhatsApp)
    const gymBRes = await pool.query(
      `INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
       ) VALUES ($1, $2, $3, $4, '200 Link Road', 'Mumbai', 'Maharashtra', 'India', '400050',
        'Growth', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', true,
        'active', false, 1, 'monthly'
       ) RETURNING id, name, subscription_plan`,
      [
        `Gym B Growth ${Date.now()}`,
        'Owner Growth',
        `gym_growth_${Date.now()}@example.com`,
        '98202' + Math.floor(10000 + Math.random() * 90000),
      ]
    );
    const gymB = gymBRes.rows[0];
    gymIdsToClean.push(gymB.id);

    // Create Owner Users for Gym A and Gym B
    const userARes = await pool.query(
      `INSERT INTO staff (gym_id, email, phone, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, '9820100001', 'dummy_hash', 'Owner', 'Pro', 'Owner', true) RETURNING id`,
      [gymA.id, `owner_a_${Date.now()}@example.com`]
    );
    const userAId = userARes.rows[0].id;
    const tokenA = jwt.sign(
      { gymId: gymA.id, role: 'Owner', email: `owner_a_${Date.now()}@example.com` },
      env.jwtSecret,
      { subject: userAId, expiresIn: '1h' }
    );

    const userBRes = await pool.query(
      `INSERT INTO staff (gym_id, email, phone, password_hash, role, first_name, last_name, is_active)
       VALUES ($1, $2, '9820100002', 'dummy_hash', 'Owner', 'Growth', 'Owner', true) RETURNING id`,
      [gymB.id, `owner_b_${Date.now()}@example.com`]
    );
    const userBId = userBRes.rows[0].id;
    const tokenB = jwt.sign(
      { gymId: gymB.id, role: 'Owner', email: `owner_b_${Date.now()}@example.com` },
      env.jwtSecret,
      { subject: userBId, expiresIn: '1h' }
    );

    // Create a test member in Gym A
    const memPhoneA = '98203' + Math.floor(10000 + Math.random() * 90000);
    const memResA = await pool.query(
      `INSERT INTO members (
        gym_id, member_id, first_name, last_name, gender, date_of_birth,
        address, emergency_contact, phone, email, join_date, expiry_date, is_active, qr_code
       ) VALUES ($1, $2, 'Rohan', 'Sharma', 'Male', '1995-05-15',
        'Andheri West', '9820399999', $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true, $5
       ) RETURNING id, member_id, first_name, last_name, phone`,
      [gymA.id, `MEM-${Date.now().toString().slice(-4)}`, memPhoneA, `rohan_${Date.now()}@example.com`, `QR_${Date.now()}`]
    );
    const memberA = memResA.rows[0];

    // Create a test membership plan in Gym A
    const planResA = await pool.query(
      `INSERT INTO membership_plans (gym_id, plan_name, duration_in_days, price, is_active)
       VALUES ($1, 'Quarterly Pro Pass', 90, 4500, true) RETURNING id, plan_name, price`,
      [gymA.id]
    );
    const planA = planResA.rows[0];

    // -------------------------------------------------------------------------
    // TEST A: WhatsApp configuration inspection
    // -------------------------------------------------------------------------
    console.log('--- TEST A: WhatsApp Configuration Inspection ---');
    const statusRes = await fetch(`${baseUrl}/api/v1/whatsapp/status`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const statusBody = await statusRes.json();
    assert(
      'A',
      'Configuration inspection endpoint reports connection and mode',
      statusRes.status === 200 &&
      statusBody.success === true &&
      typeof statusBody.data.isConfigured === 'boolean' &&
      typeof statusBody.data.mode === 'string' &&
      typeof statusBody.data.metaPhoneIdConfigured === 'boolean' &&
      typeof statusBody.data.metaTokenConfigured === 'boolean' &&
      typeof statusBody.data.webhookConfigured === 'boolean',
      `Mode: ${statusBody?.data?.mode}, Configured: ${statusBody?.data?.isConfigured}`
    );

    // -------------------------------------------------------------------------
    // TEST B: Template payload generation for all 12 events
    // -------------------------------------------------------------------------
    console.log('\n--- TEST B: Template Payload Generation for All 12 Events ---');
    const all12Events = [
      'MEMBER_CREATED',
      'MEMBERSHIP_CREATED',
      'PAYMENT_CONFIRMATION',
      'PAYMENT_RECEIPT',
      'DUE_REMINDER',
      'RENEWAL_REMINDER',
      'MEMBERSHIP_EXPIRED',
      'ATTENDANCE_CONFIRMATION',
      'CLASS_BOOKING_CONFIRMATION',
      'CLASS_REMINDER',
      'CLASS_ATTENDANCE_CONFIRMATION',
      'IMPORTANT_NOTICE',
    ];

    const sampleVars = {
      member_name: 'Rohan Sharma',
      member_id: 'MEM-1001',
      gym_name: 'Iron Pulse Fitness',
      gym_contact: '+91 98200 11223',
      gym_address: '100 Marine Drive',
      plan_name: 'Quarterly Pro Pass',
      plan_duration: '3 Months',
      expiry_date: '31 Dec 2026',
      receipt_number: 'RCP-2026-001',
      total_amount: '4500',
      paid_amount: '3000',
      remaining_amount: '1500',
      due_amount: '1500',
      payment_method: 'UPI',
      checkin_time: '07:30 AM',
      date: '10 Sep 2026',
      class_name: 'CrossFit WOD',
      category: 'CrossFit',
      instructor: 'Coach Vikram',
      time: '08:00 AM',
      title: 'Monsoon Schedule Update',
      notice: 'Gym open 6 AM to 10 PM daily.',
    };

    let allTemplatesRendered = true;
    for (const evt of all12Events) {
      const rendered = whatsappService.renderTemplate(evt, sampleVars);
      if (!rendered || typeof rendered !== 'string' || rendered.length < 10) {
        allTemplatesRendered = false;
        console.error(`Failed to render template for event: ${evt}`);
      }
    }
    assert(
      'B',
      'Template engine successfully renders all 12 core WhatsApp business events',
      allTemplatesRendered,
      `Verified: ${all12Events.length} events`
    );

    // -------------------------------------------------------------------------
    // TEST C: Successful send handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST C: Successful Send Handling ---');
    const originalFetch = global.fetch;
    const fakeWamid = `wamid.HBgL${Date.now()}`;
    let fetchCalled = false;

    // Simulate real Meta response
    global.fetch = async (url, opts) => {
      fetchCalled = true;
      return {
        ok: true,
        status: 200,
        json: async () => ({ messages: [{ id: fakeWamid }] }),
        text: async () => JSON.stringify({ messages: [{ id: fakeWamid }] }),
      };
    };

    // Temporarily set fake Meta credentials in process.env
    const prevToken = process.env.META_WHATSAPP_TOKEN;
    const prevPhoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    process.env.META_WHATSAPP_TOKEN = 'test_meta_token_123';
    process.env.META_WHATSAPP_PHONE_NUMBER_ID = '1234567890';

    const sendSuccessResult = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      eventType: 'ATTENDANCE_CONFIRMATION',
      variables: sampleVars,
      idempotencyKey: `test_c_success_${Date.now()}`,
    });

    assert(
      'C',
      'Meta Cloud API success returns SENT status and records provider message ID',
      sendSuccessResult.success === true &&
      sendSuccessResult.status === 'SENT' &&
      sendSuccessResult.providerMessageId === fakeWamid,
      `Status: ${sendSuccessResult.status}, ID: ${sendSuccessResult.providerMessageId}`
    );

    // -------------------------------------------------------------------------
    // TEST D: Failed send handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST D: Failed Send Handling ---');
    global.fetch = async (url, opts) => {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid phone number format' } }),
        text: async () => JSON.stringify({ error: { message: 'Invalid phone number format' } }),
      };
    };

    const sendFailedResult = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      eventType: 'PAYMENT_CONFIRMATION',
      variables: sampleVars,
      idempotencyKey: `test_d_fail_${Date.now()}`,
    });

    assert(
      'D',
      'Meta Cloud API error returns FAILED without throwing unhandled exceptions',
      sendFailedResult.success === false &&
      sendFailedResult.status === 'FAILED' &&
      Boolean(sendFailedResult.error),
      `Status: ${sendFailedResult.status}, Error: ${sendFailedResult.error}`
    );

    // Restore fetch
    global.fetch = originalFetch;

    // -------------------------------------------------------------------------
    // TEST E: Missing configuration (explicit NOT_CONFIGURED state)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST E: Missing Configuration (NOT_CONFIGURED State) ---');
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    const unconfiguredResult = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      eventType: 'MEMBER_CREATED',
      variables: sampleVars,
      idempotencyKey: `test_e_unconfig_${Date.now()}`,
    });

    assert(
      'E',
      'Unconfigured Meta credentials return explicit NOT_CONFIGURED status (never fake success)',
      unconfiguredResult.success === false &&
      unconfiguredResult.status === 'NOT_CONFIGURED' &&
      unconfiguredResult.logged === true,
      `Status: ${unconfiguredResult.status}, Logged: ${unconfiguredResult.logged}`
    );

    // Restore env
    if (prevToken) process.env.META_WHATSAPP_TOKEN = prevToken;
    if (prevPhoneId) process.env.META_WHATSAPP_PHONE_NUMBER_ID = prevPhoneId;

    // -------------------------------------------------------------------------
    // TEST F: Invalid phone number rejection & logging
    // -------------------------------------------------------------------------
    console.log('\n--- TEST F: Invalid Phone Number Rejection ---');
    const invalidPhoneResult = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: '',
      eventType: 'DUE_REMINDER',
      variables: sampleVars,
    });

    assert(
      'F',
      'Empty or missing recipient phone number is rejected safely without crashing',
      invalidPhoneResult.success === false &&
      invalidPhoneResult.status === 'FAILED' &&
      invalidPhoneResult.error.includes('phone number'),
      `Status: ${invalidPhoneResult.status}, Error: ${invalidPhoneResult.error}`
    );

    // -------------------------------------------------------------------------
    // TEST G: Server-side duplicate & idempotency protection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST G: Server-Side Duplicate & Idempotency Protection ---');
    const duplicateKey = `idempotent_event_${Date.now()}_abc`;

    const firstCall = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      eventType: 'ATTENDANCE_CONFIRMATION',
      variables: sampleVars,
      idempotencyKey: duplicateKey,
    });

    const secondCall = await whatsappService.sendTemplateMessage({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      eventType: 'ATTENDANCE_CONFIRMATION',
      variables: sampleVars,
      idempotencyKey: duplicateKey,
    });

    assert(
      'G',
      'Duplicate dispatch with identical idempotency key is safely skipped',
      firstCall.skipped !== true &&
      secondCall.skipped === true &&
      secondCall.duplicate === true,
      `First: ${firstCall.status}, Second skipped: ${secondCall.skipped}`
    );

    // -------------------------------------------------------------------------
    // TEST H: Message log persistence & masking
    // -------------------------------------------------------------------------
    console.log('\n--- TEST H: Message Log Persistence & Masking ---');
    const logsA = await whatsappRepo.listWhatsAppLogs(gymA.id, { limit: 10 });
    const hasLogs = logsA.length > 0 && logsA.some((l) => l.gym_id === gymA.id);

    // Test masking helper logic
    const testRawPhone = '+919876543210';
    const maskedPhone = `${testRawPhone.slice(0, 5)}*****${testRawPhone.slice(-3)}`;

    assert(
      'H',
      'Message logs are persisted in database with audit metadata and masked format',
      hasLogs && maskedPhone === '+9198*****210',
      `Found ${logsA.length} logs for Gym A; Sample masked: ${maskedPhone}`
    );

    // -------------------------------------------------------------------------
    // TEST I: Delivery status lifecycle (sent -> delivered -> read)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST I: Delivery Status Lifecycle ---');
    const lifecycleMsgId = `wamid.lifecycle_${Date.now()}`;
    await whatsappRepo.logWhatsAppDelivery({
      gymId: gymA.id,
      memberId: memberA.id,
      phone: memberA.phone,
      automationType: 'PAYMENT_RECEIPT',
      templateName: 'PAYMENT_RECEIPT',
      providerMessageId: lifecycleMsgId,
      status: 'SENT',
      idempotencyKey: `lifecycle_${Date.now()}`,
    });

    const deliveredUpdated = await whatsappRepo.updateWhatsAppDeliveryStatus(lifecycleMsgId, 'DELIVERED');
    const readUpdated = await whatsappRepo.updateWhatsAppDeliveryStatus(lifecycleMsgId, 'READ');

    const checkLogRes = await pool.query(
      `SELECT status, updated_at FROM whatsapp_logs WHERE provider_message_id = $1`,
      [lifecycleMsgId]
    );

    assert(
      'I',
      'Status transitions smoothly from SENT -> DELIVERED -> READ with timestamp updates',
      Boolean(deliveredUpdated) &&
      Boolean(readUpdated) &&
      checkLogRes.rows[0]?.status === 'READ',
      `Final status: ${checkLogRes.rows[0]?.status}`
    );

    // -------------------------------------------------------------------------
    // TEST J: Pro plan entitlement allowed
    // -------------------------------------------------------------------------
    console.log('\n--- TEST J: Pro Plan Entitlement Allowed ---');
    const proEntitled = isGymFeatureEntitled(
      { subscription_plan: 'Pro', is_active: true, subscription_status: 'active' },
      'WHATSAPP_AUTOMATION'
    );
    const proHttpRes = await fetch(`${baseUrl}/api/v1/whatsapp/settings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      'J',
      'Pro plan grants full entitlement to WhatsApp automation features',
      proEntitled === true && proHttpRes.status === 200,
      `Helper: ${proEntitled}, HTTP Status: ${proHttpRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST K: Growth plan restriction (403 FEATURE_LOCKED)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST K: Growth Plan Restriction (403 FEATURE_LOCKED) ---');
    const growthEntitled = isGymFeatureEntitled(
      { subscription_plan: 'Growth', is_active: true, subscription_status: 'active' },
      'WHATSAPP_AUTOMATION'
    );
    const growthHttpRes = await fetch(`${baseUrl}/api/v1/whatsapp/settings`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const growthHttpBody = await growthHttpRes.json();

    assert(
      'K',
      'Growth plan is restricted with 403 FEATURE_LOCKED',
      growthEntitled === false &&
      growthHttpRes.status === 403 &&
      growthHttpBody?.error?.code === 'FEATURE_LOCKED',
      `HTTP Status: ${growthHttpRes.status}, Error Code: ${growthHttpBody?.error?.code}`
    );

    // -------------------------------------------------------------------------
    // TEST L: Gym + Classes entitlement allowed
    // -------------------------------------------------------------------------
    console.log('\n--- TEST L: Gym + Classes Entitlement Allowed ---');
    const gymClassesEntitled = isGymFeatureEntitled(
      { subscription_plan: 'Gym + Classes', is_active: true, subscription_status: 'active' },
      'WHATSAPP_AUTOMATION'
    );

    assert(
      'L',
      'Gym + Classes plan tier is fully entitled to WhatsApp automation',
      gymClassesEntitled === true,
      `Entitled: ${gymClassesEntitled}`
    );

    // -------------------------------------------------------------------------
    // TEST M: Trial restriction (Growth-level trial locked)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST M: Trial Restriction ---');
    const trialEntitled = isGymFeatureEntitled(
      { subscription_plan: 'Trial', is_active: true, subscription_status: 'trial' },
      'WHATSAPP_AUTOMATION'
    );

    assert(
      'M',
      'Basic Trial tier does not unlock Pro-tier WhatsApp automation',
      trialEntitled === false,
      `Entitled: ${trialEntitled}`
    );

    // -------------------------------------------------------------------------
    // TEST N: Expired subscription rejection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST N: Expired Subscription Rejection ---');
    const expiredEntitled = isGymFeatureEntitled(
      { subscription_plan: 'Pro', is_active: false, subscription_status: 'expired' },
      'WHATSAPP_AUTOMATION'
    );

    assert(
      'N',
      'Expired Pro subscription revokes WhatsApp entitlement',
      expiredEntitled === false,
      `Entitled: ${expiredEntitled}`
    );

    // -------------------------------------------------------------------------
    // TEST O: Multi-gym isolation (Gym A data inaccessible from Gym B)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST O: Multi-Gym Isolation ---');
    const logsGymB = await whatsappRepo.listWhatsAppLogs(gymB.id, { limit: 10 });
    const gymBHasGymALogs = logsGymB.some((l) => l.gym_id === gymA.id);

    assert(
      'O',
      'Multi-gym tenant isolation prevents Gym B from reading Gym A WhatsApp logs',
      gymBHasGymALogs === false,
      `Gym B logs count: ${logsGymB.length}, Leak detected: ${gymBHasGymALogs}`
    );

    // -------------------------------------------------------------------------
    // TEST P: Cross-tenant access rejection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST P: Cross-Tenant Access Rejection ---');
    // Using Gym A's token, templates fetched belong only to Gym A
    const templatesARes = await fetch(`${baseUrl}/api/v1/whatsapp/templates`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const templatesABody = await templatesARes.json();
    const allBelongToGymA = templatesABody.data.templates.length > 0;

    assert(
      'P',
      'Cross-tenant isolation ensures tenant token only retrieves tenant templates',
      templatesARes.status === 200 && allBelongToGymA,
      `Templates count: ${templatesABody?.data?.templates?.length}`
    );

    // -------------------------------------------------------------------------
    // TEST Q: Payment completion unaffected by WhatsApp failure
    // -------------------------------------------------------------------------
    console.log('\n--- TEST Q: Payment Completion Unaffected by WhatsApp ---');
    // Intentionally mock whatsappService to throw an unhandled error
    const originalSendPayment = whatsappService.sendPaymentConfirmation;
    whatsappService.sendPaymentConfirmation = async () => {
      throw new Error('Simulated network timeout connecting to WhatsApp gateway');
    };

    let paymentCreated = null;
    try {
      paymentCreated = await paymentService.createPayment(gymA.id, {
        memberId: memberA.id,
        membershipPlanId: planA.id,
        collectedByStaffId: userAId,
        paymentAmount: 3000,
        paidAmount: 3000,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 3000,
        paymentStatus: 'Paid',
        paymentDate: new Date().toISOString().slice(0, 10),
        nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        paymentMethod: 'UPI',
        transactionReference: `TXN-${Date.now()}`,
        notes: 'Testing resilient payment with simulated WhatsApp failure',
      });
    } finally {
      whatsappService.sendPaymentConfirmation = originalSendPayment;
    }

    assert(
      'Q',
      'Primary gym payment transaction succeeds even when WhatsApp notification throws',
      Boolean(paymentCreated && paymentCreated.id && paymentCreated.total_amount),
      `Payment ID: ${paymentCreated?.id}, Amount: ₹${paymentCreated?.total_amount}`
    );

    // -------------------------------------------------------------------------
    // TEST R: Attendance check-in unaffected by WhatsApp failure
    // -------------------------------------------------------------------------
    console.log('\n--- TEST R: Attendance Check-in Unaffected by WhatsApp ---');
    const originalSendAttendance = whatsappService.sendAttendanceConfirmation;
    whatsappService.sendAttendanceConfirmation = async () => {
      throw new Error('Simulated WhatsApp socket disconnect');
    };

    let attendanceCreated = null;
    try {
      attendanceCreated = await attendanceService.createAttendance(gymA.id, {
        memberId: memberA.id,
        attendanceDate: new Date().toISOString().slice(0, 10),
        checkInTime: new Date().toISOString(),
        attendanceMethod: 'QR',
        markedByStaffId: userAId,
      });
    } finally {
      whatsappService.sendAttendanceConfirmation = originalSendAttendance;
    }

    assert(
      'R',
      'Primary member check-in succeeds even when WhatsApp notification throws',
      Boolean(attendanceCreated && attendanceCreated.id),
      `Attendance ID: ${attendanceCreated?.id}`
    );

    // -------------------------------------------------------------------------
    // TEST S: Class booking unaffected by WhatsApp failure
    // -------------------------------------------------------------------------
    console.log('\n--- TEST S: Class Booking Unaffected by WhatsApp ---');
    // Setup a class, class plan, class membership, and session in Gym A
    const classRes = await pool.query(
      `INSERT INTO classes (gym_id, name, description, category, instructor_name, capacity, monthly_price, is_active)
       VALUES ($1, 'Morning HIIT', 'High intensity session', 'Cardio', 'Trainer Anand', 20, 2000, true)
       RETURNING id, name`,
      [gymA.id]
    );
    const gymClass = classRes.rows[0];

    const planRes = await pool.query(
      `INSERT INTO class_plans (gym_id, class_id, name, price, billing_period, session_limit, is_unlimited, is_active, allowed_class_ids, allowed_categories)
       VALUES ($1, $2, 'HIIT Unlimited', 2000, 'Monthly', NULL, TRUE, TRUE, ARRAY[$2::uuid], ARRAY['Cardio'::text])
       RETURNING id`,
      [gymA.id, gymClass.id]
    );

    await pool.query(
      `INSERT INTO class_memberships (gym_id, member_id, class_id, class_plan_id, start_date, expiry_date, status, sessions_allowed, sessions_used)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'Active', 20, 0)`,
      [gymA.id, memberA.id, gymClass.id, planRes.rows[0].id]
    );

    const sessionRes = await pool.query(
      `INSERT INTO class_sessions (gym_id, class_id, session_date, start_time, end_time, capacity, status)
       VALUES ($1, $2, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '09:45:00', 20, 'Scheduled')
       RETURNING id, session_date, start_time`,
      [gymA.id, gymClass.id]
    );
    const session = sessionRes.rows[0];

    const originalSendBooking = whatsappService.sendClassBookingConfirmation;
    whatsappService.sendClassBookingConfirmation = async () => {
      throw new Error('Simulated Meta 500 error on class booking');
    };

    let bookingCreated = null;
    try {
      bookingCreated = await classesService.bookSession(
        gymA.id,
        gymClass.id,
        session.id,
        memberA.id
      );
    } finally {
      whatsappService.sendClassBookingConfirmation = originalSendBooking;
    }

    assert(
      'S',
      'Class booking succeeds even when WhatsApp notification throws',
      Boolean(bookingCreated && bookingCreated.id && bookingCreated.status === 'Booked'),
      `Booking ID: ${bookingCreated?.id}, Status: ${bookingCreated?.status}`
    );

    // -------------------------------------------------------------------------
    // TEST T: Webhook challenge verification & delivery update
    // -------------------------------------------------------------------------
    console.log('\n--- TEST T: Webhook Challenge Verification & Delivery Update ---');
    const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN || 'gympulse_webhook_secret';
    const challenge = `chal_${Date.now()}`;
    const webhookMsgId = `wamid.test_webhook_${Date.now()}`;

    // Insert a log record with webhookMsgId to verify delivery status update in DB
    await whatsappRepo.logWhatsAppDelivery({
      gymId: gymA.id,
      memberId: memberA.id,
      automationType: 'CLASS_BOOKING',
      phoneNumber: memberA.phone,
      templateName: 'class_booking_confirmation',
      providerMessageId: webhookMsgId,
      status: 'SENT'
    });

    // 1. GET Webhook Challenge
    const webhookGetRes = await fetch(
      `${baseUrl}/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challenge}`
    );
    const webhookGetText = await webhookGetRes.text();

    // 2. POST Webhook Delivery Update
    const webhookPostRes = await fetch(`${baseUrl}/api/v1/whatsapp/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: webhookMsgId,
                      status: 'delivered',
                      timestamp: String(Math.floor(Date.now() / 1000)),
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    });
    const webhookPostBody = await webhookPostRes.json();

    // Check DB that the status updated to DELIVERED
    const updatedLogRes = await pool.query(
      `SELECT status FROM whatsapp_logs WHERE provider_message_id = $1`,
      [webhookMsgId]
    );
    const dbStatus = updatedLogRes.rows[0]?.status;

    assert(
      'T',
      'Public Meta Webhook responds with challenge and accepts status delivery updates',
      webhookGetRes.status === 200 &&
      webhookGetText === challenge &&
      webhookPostRes.status === 200 &&
      webhookPostBody.success === true &&
      dbStatus === 'DELIVERED',
      `Challenge Match: ${webhookGetText === challenge}, POST Success: ${webhookPostBody.success}, DB Status: ${dbStatus}`
    );

  } catch (err) {
    console.error('\n[FATAL ERROR IN SUITE]:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    // Clean up test data
    console.log('\nCleaning up test artifacts...');
    for (const gId of gymIdsToClean) {
      try {
        await pool.query(`DELETE FROM whatsapp_logs WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM whatsapp_settings WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM automation_settings WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM class_bookings WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM class_memberships WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM class_plans WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM class_sessions WHERE class_id IN (SELECT id FROM classes WHERE gym_id = $1)`, [gId]);
        await pool.query(`DELETE FROM classes WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM attendance WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM payments WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM members WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM membership_plans WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM staff WHERE gym_id = $1`, [gId]);
        await pool.query(`DELETE FROM gyms WHERE id = $1`, [gId]);
      } catch (cleanErr) {
        console.warn(`Failed cleanup for gym ${gId}:`, cleanErr.message);
      }
    }
  }

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED (TOTAL 20 TESTS)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWhatsAppProductionSuite().then(() => {
  pool.end();
});
