const { pool } = require('../db/pool');

const getClassDashboardKPIs = async (gymId) => {
  const query = `
    SELECT 
      COUNT(*) AS total_classes,
      COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active_classes
    FROM classes
    WHERE gym_id = $1 AND deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId]);

  const todayQuery = `
    SELECT COUNT(DISTINCT cs.class_id) AS classes_today
    FROM class_schedules cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.gym_id = $1 
      AND c.deleted_at IS NULL 
      AND c.is_active = TRUE
      AND LOWER(cs.day_of_week) = LOWER(TO_CHAR(CURRENT_DATE, 'Day'))
  `;
  const todayResult = await pool.query(todayQuery, [gymId]);

  const bookingsQuery = `
    SELECT COUNT(*) AS total_bookings_today
    FROM class_bookings cb
    JOIN class_sessions cs ON cs.id = cb.session_id
    WHERE cb.gym_id = $1 
      AND cb.status = 'Booked'
      AND cs.session_date = CURRENT_DATE
  `;
  const bookingsResult = await pool.query(bookingsQuery, [gymId]);

  const membersQuery = `
    SELECT 
      COUNT(*) AS total_class_memberships,
      COUNT(DISTINCT member_id) AS unique_class_members
    FROM class_memberships
    WHERE gym_id = $1 AND status = 'Active' AND expiry_date >= CURRENT_DATE
  `;
  const membersResult = await pool.query(membersQuery, [gymId]);

  return {
    totalClasses: Number(result.rows[0]?.total_classes ?? 0),
    activeClasses: Number(result.rows[0]?.active_classes ?? 0),
    classesToday: Number(todayResult.rows[0]?.classes_today ?? 0),
    totalBookingsToday: Number(bookingsResult.rows[0]?.total_bookings_today ?? 0),
    totalClassMemberships: Number(membersResult.rows[0]?.total_class_memberships ?? 0),
    uniqueClassMembers: Number(membersResult.rows[0]?.unique_class_members ?? 0)
  };
};

const listClasses = async (gymId) => {
  const query = `
    SELECT 
      c.id, c.gym_id, c.name, c.category, c.description, c.instructor_name,
      c.capacity, c.monthly_price, c.drop_in_price, c.is_active, c.created_at,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', cs.id,
              'dayOfWeek', cs.day_of_week,
              'startTime', cs.start_time,
              'endTime', cs.end_time
            )
          )
          FROM class_schedules cs
          WHERE cs.class_id = c.id
        ), '[]'::json
      ) AS schedule,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM class_bookings cb
          JOIN class_sessions sess ON sess.id = cb.session_id
          WHERE sess.class_id = c.id AND sess.session_date >= CURRENT_DATE AND cb.status = 'Booked'
        ), 0
      ) AS total_active_bookings
    FROM classes c
    WHERE c.gym_id = $1 AND c.deleted_at IS NULL
    ORDER BY c.name ASC
  `;
  const result = await pool.query(query, [gymId]);

  return result.rows.map((row) => ({
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    category: row.category,
    description: row.description,
    instructorName: row.instructor_name,
    capacity: Number(row.capacity),
    monthlyPrice: Number(row.monthly_price),
    dropInPrice: Number(row.drop_in_price ?? 0),
    isActive: row.is_active,
    schedule: row.schedule ?? [],
    bookedCount: Number(row.total_active_bookings),
    createdAt: row.created_at
  }));
};

const findClassById = async (gymId, classId) => {
  const query = `
    SELECT 
      c.id, c.gym_id, c.name, c.category, c.description, c.instructor_name,
      c.capacity, c.monthly_price, c.drop_in_price, c.is_active, c.created_at,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', cs.id,
              'dayOfWeek', cs.day_of_week,
              'startTime', cs.start_time,
              'endTime', cs.end_time
            )
          )
          FROM class_schedules cs
          WHERE cs.class_id = c.id
        ), '[]'::json
      ) AS schedule
    FROM classes c
    WHERE c.id = $1 AND c.gym_id = $2 AND c.deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [classId, gymId]);
  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    category: row.category,
    description: row.description,
    instructorName: row.instructor_name,
    capacity: Number(row.capacity),
    monthlyPrice: Number(row.monthly_price),
    dropInPrice: Number(row.drop_in_price ?? 0),
    isActive: row.is_active,
    schedule: row.schedule ?? [],
    createdAt: row.created_at
  };
};

const createClass = async (gymId, classData, scheduleItems = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertClassQuery = `
      INSERT INTO classes (
        gym_id, name, category, description, instructor_name,
        capacity, monthly_price, drop_in_price, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, gym_id, name, category, description, instructor_name, capacity, monthly_price, drop_in_price, is_active, created_at
    `;
    const classResult = await client.query(insertClassQuery, [
      gymId,
      classData.name,
      classData.category,
      classData.description ?? null,
      classData.instructorName ?? null,
      classData.capacity,
      classData.monthlyPrice,
      classData.dropInPrice ?? 0,
      classData.isActive ?? true
    ]);

    const createdClass = classResult.rows[0];

    const insertedSchedule = [];
    for (const item of scheduleItems) {
      const scheduleRes = await client.query(
        `INSERT INTO class_schedules (gym_id, class_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, day_of_week, start_time, end_time`,
        [gymId, createdClass.id, item.dayOfWeek, item.startTime, item.endTime]
      );
      insertedSchedule.push(scheduleRes.rows[0]);
    }

    await client.query('COMMIT');

    return {
      id: createdClass.id,
      gymId: createdClass.gym_id,
      name: createdClass.name,
      category: createdClass.category,
      description: createdClass.description,
      instructorName: createdClass.instructor_name,
      capacity: Number(createdClass.capacity),
      monthlyPrice: Number(createdClass.monthly_price),
      dropInPrice: Number(createdClass.drop_in_price ?? 0),
      isActive: createdClass.is_active,
      schedule: insertedSchedule.map((s) => ({
        id: s.id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time
      })),
      createdAt: createdClass.created_at
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateClass = async (gymId, classId, classData, scheduleItems = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE classes
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          instructor_name = COALESCE($4, instructor_name),
          capacity = COALESCE($5, capacity),
          monthly_price = COALESCE($6, monthly_price),
          drop_in_price = COALESCE($7, drop_in_price),
          is_active = COALESCE($8, is_active),
          updated_at = NOW()
      WHERE id = $9 AND gym_id = $10 AND deleted_at IS NULL
      RETURNING id, gym_id, name, category, description, instructor_name, capacity, monthly_price, drop_in_price, is_active
    `;
    const result = await client.query(updateQuery, [
      classData.name,
      classData.category,
      classData.description,
      classData.instructorName,
      classData.capacity,
      classData.monthlyPrice,
      classData.dropInPrice,
      classData.isActive,
      classId,
      gymId
    ]);

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    if (Array.isArray(scheduleItems)) {
      await client.query(`DELETE FROM class_schedules WHERE gym_id = $1 AND class_id = $2`, [gymId, classId]);
      for (const item of scheduleItems) {
        await client.query(
          `INSERT INTO class_schedules (gym_id, class_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5)`,
          [gymId, classId, item.dayOfWeek, item.startTime, item.endTime]
        );
      }
    }

    await client.query('COMMIT');
    return await findClassById(gymId, classId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const softDeleteClass = async (gymId, classId) => {
  const query = `
    UPDATE classes
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
    RETURNING id
  `;
  const result = await pool.query(query, [classId, gymId]);
  return result.rows[0] ?? null;
};

const getWeeklySchedule = async (gymId) => {
  const query = `
    SELECT 
      cs.id AS schedule_id,
      cs.day_of_week,
      cs.start_time,
      cs.end_time,
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      c.instructor_name,
      c.capacity,
      c.monthly_price
    FROM class_schedules cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.gym_id = $1 AND c.deleted_at IS NULL AND c.is_active = TRUE
    ORDER BY 
      CASE LOWER(cs.day_of_week)
        WHEN 'monday' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sunday' THEN 7
        ELSE 8
      END,
      cs.start_time ASC
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows.map((r) => ({
    scheduleId: r.schedule_id,
    dayOfWeek: r.day_of_week,
    startTime: r.start_time,
    endTime: r.end_time,
    classId: r.class_id,
    className: r.class_name,
    category: r.category,
    instructorName: r.instructor_name,
    capacity: Number(r.capacity),
    monthlyPrice: Number(r.monthly_price)
  }));
};

const ensureSession = async (gymId, classId, sessionDate, startTime, endTime, capacity) => {
  const findQuery = `
    SELECT id, gym_id, class_id, session_date, start_time, end_time, capacity, status
    FROM class_sessions
    WHERE gym_id = $1 AND class_id = $2 AND session_date = $3
    LIMIT 1
  `;
  const findRes = await pool.query(findQuery, [gymId, classId, sessionDate]);
  if (findRes.rows[0]) return findRes.rows[0];

  const insertQuery = `
    INSERT INTO class_sessions (gym_id, class_id, session_date, start_time, end_time, capacity, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'Scheduled')
    RETURNING id, gym_id, class_id, session_date, start_time, end_time, capacity, status
  `;
  const insertRes = await pool.query(insertQuery, [gymId, classId, sessionDate, startTime, endTime, capacity]);
  return insertRes.rows[0];
};

const listBookingsForClassOrSession = async (gymId, classId, sessionId = null) => {
  const query = `
    SELECT 
      cb.id AS booking_id,
      cb.status AS booking_status,
      cb.booked_at,
      cs.id AS session_id,
      cs.session_date,
      cs.start_time,
      cs.end_time,
      m.id AS member_uuid,
      m.member_id AS member_id,
      m.first_name,
      m.last_name,
      m.phone,
      c.name AS class_name,
      c.instructor_name
    FROM class_bookings cb
    JOIN class_sessions cs ON cs.id = cb.session_id
    JOIN classes c ON c.id = cb.class_id
    JOIN members m ON m.id = cb.member_id
    WHERE cb.gym_id = $1 
      AND ($2::uuid IS NULL OR cb.class_id = $2)
      AND ($3::uuid IS NULL OR cb.session_id = $3)
    ORDER BY cs.session_date DESC, cb.booked_at DESC
  `;
  const result = await pool.query(query, [gymId, classId ?? null, sessionId ?? null]);
  return result.rows.map((r) => ({
    bookingId: r.booking_id,
    bookingStatus: r.booking_status,
    bookedAt: r.booked_at,
    sessionId: r.session_id,
    sessionDate: r.session_date,
    startTime: r.start_time,
    endTime: r.end_time,
    memberUuid: r.member_uuid,
    memberId: r.member_id,
    memberName: `${r.first_name} ${r.last_name}`,
    memberPhone: r.phone,
    className: r.class_name,
    instructorName: r.instructor_name
  }));
};

const bookClassSession = async (gymId, classId, sessionId, memberId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Class details
    const classRes = await client.query(
      `SELECT id, name, category, is_active FROM classes WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL`,
      [classId, gymId]
    );
    if (!classRes.rows[0]) throw new Error('CLASS_NOT_FOUND');
    const classData = classRes.rows[0];

    // 2. Fetch Session details with FOR UPDATE lock
    const sessionRes = await client.query(
      `SELECT id, capacity, status, session_date FROM class_sessions WHERE id = $1 AND gym_id = $2 FOR UPDATE`,
      [sessionId, gymId]
    );
    if (!sessionRes.rows[0]) throw new Error('SESSION_NOT_FOUND');
    const sessionData = sessionRes.rows[0];

    // 3. Find matching active class membership for this member
    const membershipRes = await client.query(
      `SELECT 
        cm.id AS membership_id,
        cm.start_date,
        cm.expiry_date,
        cm.status AS membership_status,
        cm.sessions_allowed,
        cm.sessions_used,
        cp.name AS plan_name,
        cp.allowed_class_ids,
        cp.allowed_categories
       FROM class_memberships cm
       JOIN class_plans cp ON cp.id = cm.class_plan_id
       WHERE cm.gym_id = $1 AND cm.member_id = $2 AND cm.status = 'Active'
       ORDER BY cm.expiry_date DESC`,
      [gymId, memberId]
    );

    const activeMemberships = membershipRes.rows;
    if (activeMemberships.length === 0) {
      throw new Error('NO_ACTIVE_MEMBERSHIP');
    }

    // Filter membership covering this class
    const matchingMembership = activeMemberships.find((cm) => {
      const allowedIds = cm.allowed_class_ids || [];
      const allowedCats = cm.allowed_categories || [];

      const matchesClassId = allowedIds.length === 0 || allowedIds.includes(classId);
      const matchesCategory = allowedCats.length === 0 || allowedCats.includes(classData.category);

      return matchesClassId && matchesCategory;
    });

    if (!matchingMembership) {
      throw new Error('CLASS_NOT_INCLUDED_IN_PLAN');
    }

    // Check expiry
    const expiry = new Date(matchingMembership.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) {
      throw new Error('MEMBERSHIP_EXPIRED');
    }

    // Check sessions remaining if limited
    const allowed = matchingMembership.sessions_allowed ? Number(matchingMembership.sessions_allowed) : null;
    const used = Number(matchingMembership.sessions_used);

    if (allowed !== null && used >= allowed) {
      throw new Error('NO_SESSIONS_REMAINING');
    }

    // 4. Check duplicate booking
    const dupRes = await client.query(
      `SELECT id FROM class_bookings WHERE gym_id = $1 AND session_id = $2 AND member_id = $3 AND status != 'Cancelled'`,
      [gymId, sessionId, memberId]
    );
    if (dupRes.rows[0]) {
      throw new Error('ALREADY_BOOKED');
    }

    // 5. Check session capacity
    const countRes = await client.query(
      `SELECT COUNT(*) AS active_count FROM class_bookings WHERE gym_id = $1 AND session_id = $2 AND status = 'Booked'`,
      [gymId, sessionId]
    );
    const activeCount = Number(countRes.rows[0]?.active_count ?? 0);
    if (activeCount >= Number(sessionData.capacity)) {
      throw new Error('CLASS_FULL');
    }

    // 6. Insert booking record
    const insertRes = await client.query(
      `INSERT INTO class_bookings (gym_id, class_id, session_id, member_id, status, booked_at)
       VALUES ($1, $2, $3, $4, 'Booked', NOW())
       RETURNING id, gym_id, class_id, session_id, member_id, status, booked_at`,
      [gymId, classId, sessionId, memberId]
    );

    // 7. Increment sessions_used if limited plan
    if (allowed !== null) {
      await client.query(
        `UPDATE class_memberships SET sessions_used = sessions_used + 1, updated_at = NOW() WHERE id = $1`,
        [matchingMembership.membership_id]
      );
    }

    await client.query('COMMIT');

    const updatedUsed = allowed !== null ? used + 1 : used;
    const remaining = allowed !== null ? Math.max(0, allowed - updatedUsed) : 'Unlimited';

    return {
      ...insertRes.rows[0],
      planName: matchingMembership.plan_name,
      sessionsAllowed: allowed,
      sessionsUsed: updatedUsed,
      sessionsRemaining: remaining
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateBookingStatus = async (gymId, bookingId, status) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT cb.id, cb.status, cb.member_id, cb.session_id, cb.class_id
       FROM class_bookings cb
       WHERE cb.id = $1 AND cb.gym_id = $2
       FOR UPDATE`,
      [bookingId, gymId]
    );

    if (!bookingRes.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const booking = bookingRes.rows[0];

    // If cancelling an upcoming non-attended booking, restore session count for limited plan
    if (status === 'Cancelled' && booking.status === 'Booked') {
      const membershipRes = await client.query(
        `SELECT cm.id, cm.sessions_allowed, cm.sessions_used
         FROM class_memberships cm
         WHERE cm.gym_id = $1 AND cm.member_id = $2 AND cm.class_id = $3 AND cm.status = 'Active'
         ORDER BY cm.expiry_date DESC LIMIT 1`,
        [gymId, booking.member_id, booking.class_id]
      );

      if (membershipRes.rows[0]) {
        const cm = membershipRes.rows[0];
        if (cm.sessions_allowed !== null && Number(cm.sessions_used) > 0) {
          await client.query(
            `UPDATE class_memberships SET sessions_used = GREATEST(0, sessions_used - 1), updated_at = NOW() WHERE id = $1`,
            [cm.id]
          );
        }
      }
    }

    const updateRes = await client.query(
      `UPDATE class_bookings
       SET status = $1,
           cancelled_at = CASE WHEN $1 = 'Cancelled' THEN NOW() ELSE cancelled_at END,
           updated_at = NOW()
       WHERE id = $2 AND gym_id = $3
       RETURNING id, status, member_id, session_id, class_id`,
      [status, bookingId, gymId]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const markAttendance = async (gymId, classId, sessionId, memberId, status) => {
  const query = `
    INSERT INTO class_attendance (gym_id, class_id, session_id, member_id, status, marked_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (gym_id, session_id, member_id) 
    DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
    RETURNING id, status, marked_at
  `;
  const res = await pool.query(query, [gymId, classId, sessionId, memberId, status]);

  // Also update booking status if exists
  await pool.query(
    `UPDATE class_bookings SET status = $1 WHERE gym_id = $2 AND session_id = $3 AND member_id = $4`,
    [status === 'Attended' ? 'Attended' : 'No Show', gymId, sessionId, memberId]
  );

  return res.rows[0];
};

const listMemberBookings = async (gymId, memberId) => {
  const query = `
    SELECT 
      cb.id AS booking_id,
      cb.status AS booking_status,
      cb.booked_at,
      cs.id AS session_id,
      cs.session_date,
      cs.start_time,
      cs.end_time,
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      c.instructor_name,
      c.monthly_price,
      c.drop_in_price
    FROM class_bookings cb
    JOIN class_sessions cs ON cs.id = cb.session_id
    JOIN classes c ON c.id = cb.class_id
    WHERE cb.gym_id = $1 AND cb.member_id = $2
    ORDER BY cs.session_date DESC, cs.start_time DESC
  `;
  const res = await pool.query(query, [gymId, memberId]);
  return res.rows.map((r) => ({
    bookingId: r.booking_id,
    bookingStatus: r.booking_status,
    bookedAt: r.booked_at,
    sessionId: r.session_id,
    sessionDate: r.session_date,
    startTime: r.start_time,
    endTime: r.end_time,
    classId: r.class_id,
    className: r.class_name,
    category: r.category,
    instructorName: r.instructor_name,
    monthlyPrice: Number(r.monthly_price),
    dropInPrice: Number(r.drop_in_price ?? 0)
  }));
};

const checkoutAttendance = async (gymId, sessionId, memberId) => {
  const query = `
    UPDATE class_attendance
    SET checkout_at = NOW()
    WHERE gym_id = $1 AND session_id = $2 AND member_id = $3 AND status = 'Attended'
    RETURNING id, status, marked_at, checkout_at
  `;
  const res = await pool.query(query, [gymId, sessionId, memberId]);
  return res.rows[0] ?? null;
};

const getMemberClassAttendanceHistory = async (gymId, memberId) => {
  const query = `
    SELECT 
      ca.id AS attendance_id,
      ca.status AS attendance_status,
      ca.marked_at,
      ca.checkout_at,
      cs.id AS session_id,
      cs.session_date,
      cs.start_time,
      cs.end_time,
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      c.instructor_name
    FROM class_attendance ca
    JOIN class_sessions cs ON cs.id = ca.session_id
    JOIN classes c ON c.id = ca.class_id
    WHERE ca.gym_id = $1 AND ca.member_id = $2
    ORDER BY cs.session_date DESC, cs.start_time DESC
  `;
  const res = await pool.query(query, [gymId, memberId]);
  const records = res.rows.map((r) => ({
    attendanceId: r.attendance_id,
    status: r.attendance_status,
    markedAt: r.marked_at,
    checkoutAt: r.checkout_at,
    sessionId: r.session_id,
    sessionDate: r.session_date,
    startTime: r.start_time,
    endTime: r.end_time,
    classId: r.class_id,
    className: r.class_name,
    category: r.category,
    instructorName: r.instructor_name
  }));

  const total = records.length;
  const attended = records.filter((r) => r.status === 'Attended').length;
  const missed = total - attended;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 100;

  return {
    stats: { totalSessions: total, attended, missed, attendanceRate: rate },
    history: records
  };
};

const getClassAttendanceAnalytics = async (gymId, classId = null, category = null) => {
  const query = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      COUNT(DISTINCT cm.member_id) AS active_members,
      COUNT(DISTINCT cs.id) AS total_sessions,
      COUNT(DISTINCT cb.id) AS total_bookings,
      COUNT(CASE WHEN ca.status = 'Attended' THEN 1 END) AS present_count,
      COUNT(CASE WHEN ca.status = 'Absent' THEN 1 END) AS absent_count,
      COUNT(CASE WHEN ca.status = 'No Show' THEN 1 END) AS no_show_count
    FROM classes c
    LEFT JOIN class_memberships cm ON cm.class_id = c.id AND cm.gym_id = $1 AND cm.status = 'Active'
    LEFT JOIN class_sessions cs ON cs.class_id = c.id AND cs.gym_id = $1
    LEFT JOIN class_bookings cb ON cb.session_id = cs.id AND cb.gym_id = $1 AND cb.status != 'Cancelled'
    LEFT JOIN class_attendance ca ON ca.session_id = cs.id AND ca.gym_id = $1
    WHERE c.gym_id = $1 
      AND c.deleted_at IS NULL
      AND ($2::uuid IS NULL OR c.id = $2)
      AND ($3::text IS NULL OR LOWER(c.category) = LOWER($3))
    GROUP BY c.id, c.name, c.category
    ORDER BY c.name ASC
  `;
  const res = await pool.query(query, [gymId, classId ?? null, category ?? null]);
  return res.rows.map((r) => {
    const present = Number(r.present_count);
    const bookings = Number(r.total_bookings);
    const rate = bookings > 0 ? Math.round((present / bookings) * 100) : 100;
    return {
      classId: r.class_id,
      className: r.class_name,
      category: r.category,
      activeMembers: Number(r.active_members),
      totalSessions: Number(r.total_sessions),
      totalBookings: bookings,
      presentCount: present,
      absentCount: Number(r.absent_count),
      noShowCount: Number(r.no_show_count),
      attendanceRate: rate
    };
  });
};

const getSessionQRData = async (gymId, sessionId) => {
  const query = `
    SELECT 
      cs.id AS session_id,
      cs.session_date,
      cs.start_time,
      cs.end_time,
      cs.capacity,
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      c.instructor_name,
      (
        SELECT COUNT(*) FROM class_bookings cb 
        WHERE cb.session_id = cs.id AND cb.gym_id = $1 AND cb.status = 'Booked'
      ) AS booked_count,
      (
        SELECT COUNT(*) FROM class_attendance ca 
        WHERE ca.session_id = cs.id AND ca.gym_id = $1 AND ca.status = 'Attended'
      ) AS present_count
    FROM class_sessions cs
    JOIN classes c ON c.id = cs.class_id
    WHERE cs.id = $2 AND cs.gym_id = $1
    LIMIT 1
  `;
  const res = await pool.query(query, [gymId, sessionId]);
  if (!res.rows[0]) return null;

  const r = res.rows[0];
  const cap = Number(r.capacity);
  const booked = Number(r.booked_count);
  const present = Number(r.present_count);
  const remaining = Math.max(0, cap - booked);

  const qrPayload = JSON.stringify({
    type: 'CLASS_SESSION',
    gymId,
    classId: r.class_id,
    sessionId: r.session_id,
    sessionDate: r.session_date,
    startTime: r.start_time
  });

  return {
    sessionId: r.session_id,
    classId: r.class_id,
    className: r.class_name,
    category: r.category,
    instructorName: r.instructor_name,
    sessionDate: r.session_date,
    startTime: r.start_time,
    endTime: r.end_time,
    capacity: cap,
    bookedCount: booked,
    presentCount: present,
    remainingSeats: remaining,
    qrPayload
  };
};

module.exports = {
  bookClassSession,
  checkoutAttendance,
  createClass,
  ensureSession,
  findClassById,
  getClassAttendanceAnalytics,
  getClassDashboardKPIs,
  getMemberClassAttendanceHistory,
  getWeeklySchedule,
  listBookingsForClassOrSession,
  listClasses,
  listMemberBookings,
  markAttendance,
  getSessionQRData,
  softDeleteClass,
  updateBookingStatus,
  updateClass
};
