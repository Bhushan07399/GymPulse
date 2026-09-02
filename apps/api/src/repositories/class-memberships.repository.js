const { pool } = require('../db/pool');

const enrollClassMembership = async (gymId, memberId, classPlanId, paymentData = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get Class Plan details
    const planRes = await client.query(
      `SELECT cp.id, cp.class_id, cp.price, cp.billing_period, cp.session_limit, cp.is_unlimited
       FROM class_plans cp
       WHERE cp.id = $1 AND cp.gym_id = $2 AND cp.deleted_at IS NULL`,
      [classPlanId, gymId]
    );

    if (!planRes.rows[0]) throw new Error('Class plan not found');
    const plan = planRes.rows[0];

    // Compute Expiry Date based on billing period
    const startDate = paymentData.startDate || new Date().toISOString().split('T')[0];
    const expiry = new Date(startDate);
    if (plan.billing_period === 'Quarterly') {
      expiry.setMonth(expiry.getMonth() + 3);
    } else if (plan.billing_period === 'Yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    const expiryDate = expiry.toISOString().split('T')[0];

    // Create class_memberships record
    const membershipRes = await client.query(
      `INSERT INTO class_memberships (
        gym_id, member_id, class_id, class_plan_id, start_date, expiry_date, status, sessions_allowed, sessions_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Active', $7, 0)
      RETURNING id, gym_id, member_id, class_id, class_plan_id, start_date, expiry_date, status, sessions_allowed, sessions_used`,
      [
        gymId,
        memberId,
        plan.class_id,
        classPlanId,
        startDate,
        expiryDate,
        plan.is_unlimited ? null : plan.session_limit
      ]
    );

    const createdMembership = membershipRes.rows[0];

    // Calculate Payment Amounts
    const totalAmount = Number(paymentData.totalAmount ?? plan.price);
    const paidAmount = Number(paymentData.paidAmount ?? totalAmount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    let paymentStatus = 'Paid';
    if (remainingAmount > 0 && paidAmount > 0) paymentStatus = 'Partial';
    if (paidAmount === 0 && totalAmount > 0) paymentStatus = 'Unpaid';

    const receiptNumber = paymentData.receiptNumber || `CPAY-${Date.now().toString().slice(-6)}`;

    // Create class_payments record
    const paymentRes = await client.query(
      `INSERT INTO class_payments (
        gym_id, member_id, class_id, class_plan_id, class_membership_id,
        total_amount, paid_amount, remaining_amount, payment_date, payment_method, payment_status, receipt_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, total_amount, paid_amount, remaining_amount, payment_date, payment_method, payment_status, receipt_number`,
      [
        gymId,
        memberId,
        plan.class_id,
        classPlanId,
        createdMembership.id,
        totalAmount,
        paidAmount,
        remainingAmount,
        startDate,
        paymentData.paymentMethod || 'Cash',
        paymentStatus,
        receiptNumber,
        paymentData.notes || null
      ]
    );

    await client.query('COMMIT');

    return {
      membership: createdMembership,
      payment: paymentRes.rows[0]
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const listMemberClassMemberships = async (gymId, memberId) => {
  const query = `
    SELECT 
      cm.id AS membership_id,
      cm.start_date,
      cm.expiry_date,
      cm.status AS membership_status,
      cm.sessions_allowed,
      cm.sessions_used,
      c.id AS class_id,
      c.name AS class_name,
      c.category AS class_category,
      c.instructor_name,
      cp.id AS plan_id,
      cp.name AS plan_name,
      cp.price AS plan_price,
      cp.billing_period,
      cp.is_unlimited
    FROM class_memberships cm
    JOIN classes c ON c.id = cm.class_id
    JOIN class_plans cp ON cp.id = cm.class_plan_id
    WHERE cm.gym_id = $1 AND cm.member_id = $2 AND cm.status = 'Active'
    ORDER BY cm.expiry_date DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows.map((r) => ({
    membershipId: r.membership_id,
    startDate: r.start_date,
    expiryDate: r.expiry_date,
    membershipStatus: r.membership_status,
    sessionsAllowed: r.sessions_allowed ? Number(r.sessions_allowed) : null,
    sessionsUsed: Number(r.sessions_used),
    classId: r.class_id,
    className: r.class_name,
    classCategory: r.class_category,
    instructorName: r.instructor_name,
    planId: r.plan_id,
    planName: r.plan_name,
    planPrice: Number(r.plan_price),
    billingPeriod: r.billing_period,
    isUnlimited: r.is_unlimited
  }));
};

const listClassOutstandingDues = async (gymId) => {
  const query = `
    SELECT 
      cp.id AS payment_id,
      cp.total_amount,
      cp.paid_amount,
      cp.remaining_amount,
      cp.payment_date,
      cp.payment_status,
      cp.payment_method,
      cp.receipt_number,
      m.id AS member_uuid,
      m.member_id,
      m.first_name,
      m.last_name,
      m.phone,
      c.name AS class_name,
      cplan.name AS plan_name,
      cm.expiry_date
    FROM class_payments cp
    JOIN members m ON m.id = cp.member_id
    JOIN classes c ON c.id = cp.class_id
    LEFT JOIN class_plans cplan ON cplan.id = cp.class_plan_id
    LEFT JOIN class_memberships cm ON cm.id = cp.class_membership_id
    WHERE cp.gym_id = $1 AND cp.remaining_amount > 0
    ORDER BY cp.payment_date DESC
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows.map((r) => ({
    paymentId: r.payment_id,
    totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount),
    remainingAmount: Number(r.remaining_amount),
    paymentDate: r.payment_date,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    receiptNumber: r.receipt_number,
    memberUuid: r.member_uuid,
    memberId: r.member_id,
    memberName: `${r.first_name} ${r.last_name}`,
    memberPhone: r.phone,
    className: r.class_name,
    planName: r.plan_name || 'Class Fee',
    expiryDate: r.expiry_date
  }));
};

const recordClassDuesPayment = async (gymId, paymentId, amountPaid, paymentMethod = 'Cash') => {
  const findQuery = `
    SELECT id, total_amount, paid_amount, remaining_amount
    FROM class_payments
    WHERE id = $1 AND gym_id = $2
  `;
  const findRes = await pool.query(findQuery, [paymentId, gymId]);
  if (!findRes.rows[0]) throw new Error('Class payment record not found');

  const p = findRes.rows[0];
  const newPaid = Number(p.paid_amount) + Number(amountPaid);
  const newRemaining = Math.max(0, Number(p.total_amount) - newPaid);
  const newStatus = newRemaining === 0 ? 'Paid' : 'Partial';

  const updateQuery = `
    UPDATE class_payments
    SET paid_amount = $1,
        remaining_amount = $2,
        payment_status = $3,
        payment_method = $4,
        updated_at = NOW()
    WHERE id = $5 AND gym_id = $6
    RETURNING id, total_amount, paid_amount, remaining_amount, payment_status
  `;
  const res = await pool.query(updateQuery, [newPaid, newRemaining, newStatus, paymentMethod, paymentId, gymId]);
  return res.rows[0];
};

const listMemberClassPayments = async (gymId, memberId) => {
  const query = `
    SELECT 
      cpay.id AS payment_id,
      cpay.total_amount,
      cpay.paid_amount,
      cpay.remaining_amount,
      cpay.payment_date,
      cpay.payment_method,
      cpay.payment_status,
      cpay.receipt_number,
      c.name AS class_name,
      cplan.name AS plan_name
    FROM class_payments cpay
    JOIN classes c ON c.id = cpay.class_id
    LEFT JOIN class_plans cplan ON cplan.id = cpay.class_plan_id
    WHERE cpay.gym_id = $1 AND cpay.member_id = $2
    ORDER BY cpay.payment_date DESC
  `;
  const res = await pool.query(query, [gymId, memberId]);
  return res.rows.map((r) => ({
    paymentId: r.payment_id,
    totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount),
    remainingAmount: Number(r.remaining_amount),
    paymentDate: r.payment_date,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    receiptNumber: r.receipt_number,
    className: r.class_name,
    planName: r.plan_name || 'Class Plan',
    paymentType: 'Class'
  }));
};

module.exports = {
  enrollClassMembership,
  listClassMemberships: listMemberClassMemberships,
  listClassOutstandingDues,
  listMemberClassPayments,
  recordClassDuesPayment
};
