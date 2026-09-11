const { pool } = require('../db/pool');

const attendanceColumns = `
  a.id, a.gym_id, a.member_id, m.member_id AS member_member_id,
  a.check_in_time, a.check_out_time, TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.attendance_method,
  a.marked_by_staff_id, a.notes, a.created_at, a.updated_at`;

const attendanceReturningColumns = `
  id, gym_id, member_id, check_in_time, check_out_time, TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date,
  attendance_method, marked_by_staff_id, notes, created_at, updated_at`;

const editableAttendanceColumns = Object.freeze({
  memberId: 'member_id',
  checkInTime: 'check_in_time',
  checkOutTime: 'check_out_time',
  attendanceDate: 'attendance_date',
  attendanceMethod: 'attendance_method',
  markedByStaffId: 'marked_by_staff_id',
  notes: 'notes'
});

const findMemberForGym = async (gymId, memberId) => {
  const result = await pool.query(
    `SELECT id, member_id, first_name, last_name
     FROM members
     WHERE (member_id = UPPER($1) OR id::text = LOWER($1)) AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [memberId, gymId]
  );

  return result.rows[0] ?? null;
};

const findStaffForGym = async (gymId, staffId) => {
  const result = await pool.query(
    `SELECT id
     FROM staff
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [staffId, gymId]
  );

  return result.rows[0] ?? null;
};

const autoFinalizeExpiredAttendance = async (gymId = null) => {
  try {
    const query = `
      UPDATE attendance
      SET check_out_time = LEAST(check_in_time + INTERVAL '4 hours', NOW()),
          notes = CASE
            WHEN notes IS NULL OR notes = '' THEN '[Auto checked-out after 4 hours]'
            WHEN notes NOT LIKE '%[Auto checked-out%' THEN notes || ' [Auto checked-out after 4 hours]'
            ELSE notes
          END,
          updated_at = NOW()
      WHERE check_out_time IS NULL
        AND (
          check_in_time <= NOW() - INTERVAL '4 hours'
          OR attendance_date < CURRENT_DATE
        )
        AND deleted_at IS NULL
        ${gymId ? 'AND gym_id = $1' : ''}
    `;
    const params = gymId ? [gymId] : [];
    const res = await pool.query(query, params);
    return res.rowCount || 0;
  } catch (err) {
    console.error('Error auto-finalizing expired attendance:', err);
    return 0;
  }
};

const createAttendance = async ({ gymId, ...attendance }) => {
  await autoFinalizeExpiredAttendance(gymId);
  const result = await pool.query(
    `INSERT INTO attendance (
      gym_id,
      member_id,
      check_in_time,
      check_out_time,
      attendance_date,
      attendance_method,
      marked_by_staff_id,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${attendanceReturningColumns}`,
    [
      gymId,
      attendance.memberId,
      attendance.checkInTime,
      attendance.checkOutTime ?? null,
      attendance.attendanceDate,
      attendance.attendanceMethod,
      attendance.markedByStaffId ?? null,
      attendance.notes ?? null
    ]
  );

  return { ...result.rows[0], member_member_id: attendance.memberPublicId };
};

const listAttendance = async (gymId, { page = 1, limit = 20, search, sortBy, order, status } = {}) => {
  await autoFinalizeExpiredAttendance(gymId);
  const sortColumns = {
    attendanceDate: 'attendance_date',
    checkInTime: 'check_in_time',
    createdAt: 'created_at'
  };
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Number(limit) || 20);
  const offset = (parsedPage - 1) * parsedLimit;
  const sortCol = (sortBy && sortColumns[sortBy]) ? sortColumns[sortBy] : 'check_in_time';
  const sortOrder = String(order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const result = await pool.query(
    `SELECT ${attendanceColumns}, COUNT(*) OVER() AS total_count
     FROM attendance a JOIN members m ON m.id = a.member_id
     WHERE a.gym_id = $1
       AND a.deleted_at IS NULL
       AND ($2::text IS NULL OR a.attendance_method = $2)
       AND (
         $3::text IS NULL
         OR a.attendance_method ILIKE '%' || $3 || '%'
         OR a.notes ILIKE '%' || $3 || '%'
         OR m.member_id ILIKE '%' || $3 || '%'
       )
     ORDER BY a.${sortCol} ${sortOrder}
     LIMIT $4 OFFSET $5`,
    [gymId, status ?? null, search ?? null, parsedLimit, offset]
  );

  return {
    items: result.rows.map(({ total_count: _totalCount, ...attendance }) => attendance),
    total: result.rows[0] ? Number(result.rows[0].total_count) : 0
  };
};

const findAttendanceById = async (gymId, attendanceId) => {
  const result = await pool.query(
    `SELECT ${attendanceColumns}
     FROM attendance a JOIN members m ON m.id = a.member_id
     WHERE a.id = $1 AND a.gym_id = $2 AND a.deleted_at IS NULL
     LIMIT 1`,
    [attendanceId, gymId]
  );

  return result.rows[0] ?? null;
};

const updateAttendanceById = async (gymId, attendanceId, changes) => {
  const updates = Object.entries(changes)
    .filter(([field, value]) => editableAttendanceColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editableAttendanceColumns[field], value }));
  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(attendanceId, gymId);

  const result = await pool.query(
    `UPDATE attendance
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length - 1}
       AND gym_id = $${values.length}
       AND deleted_at IS NULL
     RETURNING ${attendanceReturningColumns}`,
    values
  );

  return result.rows[0] ?? null;
};

const softDeleteAttendance = async (gymId, attendanceId) => {
  const result = await pool.query(
    `UPDATE attendance
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [attendanceId, gymId]
  );

  return result.rows[0] ?? null;
};

const findAttendanceByMemberAndDate = async (gymId, memberId, attendanceDate) => {
  const result = await pool.query(
    `SELECT id, gym_id, member_id, attendance_date, check_in_time, check_out_time
     FROM attendance
     WHERE gym_id = $1 AND member_id = $2 AND attendance_date = $3 AND deleted_at IS NULL
     LIMIT 1`,
    [gymId, memberId, attendanceDate]
  );

  return result.rows[0] ?? null;
};

module.exports = {
  autoFinalizeExpiredAttendance,
  createAttendance,
  findAttendanceById,
  findAttendanceByMemberAndDate,
  findMemberForGym,
  findStaffForGym,
  listAttendance,
  softDeleteAttendance,
  updateAttendanceById
};
