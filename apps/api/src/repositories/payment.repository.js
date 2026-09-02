const { pool } = require('../db/pool');

const paymentColumns = `
  p.id, p.gym_id, p.member_id, m.member_id AS member_member_id,
  p.membership_plan_id, p.payment_amount, p.discount_amount, p.tax_amount,
  p.total_amount, p.payment_method, p.payment_status, p.transaction_reference,
  p.payment_date, p.next_due_date, p.collected_by_staff_id, p.notes,
  p.created_at, p.updated_at`;

const paymentReturningColumns = `
  id, gym_id, member_id, membership_plan_id, payment_amount, discount_amount,
  tax_amount, total_amount, paid_amount, remaining_amount, payment_method, payment_status, transaction_reference,
  payment_date, next_due_date, collected_by_staff_id, notes, created_at, updated_at`;

const editablePaymentColumns = Object.freeze({
  memberId: 'member_id',
  membershipPlanId: 'membership_plan_id',
  paymentAmount: 'payment_amount',
  discountAmount: 'discount_amount',
  taxAmount: 'tax_amount',
  totalAmount: 'total_amount',
  paidAmount: 'paid_amount',
  remainingAmount: 'remaining_amount',
  paymentMethod: 'payment_method',
  paymentStatus: 'payment_status',
  transactionReference: 'transaction_reference',
  paymentDate: 'payment_date',
  nextDueDate: 'next_due_date',
  collectedByStaffId: 'collected_by_staff_id',
  notes: 'notes'
});

const findMemberForGym = async (gymId, memberId) => {
  const result = await pool.query(
    `SELECT id, member_id
     FROM members
     WHERE member_id = UPPER($1) AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [memberId, gymId]
  );

  return result.rows[0] ?? null;
};

const findMembershipPlanForGym = async (gymId, membershipPlanId) => {
  const result = await pool.query(
    `SELECT id
     FROM membership_plans
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [membershipPlanId, gymId]
  );

  return result.rows[0] ?? null;
};

const findStaffForGym = async (gymId, staffId) => {
  const result = await pool.query(
    `SELECT id
     FROM staff
     WHERE id = $1 AND gym_id = $2 AND is_active = TRUE AND deleted_at IS NULL
     LIMIT 1`,
    [staffId, gymId]
  );

  return result.rows[0] ?? null;
};

const createPayment = async ({ gymId, ...payment }) => {
  const totalAmount = Number(payment.totalAmount || 0);
  let paidAmount = payment.paidAmount !== undefined ? Number(payment.paidAmount) : (payment.paymentStatus === 'Paid' ? totalAmount : Number(payment.paymentAmount || 0));
  if (payment.paymentStatus === 'Paid') {
    paidAmount = totalAmount;
  }
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const result = await pool.query(
    `INSERT INTO payments (
      gym_id,
      member_id,
      membership_plan_id,
      payment_amount,
      discount_amount,
      tax_amount,
      total_amount,
      paid_amount,
      remaining_amount,
      payment_method,
      payment_status,
      transaction_reference,
      payment_date,
      next_due_date,
      collected_by_staff_id,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING ${paymentReturningColumns}`,
    [
      gymId,
      payment.memberId,
      payment.membershipPlanId,
      payment.paymentAmount,
      payment.discountAmount,
      payment.taxAmount,
      payment.totalAmount,
      paidAmount,
      remainingAmount,
      payment.paymentMethod,
      payment.paymentStatus,
      payment.transactionReference ?? null,
      payment.paymentDate,
      payment.nextDueDate,
      payment.collectedByStaffId,
      payment.notes ?? null
    ]
  );

  return { ...result.rows[0], member_member_id: payment.memberPublicId };
};

const listPayments = async (gymId, { page, limit, search, sortBy, order, status, period, startDate, endDate }) => {
  let resolvedStart = startDate;
  let resolvedEnd = endDate;

  if (period && period !== "all") {
    const now = new Date();
    let s = new Date(now);
    let e = new Date(now);

    if (period === "today") {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    } else if (period === "this_week" || period === "week") {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      s = new Date(now.setDate(diffToMon));
      s.setHours(0, 0, 0, 0);
      e = new Date(s);
      e.setDate(e.getDate() + 6);
      e.setHours(23, 59, 59, 999);
    } else if (period === "this_month" || period === "month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === "last_month") {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === "this_year" || period === "year") {
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    resolvedStart = s.toISOString().slice(0, 10);
    resolvedEnd = e.toISOString().slice(0, 10);
  }

  const sortColumns = {
    paymentDate: 'payment_date',
    totalAmount: 'total_amount',
    createdAt: 'created_at'
  };
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT ${paymentColumns},
            COUNT(*) OVER() AS total_count,
            SUM(p.paid_amount) OVER() AS filtered_total_revenue,
            SUM(CASE WHEN p.payment_date = CURRENT_DATE THEN p.paid_amount ELSE 0 END) OVER() AS filtered_todays_collections
     FROM payments p JOIN members m ON m.id = p.member_id
     WHERE p.gym_id = $1
       AND p.deleted_at IS NULL
       AND ($2::text IS NULL OR p.payment_status = $2)
       AND (
         $3::text IS NULL
         OR p.transaction_reference ILIKE '%' || $3 || '%'
         OR p.payment_method ILIKE '%' || $3 || '%'
         OR p.payment_status ILIKE '%' || $3 || '%'
         OR m.member_id ILIKE '%' || $3 || '%'
       )
       AND ($4::date IS NULL OR p.payment_date >= $4::date)
       AND ($5::date IS NULL OR p.payment_date <= $5::date)
     ORDER BY p.${sortColumns[sortBy] || 'payment_date'} ${order ? order.toUpperCase() : 'DESC'}
     LIMIT $6 OFFSET $7`,
    [gymId, status ?? null, search ?? null, resolvedStart ?? null, resolvedEnd ?? null, limit, offset]
  );

  const firstRow = result.rows[0];
  const summary = {
    totalRevenue: firstRow ? Number(firstRow.filtered_total_revenue || 0) : 0,
    todaysCollections: firstRow ? Number(firstRow.filtered_todays_collections || 0) : 0
  };

  return {
    items: result.rows.map(({ total_count: _t, filtered_total_revenue: _r, filtered_todays_collections: _c, ...payment }) => payment),
    total: firstRow ? Number(firstRow.total_count) : 0,
    summary
  };
};

const findPaymentById = async (gymId, paymentId) => {
  const result = await pool.query(
    `SELECT ${paymentColumns}
     FROM payments p JOIN members m ON m.id = p.member_id
     WHERE p.id = $1 AND p.gym_id = $2 AND p.deleted_at IS NULL
     LIMIT 1`,
    [paymentId, gymId]
  );

  return result.rows[0] ?? null;
};

const updatePaymentById = async (gymId, paymentId, changes) => {
  const updates = Object.entries(changes)
    .filter(([field, value]) => editablePaymentColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editablePaymentColumns[field], value }));
  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(paymentId, gymId);

  const result = await pool.query(
    `UPDATE payments
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length - 1}
       AND gym_id = $${values.length}
       AND deleted_at IS NULL
     RETURNING ${paymentReturningColumns}`,
    values
  );

  return result.rows[0] ?? null;
};

const softDeletePayment = async (gymId, paymentId) => {
  const result = await pool.query(
    `UPDATE payments
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [paymentId, gymId]
  );

  return result.rows[0] ?? null;
};

const getOutstandingPayments = async (gymId) => {
  const query = `
    SELECT 
      m.id AS id,
      m.member_id AS member_id,
      m.first_name,
      m.last_name,
      m.phone,
      m.join_date,
      m.expiry_date,
      m.is_active,
      mp.plan_name,
      COALESCE(p.total_amount, mp.price, 0) AS total_amount,
      COALESCE(p.paid_amount, CASE WHEN p.payment_status = 'Paid' THEN p.total_amount ELSE 0 END) AS paid_amount,
      COALESCE(p.remaining_amount, CASE WHEN p.payment_status = 'Paid' THEN 0 ELSE p.total_amount END) AS remaining_amount,
      p.payment_date AS last_payment_date,
      p.payment_status
    FROM members m
    LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
    LEFT JOIN LATERAL (
      SELECT id, total_amount, paid_amount, remaining_amount, payment_date, payment_status
      FROM payments
      WHERE member_id = m.id AND gym_id = $1 AND deleted_at IS NULL
      ORDER BY payment_date DESC, created_at DESC
      LIMIT 1
    ) p ON TRUE
    WHERE m.gym_id = $1 
      AND m.deleted_at IS NULL
      AND (
        p.remaining_amount > 0 
        OR p.payment_status = 'Partial' 
        OR p.payment_status = 'Unpaid'
        OR p.id IS NULL
      )
    ORDER BY COALESCE(p.remaining_amount, mp.price, 0) DESC, m.expiry_date ASC
  `;
  const result = await pool.query(query, [gymId]);
  
  const members = result.rows.map((row) => {
    const totalAmount = Number(row.total_amount);
    const paidAmount = Number(row.paid_amount);
    const remainingAmount = Number(row.remaining_amount);
    return {
      id: row.id,
      memberId: row.member_id,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      phone: row.phone,
      planName: row.plan_name ?? 'N/A',
      totalAmount,
      paidAmount,
      remainingAmount,
      lastPaymentDate: row.last_payment_date,
      expiryDate: row.expiry_date,
      isActive: row.is_active,
      paymentStatus: row.payment_status ?? 'Unpaid'
    };
  });

  const totalOutstanding = members.reduce((sum, m) => sum + m.remainingAmount, 0);
  const pendingCount = members.length;

  return {
    summary: {
      totalOutstanding,
      pendingCount
    },
    members
  };
};

module.exports = {
  createPayment,
  findMemberForGym,
  findMembershipPlanForGym,
  findPaymentById,
  findStaffForGym,
  getOutstandingPayments,
  listPayments,
  softDeletePayment,
  updatePaymentById
};
