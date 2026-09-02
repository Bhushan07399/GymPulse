const { pool } = require('../db/pool');

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

const getSummary = async (gymId, { startDate, endDate }) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE m.deleted_at IS NULL)::INTEGER AS total_members,
      COUNT(*) FILTER (WHERE m.deleted_at IS NULL AND m.is_active AND m.expiry_date >= CURRENT_DATE)::INTEGER AS active_members,
      COUNT(*) FILTER (WHERE m.deleted_at IS NULL AND m.expiry_date < CURRENT_DATE)::INTEGER AS expired_members,
      COUNT(*) FILTER (WHERE m.deleted_at IS NULL AND m.is_active AND m.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')::INTEGER AS renewals_due,
      COALESCE((SELECT SUM(p.total_amount) FROM payments p WHERE p.gym_id = $1 AND p.deleted_at IS NULL AND p.payment_status = 'Paid'), 0) AS total_revenue,
      COALESCE((SELECT SUM(p.total_amount) FROM payments p WHERE p.gym_id = $1 AND p.deleted_at IS NULL AND p.payment_status = 'Paid' AND p.payment_date >= date_trunc('month', CURRENT_DATE)), 0) AS month_revenue
     FROM members m WHERE m.gym_id = $1`, [gymId]
  );
  return result.rows[0];
};

const listMembers = async (gymId, query) => {
  const values = [];
  const where = buildMemberFilters({ gymId, ...query }, values);
  const sort = { name: 'm.first_name', expiry: 'm.expiry_date', joinDate: 'm.join_date', revenue: 'total_paid' }[query.sortBy];
  values.push(query.limit, (query.page - 1) * query.limit);
  const result = await pool.query(
    `SELECT m.id, m.member_id, m.first_name, m.last_name, m.phone, m.join_date, m.expiry_date, m.is_active,
       mp.plan_name, COALESCE(SUM(p.total_amount) FILTER (WHERE p.payment_status = 'Paid'), 0) AS total_paid,
       MAX(p.payment_date) FILTER (WHERE p.payment_status = 'Paid') AS last_payment_date,
       COUNT(*) OVER() AS total_count
     FROM members m
     JOIN membership_plans mp ON mp.id = m.membership_plan_id
     LEFT JOIN payments p ON p.member_id = m.id AND p.deleted_at IS NULL
     WHERE ${where.join(' AND ')}
     GROUP BY m.id, mp.plan_name
     ORDER BY ${sort} ${query.order.toUpperCase()}, m.member_id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

const listPayments = async (gymId, query) => {
  const values = [gymId]; const where = ['p.gym_id = $1', 'p.deleted_at IS NULL'];
  const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
  if (query.planId) add('p.membership_plan_id = ?', query.planId);
  if (query.paymentStatus) add('p.payment_status = ?', query.paymentStatus);
  if (query.search) { values.push(query.search, query.search, query.search, query.search); const n = values.length - 3; where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`); }
  if (query.startDate) add('p.payment_date >= ?', query.startDate); if (query.endDate) add('p.payment_date <= ?', query.endDate);
  values.push(query.limit, (query.page - 1) * query.limit);
  const result = await pool.query(`SELECT p.id, m.member_id, m.first_name, m.last_name, m.phone, mp.plan_name, p.payment_date, p.payment_status, p.payment_method, p.total_amount, COUNT(*) OVER() AS total_count FROM payments p JOIN members m ON m.id = p.member_id JOIN membership_plans mp ON mp.id = p.membership_plan_id WHERE ${where.join(' AND ')} ORDER BY p.payment_date ${query.order.toUpperCase()}, p.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

const listAttendance = async (gymId, query) => {
  const values = [gymId]; const where = ['a.gym_id = $1', 'a.deleted_at IS NULL'];
  const add = (clause, value) => { values.push(value); where.push(clause.replace('?', `$${values.length}`)); };
  if (query.planId) add('m.membership_plan_id = ?', query.planId);
  if (query.search) { values.push(query.search, query.search, query.search, query.search); const n = values.length - 3; where.push(`(m.member_id ILIKE '%' || $${n} || '%' OR m.first_name ILIKE '%' || $${n + 1} || '%' OR m.last_name ILIKE '%' || $${n + 2} || '%' OR m.phone ILIKE '%' || $${n + 3} || '%')`); }
  if (query.startDate) add('a.attendance_date >= ?', query.startDate); if (query.endDate) add('a.attendance_date <= ?', query.endDate);
  values.push(query.limit, (query.page - 1) * query.limit);
  const result = await pool.query(`SELECT a.id, m.member_id, m.first_name, m.last_name, m.phone, mp.plan_name, a.attendance_date, a.check_in_time, a.check_out_time, a.attendance_method, COUNT(*) OVER() AS total_count FROM attendance a JOIN members m ON m.id = a.member_id JOIN membership_plans mp ON mp.id = m.membership_plan_id WHERE ${where.join(' AND ')} ORDER BY a.attendance_date ${query.order.toUpperCase()}, a.check_in_time DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  return { items: result.rows.map(({ total_count: _total, ...row }) => row), total: result.rows[0] ? Number(result.rows[0].total_count) : 0 };
};

module.exports = { getSummary, listAttendance, listMembers, listPayments };
