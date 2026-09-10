const { pool } = require('../db/pool');
const { autoFinalizeExpiredAttendance } = require('./attendance.repository');

const buildMemberFilters = ({ gymId, planId, memberStatus, search, startDate, endDate }, values) => {
  const where = ['m.gym_id = $1', 'm.deleted_at IS NULL'];
  values.push(gymId);
  const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
  if (planId) add('m.membership_plan_id = ?', planId);
  if (memberStatus === 'active') where.push('m.is_active = TRUE AND m.expiry_date >= CURRENT_DATE');
  if (memberStatus === 'expired') where.push('m.expiry_date < CURRENT_DATE');
  if (memberStatus === 'due') where.push("m.is_active = TRUE AND m.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'");
  if (search) {
    values.push(search, search, search, search);
    const n = values.length - 3;
    where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`);
  }
  if (startDate) add('m.join_date >= ?', startDate);
  if (endDate) add('m.join_date <= ?', endDate);
  return where;
};

const getSummary = async (gymId, query = {}) => {
  const type = query.type || 'member';

  if (type === 'payment' || type === 'revenue' || type === 'business') {
    const values = [gymId];
    const where = ['p.gym_id = $1', 'p.deleted_at IS NULL'];
    const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
    if (query.planId) add('p.membership_plan_id = ?', query.planId);
    if (query.paymentStatus) add('p.payment_status ILIKE ?', query.paymentStatus);
    if (query.search) {
      values.push(query.search, query.search, query.search, query.search);
      const n = values.length - 3;
      where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`);
    }
    if (query.startDate) add('p.payment_date >= ?', query.startDate);
    if (query.endDate) add('p.payment_date <= ?', query.endDate);

    const result = await pool.query(
      `SELECT
        COUNT(p.id)::INTEGER AS total_payments,
        COUNT(p.id) FILTER (WHERE p.payment_status ILIKE 'Paid')::INTEGER AS paid_payments,
        COUNT(p.id) FILTER (WHERE p.payment_status ILIKE 'Pending' OR p.payment_status ILIKE 'Partial')::INTEGER AS pending_payments,
        COUNT(p.id) FILTER (WHERE p.payment_status ILIKE 'Failed')::INTEGER AS failed_payments,
        COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status ILIKE 'Paid'), 0) AS total_revenue,
        COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status ILIKE 'Paid' AND p.payment_date >= date_trunc('month', CURRENT_DATE)), 0) AS month_revenue,
        COALESCE(SUM(p.remaining_amount) FILTER (WHERE p.payment_status ILIKE 'Pending' OR p.payment_status ILIKE 'Partial'), 0) AS pending_amount
       FROM payments p
       LEFT JOIN members m ON m.id = p.member_id
       WHERE ${where.join(' AND ')}`,
      values
    );
    const row = result.rows[0] || {};
    return {
      totalPayments: Number(row.total_payments || 0),
      paidPayments: Number(row.paid_payments || 0),
      pendingPayments: Number(row.pending_payments || 0),
      failedPayments: Number(row.failed_payments || 0),
      totalRevenue: Number(row.total_revenue || 0),
      monthRevenue: Number(row.month_revenue || 0),
      pendingAmount: Number(row.pending_amount || 0),
      total_members: Number(row.total_payments || 0),
      active_members: Number(row.paid_payments || 0),
      expired_members: Number(row.pending_payments || 0),
      renewals_due: Number(row.failed_payments || 0),
      total_revenue: Number(row.total_revenue || 0),
      month_revenue: Number(row.month_revenue || 0),
      totalMembers: Number(row.total_payments || 0),
      activeMembers: Number(row.paid_payments || 0),
      expiredMembers: Number(row.pending_payments || 0),
      renewalsDue: Number(row.failed_payments || 0)
    };
  }

  if (type === 'attendance') {
    await autoFinalizeExpiredAttendance(gymId);
    const values = [gymId];
    const where = ['a.gym_id = $1', 'a.deleted_at IS NULL'];
    const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
    if (query.planId) add('m.membership_plan_id = ?', query.planId);
    if (query.search) {
      values.push(query.search, query.search, query.search, query.search);
      const n = values.length - 3;
      where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`);
    }
    if (query.startDate) add('a.attendance_date >= ?', query.startDate);
    if (query.endDate) add('a.attendance_date <= ?', query.endDate);

    const result = await pool.query(
      `SELECT
        COUNT(a.id)::INTEGER AS total_attendance,
        COUNT(DISTINCT a.member_id)::INTEGER AS unique_members,
        COUNT(a.id) FILTER (WHERE a.attendance_date = CURRENT_DATE OR a.attendance_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE)::INTEGER AS today_attendance,
        COUNT(a.id) FILTER (
          WHERE a.check_out_time IS NOT NULL
             OR a.check_in_time <= NOW() - INTERVAL '4 hours'
             OR a.attendance_date < CURRENT_DATE
        )::INTEGER AS checked_out,
        COUNT(a.id) FILTER (
          WHERE a.check_out_time IS NULL
            AND (a.attendance_date = CURRENT_DATE OR a.attendance_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE)
            AND a.check_in_time > NOW() - INTERVAL '4 hours'
        )::INTEGER AS currently_in
       FROM attendance a
       JOIN members m ON m.id = a.member_id
       WHERE ${where.join(' AND ')}`,
      values
    );
    const row = result.rows[0] || {};
    return {
      totalAttendance: Number(row.total_attendance || 0),
      uniqueMembers: Number(row.unique_members || 0),
      todayAttendance: Number(row.today_attendance || 0),
      checkedOut: Number(row.checked_out || 0),
      currentlyIn: Number(row.currently_in || 0),
      totalRevenue: 0,
      monthRevenue: 0,
      total_members: Number(row.total_attendance || 0),
      active_members: Number(row.unique_members || 0),
      expired_members: Number(row.checked_out || 0),
      renewals_due: Number(row.currently_in || 0),
      total_revenue: 0,
      month_revenue: 0,
      totalMembers: Number(row.total_attendance || 0),
      activeMembers: Number(row.unique_members || 0),
      expiredMembers: Number(row.checked_out || 0),
      renewalsDue: Number(row.currently_in || 0)
    };
  }

  // Default: Member Report summary
  const values = [];
  const where = buildMemberFilters({ gymId, ...query }, values);
  const result = await pool.query(
    `SELECT
      COUNT(DISTINCT m.id)::INTEGER AS total_members,
      COUNT(DISTINCT m.id) FILTER (WHERE m.is_active AND m.expiry_date >= CURRENT_DATE)::INTEGER AS active_members,
      COUNT(DISTINCT m.id) FILTER (WHERE m.expiry_date < CURRENT_DATE)::INTEGER AS expired_members,
      COUNT(DISTINCT m.id) FILTER (WHERE m.is_active AND m.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')::INTEGER AS renewals_due,
      COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status = 'Paid'), 0) AS total_revenue,
      COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status = 'Paid' AND p.payment_date >= date_trunc('month', CURRENT_DATE)), 0) AS month_revenue
     FROM members m
     LEFT JOIN payments p ON p.member_id = m.id AND p.deleted_at IS NULL
     WHERE ${where.join(' AND ')}`,
    values
  );
  const row = result.rows[0] || {};
  return {
    totalMembers: Number(row.total_members || 0),
    activeMembers: Number(row.active_members || 0),
    expiredMembers: Number(row.expired_members || 0),
    renewalsDue: Number(row.renewals_due || 0),
    totalRevenue: Number(row.total_revenue || 0),
    monthRevenue: Number(row.month_revenue || 0),
    total_members: Number(row.total_members || 0),
    active_members: Number(row.active_members || 0),
    expired_members: Number(row.expired_members || 0),
    renewals_due: Number(row.renewals_due || 0),
    total_revenue: Number(row.total_revenue || 0),
    month_revenue: Number(row.month_revenue || 0)
  };
};

const listMembers = async (gymId, query = {}) => {
  const values = [];
  const where = buildMemberFilters({ gymId, ...query }, values);
  const sort = { name: 'm.first_name', expiry: 'm.expiry_date', joinDate: 'm.join_date', revenue: 'total_paid' }[query.sortBy] || 'm.created_at';
  const order = (query.order || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 20, 1);
  values.push(limit, (page - 1) * limit);
  const result = await pool.query(
    `SELECT m.id, m.member_id, m.first_name, m.last_name, m.phone,
       TO_CHAR(m.join_date, 'YYYY-MM-DD') AS join_date,
       TO_CHAR(m.expiry_date, 'YYYY-MM-DD') AS expiry_date,
       m.is_active, mp.plan_name,
       COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status = 'Paid'), 0) AS total_paid,
       TO_CHAR(MAX(p.payment_date) FILTER (WHERE p.payment_status = 'Paid'), 'YYYY-MM-DD') AS last_payment_date,
       COUNT(*) OVER() AS total_count
     FROM members m
     JOIN membership_plans mp ON mp.id = m.membership_plan_id
     LEFT JOIN payments p ON p.member_id = m.id AND p.deleted_at IS NULL
     WHERE ${where.join(' AND ')}
     GROUP BY m.id, mp.plan_name
     ORDER BY ${sort} ${order}, m.member_id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

const listPayments = async (gymId, query = {}) => {
  const values = [gymId]; const where = ['p.gym_id = $1', 'p.deleted_at IS NULL'];
  const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
  if (query.planId) add('p.membership_plan_id = ?', query.planId);
  if (query.paymentStatus) add('p.payment_status ILIKE ?', query.paymentStatus);
  if (query.search) { values.push(query.search, query.search, query.search, query.search); const n = values.length - 3; where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`); }
  if (query.startDate) add('p.payment_date >= ?', query.startDate); if (query.endDate) add('p.payment_date <= ?', query.endDate);
  const order = (query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 20, 1);
  values.push(limit, (page - 1) * limit);
  const result = await pool.query(
    `SELECT p.id, COALESCE(m.member_id, '') AS member_id, COALESCE(m.first_name, 'Member') AS first_name, COALESCE(m.last_name, '') AS last_name, COALESCE(m.phone, '') AS phone, COALESCE(mp.plan_name, 'General Plan') AS plan_name, TO_CHAR(p.payment_date, 'YYYY-MM-DD') AS payment_date, p.payment_status, p.payment_method, p.total_amount, p.created_at, COUNT(*) OVER() AS total_count
     FROM payments p
     LEFT JOIN members m ON m.id = p.member_id
     LEFT JOIN membership_plans mp ON mp.id = p.membership_plan_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.payment_date ${order}, p.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

const listAttendance = async (gymId, query = {}) => {
  await autoFinalizeExpiredAttendance(gymId);
  const values = [gymId]; const where = ['a.gym_id = $1', 'a.deleted_at IS NULL'];
  const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
  if (query.planId) add('m.membership_plan_id = ?', query.planId);
  if (query.search) { values.push(query.search, query.search, query.search, query.search); const n = values.length - 3; where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`); }
  if (query.startDate) add('a.attendance_date >= ?', query.startDate); if (query.endDate) add('a.attendance_date <= ?', query.endDate);
  const order = (query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || 20, 1);
  values.push(limit, (page - 1) * limit);
  const result = await pool.query(
    `SELECT a.id, COALESCE(m.member_id, '') AS member_id, COALESCE(m.first_name, 'Member') AS first_name, COALESCE(m.last_name, '') AS last_name, COALESCE(m.phone, '') AS phone, COALESCE(mp.plan_name, 'General Plan') AS plan_name, TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.check_in_time, a.check_out_time, a.attendance_method, COUNT(*) OVER() AS total_count
     FROM attendance a
     LEFT JOIN members m ON m.id = a.member_id
     LEFT JOIN membership_plans mp ON mp.id = m.membership_plan_id
     WHERE ${where.join(' AND ')}
     ORDER BY a.attendance_date ${order}, a.check_in_time DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

module.exports = { getSummary, listAttendance, listMembers, listPayments };
