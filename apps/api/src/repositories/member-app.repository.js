const { pool } = require('../db/pool');
const { autoFinalizeExpiredAttendance } = require('./attendance.repository');

const findMemberForAuth = async (identifier) => {
  const query = `
    SELECT id, member_id, gym_id, membership_plan_id, first_name, last_name,
           email, phone, password_hash, is_active
    FROM members
    WHERE (member_id = UPPER($1) OR phone = $1 OR email = LOWER($1))
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [identifier]);
  return result.rows[0] ?? null;
};

const updateMemberPassword = async (memberId, passwordHash) => {
  const query = `
    UPDATE members
    SET password_hash = $1, updated_at = NOW()
    WHERE id = $2 AND deleted_at IS NULL
    RETURNING id
  `;
  const result = await pool.query(query, [passwordHash, memberId]);
  return result.rows[0] ?? null;
};

const getMemberProfile = async (gymId, memberId) => {
  const query = `
    SELECT m.id, m.member_id, m.gym_id, m.membership_plan_id, m.first_name, m.last_name,
           m.gender, m.date_of_birth, m.phone, m.email, m.emergency_contact, m.address,
           m.join_date, m.expiry_date, m.qr_code, m.profile_photo_url, m.medical_notes,
           m.is_active, m.created_at,
           g.name AS gym_name, g.logo_url AS gym_logo_url, g.phone AS gym_phone,
           g.address AS gym_address, g.city AS gym_city, g.subscription_plan AS gym_subscription_plan,
           g.subscription_status AS gym_subscription_status, g.trial_started_at AS gym_trial_started_at,
           g.trial_ends_at AS gym_trial_ends_at, g.subscription_end_date AS gym_subscription_end_date,
           mp.plan_name, mp.price AS plan_price, mp.duration_in_days
    FROM members m
    JOIN gyms g ON m.gym_id = g.id
    LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
    WHERE m.id = $1 AND m.gym_id = $2 AND m.deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [memberId, gymId]);
  return result.rows[0] ?? null;
};

const checkMemberClassEntitlement = async (gymId, memberId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1 FROM class_memberships
      WHERE gym_id = $1 AND member_id = $2 AND status = 'Active' AND expiry_date >= CURRENT_DATE
    ) AS has_class_membership
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return Boolean(result.rows[0]?.has_class_membership);
};

const getTodayAttendanceForMember = async (gymId, memberId) => {
  if (gymId) {
    await autoFinalizeExpiredAttendance(gymId);
  }
  const query = `
    SELECT a.id, a.gym_id, a.check_in_time, a.check_out_time,
           TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date,
           a.attendance_method,
           g.name AS gym_name
    FROM attendance a
    JOIN gyms g ON a.gym_id = g.id
    WHERE a.member_id = $1 AND a.attendance_date = CURRENT_DATE AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [memberId]);
  return result.rows[0] ?? null;
};

const getMemberAttendanceStats = async (gymId, memberId) => {
  const query = `
    SELECT 
      COUNT(*) AS total_checkins,
      COUNT(CASE WHEN attendance_date >= date_trunc('month', CURRENT_DATE) THEN 1 END) AS month_checkins
    FROM attendance
    WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId, memberId]);

  const streakQuery = `
    SELECT DISTINCT attendance_date::date
    FROM attendance
    WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL
    ORDER BY attendance_date::date DESC
    LIMIT 60
  `;
  const streakResult = await pool.query(streakQuery, [gymId, memberId]);
  const dates = streakResult.rows.map((r) => new Date(r.attendance_date).toISOString().slice(0, 10));

  let streakDays = 0;
  if (dates.length > 0) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().slice(0, 10);

    if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
      let cur = dates.includes(todayStr) ? new Date() : yesterdayObj;
      while (true) {
        const curStr = cur.toISOString().slice(0, 10);
        if (dates.includes(curStr)) {
          streakDays++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return {
    total_checkins: Number(result.rows[0]?.total_checkins ?? 0),
    month_checkins: Number(result.rows[0]?.month_checkins ?? 0),
    streak_days: streakDays
  };
};

const getMemberLatestPayment = async (gymId, memberId) => {
  const query = `
    SELECT p.id, p.payment_amount, p.paid_amount, p.remaining_amount, p.total_amount, p.payment_method, p.payment_status,
           p.transaction_reference, p.payment_date, p.next_due_date,
           mp.plan_name
    FROM payments p
    LEFT JOIN membership_plans mp ON p.membership_plan_id = mp.id
    WHERE p.gym_id = $1 AND p.member_id = $2 AND p.deleted_at IS NULL
    ORDER BY p.payment_date DESC, p.created_at DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows[0] ?? null;
};

const getGymCurrentOccupancy = async (gymId) => {
  const query = `
    SELECT COUNT(*) AS current_count
    FROM attendance
    WHERE gym_id = $1 AND check_in_time IS NOT NULL AND check_out_time IS NULL AND attendance_date = CURRENT_DATE AND deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId]);
  
  const currentCount = Number(result.rows[0]?.current_count ?? 0);
  const capacity = 50;
  let level = 'LOW';
  const percentage = Math.min(Math.round((currentCount / capacity) * 100), 100);
  if (percentage > 75) level = 'HIGH';
  else if (percentage > 40) level = 'MEDIUM';

  return {
    currentOccupancy: currentCount,
    maxCapacity: capacity,
    occupancyPercentage: percentage,
    crowdLevel: level
  };
};

const listGymMembershipPlans = async (gymId) => {
  const query = `
    SELECT id, gym_id, plan_name, duration_in_days, price, description, is_active
    FROM membership_plans
    WHERE gym_id = $1 AND is_active = TRUE AND deleted_at IS NULL
    ORDER BY price ASC
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows;
};

const listMemberPayments = async (gymId, memberId) => {
  const query = `
    SELECT p.id, p.gym_id, p.member_id, p.membership_plan_id, p.payment_amount,
           p.paid_amount, p.remaining_amount,
           p.discount_amount, p.tax_amount, p.total_amount, p.payment_method,
           p.payment_status, p.transaction_reference, p.payment_date,
           p.next_due_date, p.notes, p.created_at,
           mp.plan_name
    FROM payments p
    LEFT JOIN membership_plans mp ON p.membership_plan_id = mp.id
    WHERE p.gym_id = $1 AND p.member_id = $2 AND p.deleted_at IS NULL
    ORDER BY p.payment_date DESC, p.created_at DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows;
};

const getMemberPaymentReceipt = async (gymId, memberId, paymentId) => {
  const query = `
    SELECT p.id, p.gym_id, p.member_id, p.membership_plan_id, p.payment_amount,
           p.discount_amount, p.tax_amount, p.total_amount, p.payment_method,
           p.payment_status, p.transaction_reference, p.payment_date,
           p.next_due_date, p.notes, p.created_at,
           mp.plan_name, mp.duration_in_days,
           g.name AS gym_name, g.logo_url AS gym_logo_url, g.address AS gym_address,
           g.city AS gym_city, g.state AS gym_state, g.phone AS gym_phone, g.gst_number,
           m.first_name, m.last_name, m.member_id
    FROM payments p
    JOIN gyms g ON p.gym_id = g.id
    JOIN members m ON p.member_id = m.id
    LEFT JOIN membership_plans mp ON p.membership_plan_id = mp.id
    WHERE p.id = $1 AND p.gym_id = $2 AND p.member_id = $3 AND p.deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [paymentId, gymId, memberId]);
  return result.rows[0] ?? null;
};

const findMembershipPlanById = async (gymId, planId) => {
  const query = `
    SELECT id, plan_name, duration_in_days, price
    FROM membership_plans
    WHERE id = $1 AND gym_id = $2 AND is_active = TRUE AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [planId, gymId]);
  return result.rows[0] ?? null;
};

const createMemberRenewalRecord = async ({ gymId, memberId, membershipPlanId, paymentMethod = 'Cash' }) => {
  const plan = await findMembershipPlanById(gymId, membershipPlanId);
  if (!plan) return null;

  const staffQuery = `SELECT id FROM staff WHERE gym_id = $1 AND role = 'Owner' LIMIT 1`;
  const staffResult = await pool.query(staffQuery, [gymId]);
  const staffId = staffResult.rows[0]?.id;

  if (!staffId) return null;

  const paymentAmount = Number(plan.price);
  const totalAmount = paymentAmount;
  const today = new Date().toISOString().slice(0, 10);
  
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + Number(plan.duration_in_days));
  const nextDueDateStr = nextDueDate.toISOString().slice(0, 10);

  const txnRef = `RNW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const query = `
    INSERT INTO payments (
      gym_id, member_id, membership_plan_id, payment_amount, discount_amount,
      tax_amount, total_amount, payment_method, payment_status,
      transaction_reference, payment_date, next_due_date, collected_by_staff_id, notes
    )
    VALUES ($1, $2, $3, $4, 0, 0, $5, $6, 'Pending', $7, $8, $9, $10, 'Member Online Renewal Request (Pending Reception Confirmation)')
    RETURNING id, payment_amount, total_amount, payment_status, payment_date, transaction_reference
  `;

  const result = await pool.query(query, [
    gymId,
    memberId,
    membershipPlanId,
    paymentAmount,
    totalAmount,
    paymentMethod,
    txnRef,
    today,
    nextDueDateStr,
    staffId
  ]);

  return {
    payment: result.rows[0],
    plan
  };
};

const listMemberAttendanceLogs = async (gymId, memberId) => {
  const query = `
    SELECT a.id, a.gym_id, a.member_id, a.check_in_time, a.check_out_time,
           TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date,
           a.attendance_method, a.notes, a.created_at,
           g.name AS gym_name
    FROM attendance a
    JOIN gyms g ON a.gym_id = g.id
    WHERE a.member_id = $1 AND a.deleted_at IS NULL
    ORDER BY a.attendance_date DESC, a.check_in_time DESC
    LIMIT 100
  `;
  const result = await pool.query(query, [memberId]);
  return result.rows;
};

const recordMemberCheckIn = async (gymId, memberId, method = 'QR') => {
  await autoFinalizeExpiredAttendance(gymId);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  const existingQuery = `
    SELECT a.id, a.gym_id, a.check_in_time, a.check_out_time,
           TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date,
           a.attendance_method, g.name AS gym_name
    FROM attendance a
    JOIN gyms g ON a.gym_id = g.id
    WHERE a.member_id = $1 AND a.attendance_date = CURRENT_DATE AND a.deleted_at IS NULL
    LIMIT 1
  `;
  const existingResult = await pool.query(existingQuery, [memberId]);
  const existing = existingResult.rows[0];

  if (existing) {
    if (existing.check_in_time && !existing.check_out_time) {
      return {
        action: 'DUPLICATE',
        alreadyCheckedIn: true,
        attendance: existing
      };
    } else {
      return {
        action: 'ALREADY_COMPLETED',
        alreadyCheckedIn: false,
        attendance: existing
      };
    }
  }

  const insertQuery = `
    INSERT INTO attendance (gym_id, member_id, check_in_time, attendance_date, attendance_method)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, gym_id, check_in_time, check_out_time, TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date, attendance_method
  `;
  const insertResult = await pool.query(insertQuery, [gymId, memberId, now, today, method]);
  const created = insertResult.rows[0];

  const gymRes = await pool.query('SELECT name FROM gyms WHERE id = $1', [gymId]);
  created.gym_name = gymRes.rows[0]?.name || 'Gym';

  return { action: 'CHECK_IN', attendance: created };
};

const recordMemberCheckOut = async (gymId, memberId, attendanceId = null) => {
  await autoFinalizeExpiredAttendance(gymId);
  const now = new Date();

  let query;
  let params;

  if (attendanceId) {
    query = `
      UPDATE attendance
      SET check_out_time = $1, updated_at = NOW()
      WHERE id = $2 AND member_id = $3 AND check_out_time IS NULL AND deleted_at IS NULL
      RETURNING id, gym_id, check_in_time, check_out_time, TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date, attendance_method
    `;
    params = [now, attendanceId, memberId];
  } else {
    query = `
      UPDATE attendance
      SET check_out_time = $1, updated_at = NOW()
      WHERE member_id = $2 AND attendance_date = CURRENT_DATE AND check_out_time IS NULL AND deleted_at IS NULL
      RETURNING id, gym_id, check_in_time, check_out_time, TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date, attendance_method
    `;
    params = [now, memberId];
  }

  const result = await pool.query(query, params);
  if (result.rows[0]) {
    const record = result.rows[0];
    const gymRes = await pool.query('SELECT name FROM gyms WHERE id = $1', [record.gym_id]);
    record.gym_name = gymRes.rows[0]?.name || 'Gym';
    return { alreadyCheckedOut: false, attendance: record };
  }

  // Check if it was already checked out (for idempotent response)
  const checkExistingQuery = attendanceId
    ? `SELECT a.id, a.gym_id, a.check_in_time, a.check_out_time, TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, g.name AS gym_name FROM attendance a JOIN gyms g ON a.gym_id = g.id WHERE a.id = $1 AND a.member_id = $2 AND a.deleted_at IS NULL`
    : `SELECT a.id, a.gym_id, a.check_in_time, a.check_out_time, TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, g.name AS gym_name FROM attendance a JOIN gyms g ON a.gym_id = g.id WHERE a.member_id = $1 AND a.attendance_date = CURRENT_DATE AND a.deleted_at IS NULL`;
  const checkExistingParams = attendanceId ? [attendanceId, memberId] : [memberId];
  const existingRes = await pool.query(checkExistingQuery, checkExistingParams);

  if (existingRes.rows[0]) {
    return { alreadyCheckedOut: true, attendance: existingRes.rows[0] };
  }

  return null;
};

const isMemberAuthorizedForGym = async (memberGymId, targetGymId) => {
  if (String(memberGymId).toLowerCase() === String(targetGymId).toLowerCase()) {
    return true;
  }
  const query = `
    SELECT 1
    FROM gyms g1
    JOIN gyms g2 ON g1.id = $1 AND g2.id = $2
    WHERE g1.deleted_at IS NULL AND g2.deleted_at IS NULL
      AND (g1.is_multi_gym = TRUE OR LOWER(g1.subscription_plan) LIKE '%multi%')
      AND g1.subscription_status = 'ACTIVE'
      AND (
        EXISTS (
          SELECT 1 FROM staff s1
          JOIN staff s2 ON LOWER(s1.email) = LOWER(s2.email)
          WHERE s1.gym_id = g1.id AND s2.gym_id = g2.id
            AND s1.role = 'Owner' AND s2.role = 'Owner'
            AND s1.is_active = TRUE AND s2.is_active = TRUE
            AND s1.deleted_at IS NULL AND s2.deleted_at IS NULL
        )
        OR
        (
          (LOWER(g1.email) = LOWER(g2.email) AND g1.email IS NOT NULL AND g1.email != '')
          OR
          (LOWER(g1.owner_name) = LOWER(g2.owner_name) AND g1.owner_name IS NOT NULL AND g1.owner_name != '')
        )
      )
    LIMIT 1
  `;
  const result = await pool.query(query, [memberGymId, targetGymId]);
  return result.rows.length > 0;
};

const getMemberEligibleClassSessions = async (gymId, memberId) => {
  const query = `
    SELECT
      cs.id AS session_id,
      cs.class_id,
      TO_CHAR(cs.session_date, 'YYYY-MM-DD') AS session_date,
      cs.start_time,
      cs.end_time,
      cs.capacity,
      cs.status AS session_status,
      c.name AS class_name,
      c.category,
      c.instructor_name,
      b.id AS booking_id,
      b.status AS booking_status,
      ca.id AS attendance_id,
      ca.status AS class_attendance_status,
      ca.marked_at,
      ca.checkout_at
    FROM class_sessions cs
    JOIN classes c ON c.id = cs.class_id
    LEFT JOIN class_bookings b ON b.session_id = cs.id AND b.member_id = $2 AND b.status = 'Booked'
    LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.member_id = $2
    WHERE cs.gym_id = $1
      AND cs.session_date = CURRENT_DATE
      AND cs.status != 'Cancelled'
      AND c.deleted_at IS NULL
    ORDER BY cs.start_time ASC
  `;
  const result = await pool.query(query, [gymId, memberId]);

  const membershipQuery = `
    SELECT
      cm.id, cm.status, cp.allowed_class_ids, cp.allowed_categories
    FROM class_memberships cm
    JOIN class_plans cp ON cp.id = cm.class_plan_id
    WHERE cm.gym_id = $1 AND cm.member_id = $2 AND cm.status = 'Active' AND cm.expiry_date >= CURRENT_DATE
  `;
  const memRes = await pool.query(membershipQuery, [gymId, memberId]);
  const activeMemberships = memRes.rows;

  return result.rows.filter((session) => {
    if (session.booking_id) return true;
    if (activeMemberships.length === 0) return false;
    return activeMemberships.some((cm) => {
      const allowedIds = cm.allowed_class_ids || [];
      const allowedCats = cm.allowed_categories || [];
      const matchesId = allowedIds.length === 0 || allowedIds.includes(session.class_id);
      const matchesCat = allowedCats.length === 0 || allowedCats.includes(session.category);
      return matchesId && matchesCat;
    });
  }).map((s) => ({
    sessionId: s.session_id,
    classId: s.class_id,
    sessionDate: s.session_date,
    startTime: s.start_time,
    endTime: s.end_time,
    className: s.class_name,
    category: s.category,
    instructorName: s.instructor_name,
    isBooked: Boolean(s.booking_id),
    alreadyAttended: Boolean(s.attendance_id && s.class_attendance_status === 'Attended'),
    markedAt: s.marked_at,
    checkoutAt: s.checkout_at
  }));
};

const getHourlyCrowdAnalytics = async (gymId) => {
  const query = `
    SELECT 
      EXTRACT(HOUR FROM check_in_time) AS checkin_hour,
      COUNT(*) AS total_count
    FROM attendance
    WHERE gym_id = $1 
      AND attendance_date >= CURRENT_DATE - INTERVAL '30 days'
      AND deleted_at IS NULL
    GROUP BY checkin_hour
    ORDER BY checkin_hour ASC
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows;
};

const listMemberBodyMeasurements = async (gymId, memberId) => {
  const query = `
    SELECT id, gym_id, member_id, measurement_date, weight, height, chest, waist,
           hips, biceps, thighs, body_fat_percentage, muscle_mass, notes, created_at
    FROM body_measurements
    WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL
    ORDER BY measurement_date DESC, created_at DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows;
};

const createMemberBodyMeasurementRecord = async (gymId, memberId, data) => {
  const query = `
    INSERT INTO body_measurements (
      gym_id, member_id, measurement_date, weight, height, chest, waist,
      hips, biceps, thighs, body_fat_percentage, muscle_mass, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id, measurement_date, weight, height, chest, waist, hips, biceps,
              thighs, body_fat_percentage, muscle_mass, notes, created_at
  `;
  const result = await pool.query(query, [
    gymId,
    memberId,
    data.measurementDate || new Date().toISOString().slice(0, 10),
    data.weight ?? null,
    data.height ?? null,
    data.chest ?? null,
    data.waist ?? null,
    data.hips ?? null,
    data.biceps ?? null,
    data.thighs ?? null,
    data.bodyFatPercentage ?? null,
    data.muscleMass ?? null,
    data.notes ?? null
  ]);
  return result.rows[0];
};

const listMemberFitnessGoals = async (gymId, memberId) => {
  const query = `
    SELECT id, gym_id, member_id, goal_type, title, target_value, starting_value,
           current_value, unit, target_date, status, completed_at, created_at
    FROM fitness_goals
    WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL
    ORDER BY status ASC, created_at DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows;
};

const createMemberFitnessGoalRecord = async (gymId, memberId, data) => {
  const query = `
    INSERT INTO fitness_goals (
      gym_id, member_id, goal_type, title, target_value, starting_value,
      current_value, unit, target_date, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
    RETURNING id, goal_type, title, target_value, starting_value, current_value,
              unit, target_date, status, created_at
  `;
  const result = await pool.query(query, [
    gymId,
    memberId,
    data.goalType,
    data.title,
    data.targetValue,
    data.startingValue,
    data.currentValue ?? data.startingValue,
    data.unit || 'kg',
    data.targetDate
  ]);
  return result.rows[0];
};

const updateFitnessGoalStatus = async (gymId, memberId, goalId, status) => {
  const completedAt = status === 'COMPLETED' ? new Date() : null;
  const query = `
    UPDATE fitness_goals
    SET status = $1, completed_at = $2, updated_at = NOW()
    WHERE id = $3 AND gym_id = $4 AND member_id = $5 AND deleted_at IS NULL
    RETURNING id, status, completed_at
  `;
  const result = await pool.query(query, [status, completedAt, goalId, gymId, memberId]);
  return result.rows[0] ?? null;
};

const deleteFitnessGoalRecord = async (gymId, memberId, goalId) => {
  const query = `
    UPDATE fitness_goals
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND gym_id = $2 AND member_id = $3 AND deleted_at IS NULL
    RETURNING id
  `;
  const result = await pool.query(query, [goalId, gymId, memberId]);
  return result.rows[0] ?? null;
};

// Phase 5 Repository Queries
const updateMemberProfileRecord = async (gymId, memberId, data) => {
  const query = `
    UPDATE members
    SET first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        profile_photo_url = COALESCE($5, profile_photo_url),
        updated_at = NOW()
    WHERE id = $6 AND gym_id = $7 AND deleted_at IS NULL
    RETURNING id, first_name, last_name, email, phone, profile_photo_url
  `;
  const result = await pool.query(query, [
    data.firstName ?? null,
    data.lastName ?? null,
    data.email ?? null,
    data.phone ?? null,
    data.profilePhotoUrl ?? null,
    memberId,
    gymId
  ]);
  return result.rows[0] ?? null;
};

const listMemberNotifications = async (gymId, memberId) => {
  // Auto-seed system notifications if empty
  const countQuery = `SELECT COUNT(*) FROM notifications WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL`;
  const countResult = await pool.query(countQuery, [gymId, memberId]);
  if (Number(countResult.rows[0]?.count ?? 0) === 0) {
    const seedQuery = `
      INSERT INTO notifications (gym_id, member_id, notification_type, delivery_channel, title, message, is_read, sent_at)
      VALUES
        ($1, $2, 'Announcement', 'In-App', 'Welcome to GymPulse Mobile!', 'Access your digital member ID card, QR check-in, and workout progress anytime.', FALSE, NOW() - INTERVAL '1 hour'),
        ($1, $2, 'Attendance Reminder', 'In-App', 'QR Scanner Ready', 'Scan your gym reception QR code for instant check-in and check-out tracking.', FALSE, NOW() - INTERVAL '3 hours'),
        ($1, $2, 'Promotion', 'In-App', 'Track Body Metrics', 'Record your height, weight, and fitness goals to view progress analytics.', FALSE, NOW() - INTERVAL '1 day')
    `;
    await pool.query(seedQuery, [gymId, memberId]);
  }

  const query = `
    SELECT id, gym_id, member_id, notification_type, delivery_channel, title, message, is_read, sent_at, read_at
    FROM notifications
    WHERE gym_id = $1 AND member_id = $2 AND deleted_at IS NULL
    ORDER BY sent_at DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows;
};

const markNotificationAsRead = async (gymId, memberId, notificationId) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND gym_id = $2 AND member_id = $3 AND deleted_at IS NULL
    RETURNING id, is_read, read_at
  `;
  const result = await pool.query(query, [notificationId, gymId, memberId]);
  return result.rows[0] ?? null;
};

const markAllNotificationsAsRead = async (gymId, memberId) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE gym_id = $1 AND member_id = $2 AND is_read = FALSE AND deleted_at IS NULL
  `;
  await pool.query(query, [gymId, memberId]);
};

module.exports = {
  findMemberForAuth,
  updateMemberPassword,
  getMemberProfile,
  checkMemberClassEntitlement,
  getTodayAttendanceForMember,
  getMemberAttendanceStats,
  getMemberLatestPayment,
  getGymCurrentOccupancy,
  listGymMembershipPlans,
  listMemberPayments,
  getMemberPaymentReceipt,
  findMembershipPlanById,
  createMemberRenewalRecord,
  listMemberAttendanceLogs,
  recordMemberCheckIn,
  recordMemberCheckOut,
  getHourlyCrowdAnalytics,
  listMemberBodyMeasurements,
  createMemberBodyMeasurementRecord,
  listMemberFitnessGoals,
  createMemberFitnessGoalRecord,
  updateFitnessGoalStatus,
  deleteFitnessGoalRecord,
  updateMemberProfileRecord,
  listMemberNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  isMemberAuthorizedForGym,
  getMemberEligibleClassSessions
};
