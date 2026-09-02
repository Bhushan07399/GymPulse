const { pool } = require('../db/pool');

const membershipPlanColumns = `
  id,
  gym_id,
  plan_name,
  duration_in_days,
  price,
  description,
  is_active,
  created_at,
  updated_at`;

const createMembershipPlan = async ({
  gymId,
  planName,
  durationInDays,
  price,
  description,
  isActive
}) => {
  const result = await pool.query(
    `INSERT INTO membership_plans (
      gym_id,
      plan_name,
      duration_in_days,
      price,
      description,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      gym_id,
      plan_name,
      duration_in_days,
      price,
      description,
      is_active,
      created_at,
      updated_at`,
    [gymId, planName, durationInDays, price, description, isActive]
  );

  return result.rows[0];
};

const editableMembershipPlanColumns = Object.freeze({
  planName: 'plan_name',
  durationInDays: 'duration_in_days',
  price: 'price',
  description: 'description',
  isActive: 'is_active'
});

const listMembershipPlans = async (gymId, { page, limit, search, sortBy, order, status }) => {
  const sortColumns = {
    createdAt: 'created_at',
    planName: 'plan_name',
    durationInDays: 'duration_in_days',
    price: 'price'
  };
  const offset = (page - 1) * limit;
  const statusFilter = status
    ? `AND is_active = ${status === 'active' ? 'TRUE' : 'FALSE'}`
    : '';
  const result = await pool.query(
    `SELECT ${membershipPlanColumns}, COUNT(*) OVER() AS total_count
     FROM membership_plans
     WHERE gym_id = $1
       AND deleted_at IS NULL
       ${statusFilter}
       AND (
         $2::text IS NULL
         OR plan_name ILIKE '%' || $2 || '%'
         OR description ILIKE '%' || $2 || '%'
       )
     ORDER BY ${sortColumns[sortBy]} ${order.toUpperCase()}
     LIMIT $3 OFFSET $4`,
    [gymId, search ?? null, limit, offset]
  );

  return {
    items: result.rows.map(({ total_count: _totalCount, ...plan }) => plan),
    total: result.rows[0] ? Number(result.rows[0].total_count) : 0
  };
};

const updateMembershipPlanById = async (gymId, planId, changes) => {
  const updates = Object.entries(changes)
    .filter(([field, value]) => editableMembershipPlanColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editableMembershipPlanColumns[field], value }));
  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(planId, gymId);

  const result = await pool.query(
    `UPDATE membership_plans
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length - 1}
       AND gym_id = $${values.length}
       AND deleted_at IS NULL
     RETURNING ${membershipPlanColumns}`,
    values
  );

  return result.rows[0] ?? null;
};

const softDeleteMembershipPlan = async (gymId, planId) => {
  const result = await pool.query(
    `UPDATE membership_plans
     SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [planId, gymId]
  );

  return result.rows[0] ?? null;
};

module.exports = {
  createMembershipPlan,
  listMembershipPlans,
  softDeleteMembershipPlan,
  updateMembershipPlanById
};
