const { pool } = require('../db/pool');

const listClassPlans = async (gymId, classId = null) => {
  const query = `
    SELECT 
      cp.id, cp.gym_id, cp.class_id, cp.name, cp.description, cp.price,
      cp.billing_period, cp.session_limit, cp.is_unlimited, cp.is_active,
      cp.allowed_class_ids, cp.allowed_categories, cp.created_at,
      c.name AS class_name, c.category AS class_category,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM class_memberships cm
          WHERE cm.class_plan_id = cp.id AND cm.gym_id = $1 AND cm.status = 'Active'
        ), 0
      ) AS active_subscribers,
      COALESCE(
        (
          SELECT SUM(paid_amount)
          FROM class_payments cpay
          WHERE cpay.class_plan_id = cp.id AND cpay.gym_id = $1
        ), 0
      ) AS total_revenue
    FROM class_plans cp
    JOIN classes c ON c.id = cp.class_id
    WHERE cp.gym_id = $1 
      AND ($2::uuid IS NULL OR cp.class_id = $2)
      AND cp.deleted_at IS NULL
    ORDER BY cp.created_at DESC
  `;
  const result = await pool.query(query, [gymId, classId ?? null]);
  return result.rows.map((r) => ({
    id: r.id,
    gymId: r.gym_id,
    classId: r.class_id,
    className: r.class_name,
    classCategory: r.class_category,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    billingPeriod: r.billing_period,
    sessionLimit: r.session_limit ? Number(r.session_limit) : null,
    isUnlimited: r.is_unlimited,
    isActive: r.is_active,
    allowedClassIds: r.allowed_class_ids ?? [r.class_id],
    allowedCategories: r.allowed_categories ?? [r.class_category],
    activeSubscribers: Number(r.active_subscribers),
    totalRevenue: Number(r.total_revenue),
    createdAt: r.created_at
  }));
};

const findClassPlanById = async (gymId, planId) => {
  const query = `
    SELECT 
      cp.id, cp.gym_id, cp.class_id, cp.name, cp.description, cp.price,
      cp.billing_period, cp.session_limit, cp.is_unlimited, cp.is_active,
      cp.allowed_class_ids, cp.allowed_categories, cp.created_at,
      c.name AS class_name, c.category AS class_category
    FROM class_plans cp
    JOIN classes c ON c.id = cp.class_id
    WHERE cp.id = $1 AND cp.gym_id = $2 AND cp.deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [planId, gymId]);
  if (!result.rows[0]) return null;

  const r = result.rows[0];
  return {
    id: r.id,
    gymId: r.gym_id,
    classId: r.class_id,
    className: r.class_name,
    classCategory: r.class_category,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    billingPeriod: r.billing_period,
    sessionLimit: r.session_limit ? Number(r.session_limit) : null,
    isUnlimited: r.is_unlimited,
    isActive: r.is_active,
    allowedClassIds: r.allowed_class_ids ?? [r.class_id],
    allowedCategories: r.allowed_categories ?? [r.class_category],
    createdAt: r.created_at
  };
};

const createClassPlan = async (gymId, payload) => {
  const allowedIds = payload.allowedClassIds && Array.isArray(payload.allowedClassIds) && payload.allowedClassIds.length > 0
    ? payload.allowedClassIds
    : [payload.classId];

  const allowedCats = payload.allowedCategories && Array.isArray(payload.allowedCategories)
    ? payload.allowedCategories
    : null;

  const query = `
    INSERT INTO class_plans (
      gym_id, class_id, name, description, price,
      billing_period, session_limit, is_unlimited, is_active,
      allowed_class_ids, allowed_categories
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
  `;
  const res = await pool.query(query, [
    gymId,
    payload.classId,
    payload.name,
    payload.description ?? null,
    payload.price,
    payload.billingPeriod ?? 'Monthly',
    payload.sessionLimit ?? null,
    payload.isUnlimited ?? false,
    payload.isActive ?? true,
    allowedIds,
    allowedCats
  ]);

  return findClassPlanById(gymId, res.rows[0].id);
};

const updateClassPlan = async (gymId, planId, payload) => {
  const query = `
    UPDATE class_plans
    SET name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        billing_period = COALESCE($4, billing_period),
        session_limit = COALESCE($5, session_limit),
        is_unlimited = COALESCE($6, is_unlimited),
        is_active = COALESCE($7, is_active),
        allowed_class_ids = COALESCE($8, allowed_class_ids),
        allowed_categories = COALESCE($9, allowed_categories),
        updated_at = NOW()
    WHERE id = $10 AND gym_id = $11 AND deleted_at IS NULL
    RETURNING id
  `;
  const res = await pool.query(query, [
    payload.name,
    payload.description,
    payload.price,
    payload.billingPeriod,
    payload.sessionLimit,
    payload.isUnlimited,
    payload.isActive,
    payload.allowedClassIds ?? null,
    payload.allowedCategories ?? null,
    planId,
    gymId
  ]);
  if (!res.rows[0]) return null;
  return findClassPlanById(gymId, planId);
};

const softDeleteClassPlan = async (gymId, planId) => {
  const query = `
    UPDATE class_plans
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
    RETURNING id
  `;
  const res = await pool.query(query, [planId, gymId]);
  return res.rows[0] ?? null;
};

module.exports = {
  createClassPlan,
  findClassPlanById,
  listClassPlans,
  softDeleteClassPlan,
  updateClassPlan
};
