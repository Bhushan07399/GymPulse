const { pool } = require('../db/pool');

const memberColumns = `
  id,
  member_id,
  gym_id,
  membership_plan_id,
  first_name,
  last_name,
  gender,
  date_of_birth,
  phone,
  email,
  emergency_contact,
  address,
  join_date,
  expiry_date,
  left_date,
  cancellation_reason,
  qr_code,
  profile_photo_url,
  medical_notes,
  is_active,
  created_at,
  updated_at`;

const editableMemberColumns = Object.freeze({
  membershipPlanId: 'membership_plan_id',
  firstName: 'first_name',
  lastName: 'last_name',
  gender: 'gender',
  dateOfBirth: 'date_of_birth',
  phone: 'phone',
  email: 'email',
  emergencyContact: 'emergency_contact',
  address: 'address',
  joinDate: 'join_date',
  expiryDate: 'expiry_date',
  leftDate: 'left_date',
  cancellationReason: 'cancellation_reason',
  qrCode: 'qr_code',
  profilePhotoUrl: 'profile_photo_url',
  medicalNotes: 'medical_notes',
  isActive: 'is_active'
});

const generateGymMemberPrefix = (gymName) => {
  if (!gymName || !String(gymName).trim()) return 'GP';
  const words = String(gymName)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words[0].length >= 3) {
    return words[0].slice(0, 3).toUpperCase();
  } else {
    return words[0].toUpperCase().padEnd(2, 'P');
  }
};

const generateNextMemberId = async (gymId, client = pool) => {
  const gymRes = await client.query('SELECT name FROM gyms WHERE id = $1 LIMIT 1', [gymId]);
  const gymName = gymRes.rows[0]?.name || 'GymPulse';
  const prefix = generateGymMemberPrefix(gymName);

  const query = `
    SELECT member_id
    FROM members
    WHERE gym_id = $1
    ORDER BY created_at DESC
    LIMIT 200
  `;
  const result = await client.query(query, [gymId]);

  let maxNum = 0;
  for (const row of result.rows) {
    if (!row.member_id) continue;
    const parts = String(row.member_id).split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  const nextSeq = String(maxNum + 1).padStart(4, '0');
  return `${prefix}-${nextSeq}`;
};

const findMembershipPlanForGym = async (gymId, membershipPlanId) => {
  const result = await pool.query(
    `SELECT id, plan_name, duration_in_days, price
     FROM membership_plans
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [membershipPlanId, gymId]
  );

  return result.rows[0] ?? null;
};

const createMemberWithPayment = async ({ gymId, staffId, member, plan, paymentInfo }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const publicMemberId = await generateNextMemberId(gymId, client);
    const qrCode = `${gymId}_${publicMemberId}_${Date.now()}`;

    const memberInsertQuery = `
      INSERT INTO members (
        gym_id,
        membership_plan_id,
        member_id,
        first_name,
        last_name,
        gender,
        date_of_birth,
        phone,
        email,
        emergency_contact,
        address,
        join_date,
        expiry_date,
        qr_code,
        profile_photo_url,
        medical_notes,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING ${memberColumns}
    `;

    const memberResult = await client.query(memberInsertQuery, [
      gymId,
      plan.id,
      publicMemberId,
      member.firstName,
      member.lastName,
      member.gender || 'Male',
      member.dateOfBirth || member.joinDate,
      member.phone,
      member.email || `${publicMemberId.toLowerCase()}@gympulse.local`,
      member.emergencyContact || member.phone,
      member.address || 'Gym Address',
      member.joinDate,
      member.expiryDate,
      qrCode,
      member.profilePhotoUrl || null,
      member.medicalNotes || null,
      member.isActive ?? true
    ]);

    const createdMember = memberResult.rows[0];

    // Calculate Payment Amounts & Status
    const totalAmount = Number(plan.price);
    let paidAmount = 0;
    let paymentStatus = 'Pending';

    if (paymentInfo.paymentStatus === 'Paid') {
      paidAmount = totalAmount;
      paymentStatus = 'Paid';
    } else if (paymentInfo.paymentStatus === 'Partial') {
      paidAmount = Number(paymentInfo.amountPaid || 0);
      paymentStatus = 'Partial';
    } else {
      paidAmount = 0;
      paymentStatus = 'Unpaid';
    }

    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // Fetch staff ID if not provided
    let effectiveStaffId = staffId;
    if (!effectiveStaffId) {
      const staffRes = await client.query(
        "SELECT id FROM staff WHERE gym_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1",
        [gymId]
      );
      effectiveStaffId = staffRes.rows[0]?.id;
    }

    if (effectiveStaffId) {
      const paymentInsertQuery = `
        INSERT INTO payments (
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
        VALUES ($1, $2, $3, $4, 0, 0, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, total_amount, paid_amount, remaining_amount, payment_status, payment_date
      `;

      await client.query(paymentInsertQuery, [
        gymId,
        createdMember.id,
        plan.id,
        totalAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentInfo.paymentMethod || 'Cash',
        paymentStatus,
        `TXN-${publicMemberId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        member.joinDate,
        member.expiryDate,
        effectiveStaffId,
        `Initial payment during registration (${paymentInfo.paymentStatus})`
      ]);
    }

    await client.query('COMMIT');
    return createdMember;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createMember = async ({ gymId, ...member }) => {
  const plan = await findMembershipPlanForGym(gymId, member.membershipPlanId);
  return createMemberWithPayment({
    gymId,
    staffId: null,
    member,
    plan,
    paymentInfo: {
      paymentStatus: member.paymentStatus || 'Paid',
      amountPaid: member.amountPaid,
      paymentMethod: member.paymentMethod
    }
  });
};

const listMembers = async (gymId, { page, limit, search, sortBy, order, status }) => {
  const sortColumns = {
    createdAt: 'created_at',
    firstName: 'first_name',
    expiryDate: 'expiry_date'
  };
  const statusFilters = {
    active: 'is_active = TRUE AND expiry_date >= CURRENT_DATE',
    inactive: 'is_active = FALSE',
    expired: 'expiry_date < CURRENT_DATE'
  };
  const offset = (page - 1) * limit;
  const statusFilter = status ? `AND ${statusFilters[status]}` : '';
  const result = await pool.query(
    `SELECT ${memberColumns}, COUNT(*) OVER() AS total_count
     FROM members
     WHERE gym_id = $1
       AND deleted_at IS NULL
       ${statusFilter}
       AND (
         $2::text IS NULL
         OR first_name ILIKE '%' || $2 || '%'
         OR last_name ILIKE '%' || $2 || '%'
         OR member_id ILIKE '%' || $2 || '%'
         OR email ILIKE '%' || $2 || '%'
         OR phone ILIKE '%' || $2 || '%'
         OR qr_code ILIKE '%' || $2 || '%'
       )
     ORDER BY ${sortColumns[sortBy]} ${order.toUpperCase()}
     LIMIT $3 OFFSET $4`,
    [gymId, search ?? null, limit, offset]
  );

  return {
    items: result.rows.map(({ total_count: _totalCount, ...member }) => member),
    total: result.rows[0] ? Number(result.rows[0].total_count) : 0
  };
};

const findMemberById = async (gymId, memberId) => {
  const result = await pool.query(
    `SELECT ${memberColumns}
     FROM members
     WHERE (id::text = $1 OR member_id = UPPER($1))
       AND gym_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [memberId, gymId]
  );

  return result.rows[0] ?? null;
};

const updateMemberById = async (gymId, memberId, changes) => {
  const updates = Object.entries(changes)
    .filter(([field, value]) => editableMemberColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editableMemberColumns[field], value }));
  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(memberId, gymId);

  const result = await pool.query(
    `UPDATE members
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length - 1}
       AND gym_id = $${values.length}
       AND deleted_at IS NULL
     RETURNING ${memberColumns}`,
    values
  );

  return result.rows[0] ?? null;
};

const softDeleteMember = async (gymId, memberId) => {
  const result = await pool.query(
    `UPDATE members
     SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [memberId, gymId]
  );

  return result.rows[0] ?? null;
};

module.exports = {
  createMember,
  createMemberWithPayment,
  findMemberById,
  findMembershipPlanForGym,
  generateNextMemberId,
  listMembers,
  softDeleteMember,
  updateMemberById
};
