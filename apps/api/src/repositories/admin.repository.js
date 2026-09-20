const { pool } = require('../db/pool');
const { resolveCanonicalPlan, calculatePortfolioMetrics } = require('../config/pricing');

// =============================================================================
// 1. ADMIN USER MANAGEMENT
// =============================================================================

const findAdminByEmail = async (email) => {
  const query = `
    SELECT id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at
    FROM admin_users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
};

const findAdminById = async (id) => {
  const query = `
    SELECT id, email, name, role, is_active, last_login_at, created_at, updated_at
    FROM admin_users
    WHERE id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

const createAdminUser = async ({ email, passwordHash, name, role = 'SUPER_ADMIN' }) => {
  const query = `
    INSERT INTO admin_users (email, password_hash, name, role, is_active, created_at, updated_at)
    VALUES (LOWER($1), $2, $3, $4, TRUE, NOW(), NOW())
    RETURNING id, email, name, role, is_active, created_at
  `;
  const result = await pool.query(query, [email, passwordHash, name, role]);
  return result.rows[0];
};

const updateAdminLastLogin = async (id) => {
  await pool.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [id]);
};

const listAdminUsers = async () => {
  const query = `
    SELECT id, email, name, role, is_active, last_login_at, created_at
    FROM admin_users
    ORDER BY created_at ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

const setAdminStatus = async (id, isActive) => {
  const query = `
    UPDATE admin_users
    SET is_active = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, name, role, is_active, updated_at
  `;
  const result = await pool.query(query, [id, Boolean(isActive)]);
  return result.rows[0] || null;
};

// =============================================================================
// 2. GYMS & MULTI-LOCATION MANAGEMENT
// =============================================================================

const listGymsAdmin = async ({
  search = '',
  status = '',
  plan = '',
  billingCycle = '',
  isMultiGym = null,
  page = 1,
  limit = 20
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ['g.deleted_at IS NULL'];
  const params = [];

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(g.name) LIKE $${params.length} OR LOWER(COALESCE(g.owner_name, '')) LIKE $${params.length} OR LOWER(COALESCE(g.email, '')) LIKE $${params.length} OR LOWER(COALESCE(g.city, '')) LIKE $${params.length})`);
  }

  if (status && status.trim()) {
    params.push(status.trim().toUpperCase());
    conditions.push(`UPPER(g.subscription_status) = $${params.length}`);
  }

  if (plan && plan.trim() && plan.trim().toUpperCase() !== 'ALL') {
    const canonical = resolveCanonicalPlan(plan.trim());
    params.push(canonical);
    conditions.push(`LOWER(g.subscription_plan) = LOWER($${params.length})`);
  }

  if (billingCycle && billingCycle.trim()) {
    params.push(billingCycle.trim().toLowerCase());
    conditions.push(`LOWER(g.billing_cycle) = $${params.length}`);
  }

  if (isMultiGym !== null && isMultiGym !== undefined && isMultiGym !== '') {
    params.push(isMultiGym === 'true' || isMultiGym === true);
    conditions.push(`g.is_multi_gym = $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM gyms g
    WHERE ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || 0, 10);

  const dataParams = [...params, parsedLimit, offset];
  const dataQuery = `
    SELECT
      g.id,
      g.name,
      g.owner_name,
      g.email,
      g.phone,
      g.city,
      g.state,
      g.subscription_plan,
      g.subscription_status,
      g.is_multi_gym,
      g.max_locations,
      g.billing_cycle,
      g.trial_started_at,
      g.trial_ends_at,
      g.subscription_start_date,
      g.subscription_end_date,
      g.is_active,
      g.created_at,
      COALESCE(m_count.count, 0) AS member_count,
      COALESCE(ws.is_enabled, false) AS whatsapp_enabled,
      COALESCE(ws.phone_number_id IS NOT NULL, false) AS whatsapp_configured,
      (SELECT MAX(created_at) FROM attendance WHERE gym_id = g.id) AS last_attendance_at,
      (SELECT MAX(created_at) FROM payments WHERE gym_id = g.id) AS last_payment_at
    FROM gyms g
    LEFT JOIN (
      SELECT gym_id, COUNT(*) AS count
      FROM members
      WHERE deleted_at IS NULL
      GROUP BY gym_id
    ) m_count ON m_count.gym_id = g.id
    LEFT JOIN whatsapp_settings ws ON ws.gym_id = g.id
    WHERE ${whereClause}
    ORDER BY g.created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const dataRes = await pool.query(dataQuery, dataParams);

  return {
    gyms: dataRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      ownerName: r.owner_name,
      email: r.email,
      phone: r.phone,
      city: r.city,
      state: r.state,
      subscriptionPlan: resolveCanonicalPlan(r.subscription_plan),
      subscriptionStatus: r.subscription_status,
      isMultiGym: Boolean(r.is_multi_gym),
      maxLocations: Number(r.max_locations || 1),
      billingCycle: r.billing_cycle,
      trialStartedAt: r.trial_started_at,
      trialEndsAt: r.trial_ends_at,
      subscriptionStartDate: r.subscription_start_date,
      subscriptionEndDate: r.subscription_end_date,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      memberCount: Number(r.member_count),
      whatsappEnabled: Boolean(r.whatsapp_enabled),
      whatsappConfigured: Boolean(r.whatsapp_configured),
      lastActivityAt: r.last_attendance_at || r.last_payment_at || r.created_at
    })),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
};

const findGymDetailAdmin = async (gymId) => {
  const gymRes = await pool.query(
    `SELECT g.*,
            ws.is_enabled AS whatsapp_enabled,
            ws.phone_number_id AS whatsapp_phone_number_id,
            ws.business_account_id AS whatsapp_business_account_id
     FROM gyms g
     LEFT JOIN whatsapp_settings ws ON ws.gym_id = g.id
     WHERE g.id = $1 AND g.deleted_at IS NULL
     LIMIT 1`,
    [gymId]
  );
  const gym = gymRes.rows[0];
  if (!gym) return null;

  // Primary owner
  const ownerRes = await pool.query(
    `SELECT id, first_name, last_name, email, phone, role, created_at
     FROM staff
     WHERE gym_id = $1 AND role = 'Owner' AND deleted_at IS NULL
     ORDER BY created_at ASC
     LIMIT 1`,
    [gymId]
  );

  // All linked locations if multi-gym or same owner
  const locationsRes = await pool.query(
    `SELECT id, name, city, address, subscription_plan, subscription_status, is_active, created_at
     FROM gyms
     WHERE owner_name = $1 AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [gym.owner_name]
  );

  // Member count
  const memberCountRes = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
            COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive
     FROM members
     WHERE gym_id = $1 AND deleted_at IS NULL`,
    [gymId]
  );

  // WhatsApp monthly usage & costs
  const waUsageRes = await pool.query(
    `SELECT
       COUNT(*) AS total_messages,
       COUNT(*) FILTER (WHERE status = 'SENT') AS sent,
       COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
       COUNT(*) FILTER (WHERE status = 'READ') AS read,
       COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
       COUNT(*) FILTER (WHERE status IN ('NOT_CONFIGURED', 'SIMULATED_UNCONFIGURED')) AS not_configured
     FROM whatsapp_logs
     WHERE gym_id = $1 AND sent_at >= date_trunc('month', CURRENT_DATE)`,
    [gymId]
  );

  // Total platform subscription revenue from this gym
  const revRes = await pool.query(
    `SELECT COALESCE(SUM(amount_paid), 0) AS total_revenue
     FROM gym_subscription_history
     WHERE gym_id = $1`,
    [gymId]
  );

  // Recent audit logs for this gym
  const auditRes = await pool.query(
    `SELECT id, admin_email, action, reason, created_at
     FROM admin_audit_logs
     WHERE gym_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [gymId]
  );

  return {
    gym: {
      id: gym.id,
      name: gym.name,
      ownerName: gym.owner_name,
      email: gym.email,
      phone: gym.phone,
      address: gym.address,
      city: gym.city,
      state: gym.state,
      pincode: gym.pincode,
      subscriptionPlan: resolveCanonicalPlan(gym.subscription_plan),
      subscriptionStatus: gym.subscription_status,
      isMultiGym: Boolean(gym.is_multi_gym),
      maxLocations: Number(gym.max_locations || 1),
      billingCycle: gym.billing_cycle,
      trialStartedAt: gym.trial_started_at,
      trialEndsAt: gym.trial_ends_at,
      subscriptionStartDate: gym.subscription_start_date,
      subscriptionEndDate: gym.subscription_end_date,
      isActive: Boolean(gym.is_active),
      createdAt: gym.created_at,
      whatsapp: {
        isEnabled: Boolean(gym.whatsapp_enabled),
        isConfigured: Boolean(gym.whatsapp_phone_number_id),
        phoneNumberIdMasked: gym.whatsapp_phone_number_id ? `***${gym.whatsapp_phone_number_id.slice(-4)}` : null
      }
    },
    owner: ownerRes.rows[0] || null,
    locations: locationsRes.rows,
    members: {
      total: Number(memberCountRes.rows[0]?.total || 0),
      active: Number(memberCountRes.rows[0]?.active || 0),
      inactive: Number(memberCountRes.rows[0]?.inactive || 0)
    },
    whatsappMonthly: {
      totalMessages: Number(waUsageRes.rows[0]?.total_messages || 0),
      sent: Number(waUsageRes.rows[0]?.sent || 0),
      delivered: Number(waUsageRes.rows[0]?.delivered || 0),
      read: Number(waUsageRes.rows[0]?.read || 0),
      failed: Number(waUsageRes.rows[0]?.failed || 0),
      notConfigured: Number(waUsageRes.rows[0]?.not_configured || 0)
    },
    totalPlatformRevenue: Number(revRes.rows[0]?.total_revenue || 0),
    recentAuditHistory: auditRes.rows
  };
};

const updateGymSubscriptionStatus = async (gymId, status, isActive) => {
  const query = `
    UPDATE gyms
    SET subscription_status = $2,
        is_active = $3,
        updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name, subscription_status, is_active, updated_at
  `;
  const result = await pool.query(query, [gymId, status, Boolean(isActive)]);
  return result.rows[0] || null;
};

const extendGymTrial = async (gymId, days = 7) => {
  const query = `
    UPDATE gyms
    SET trial_ends_at = GREATEST(CURRENT_DATE, COALESCE(trial_ends_at::date, CURRENT_DATE)) + ($2 || ' days')::interval,
        subscription_status = 'TRIAL',
        is_active = TRUE,
        updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name, trial_ends_at, subscription_status, is_active
  `;
  const result = await pool.query(query, [gymId, Number(days) || 7]);
  return result.rows[0] || null;
};

const changeGymSubscription = async (
  gymId,
  {
    plan,
    billingCycle = 'monthly',
    isMultiGym = false,
    maxLocations = 1,
    startDate = null,
    endDate = null,
    amountPaid = 0,
    eventType = 'PLAN_CHANGE',
    notes = null,
    adminId = null
  }
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE gyms
      SET subscription_plan = $2,
          billing_cycle = $3,
          is_multi_gym = $4,
          max_locations = $5,
          subscription_status = 'ACTIVE',
          is_active = TRUE,
          subscription_start_date = COALESCE($6, CURRENT_DATE),
          subscription_end_date = COALESCE($7, CURRENT_DATE + INTERVAL '1 month'),
          updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, name, subscription_plan, billing_cycle, is_multi_gym, max_locations, subscription_status, subscription_start_date, subscription_end_date
    `;
    const updateRes = await client.query(updateQuery, [
      gymId,
      plan,
      billingCycle,
      Boolean(isMultiGym),
      Number(maxLocations) || 1,
      startDate,
      endDate
    ]);

    const updatedGym = updateRes.rows[0];
    if (!updatedGym) {
      await client.query('ROLLBACK');
      return null;
    }

    // Record subscription event
    const historyQuery = `
      INSERT INTO gym_subscription_history (
        gym_id, plan, is_multi_gym, max_locations, billing_cycle,
        start_date, end_date, amount_paid, event_type, notes, created_by_admin_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, plan, start_date, end_date, amount_paid, event_type, created_at
    `;
    const historyRes = await client.query(historyQuery, [
      gymId,
      plan,
      Boolean(isMultiGym),
      Number(maxLocations) || 1,
      billingCycle,
      updatedGym.subscription_start_date,
      updatedGym.subscription_end_date,
      Number(amountPaid) || 0,
      eventType,
      notes,
      adminId
    ]);

    await client.query('COMMIT');
    return { gym: updatedGym, subscriptionEvent: historyRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const adjustGymLocationLimit = async (gymId, maxLocations) => {
  const query = `
    UPDATE gyms
    SET max_locations = $2,
        is_multi_gym = CASE WHEN $2 > 1 THEN TRUE ELSE is_multi_gym END,
        updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name, max_locations, is_multi_gym
  `;
  const result = await pool.query(query, [gymId, Math.max(1, Number(maxLocations) || 1)]);
  return result.rows[0] || null;
};

// =============================================================================
// 3. SUBSCRIPTION DIRECTORY & HISTORY
// =============================================================================

const listSubscriptionsAdmin = async ({
  plan = '',
  status = '',
  billingCycle = '',
  isMultiGym = null,
  search = '',
  page = 1,
  limit = 20
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = ['g.deleted_at IS NULL'];
  const params = [];

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(g.name) LIKE $${params.length} OR LOWER(COALESCE(g.owner_name, '')) LIKE $${params.length})`);
  }

  if (plan && plan.trim() && plan.trim().toUpperCase() !== 'ALL') {
    const canonical = resolveCanonicalPlan(plan.trim());
    params.push(canonical);
    conditions.push(`LOWER(g.subscription_plan) = LOWER($${params.length})`);
  }

  if (status && status.trim()) {
    params.push(status.trim().toUpperCase());
    conditions.push(`UPPER(g.subscription_status) = $${params.length}`);
  }

  if (billingCycle && billingCycle.trim()) {
    params.push(billingCycle.trim().toLowerCase());
    conditions.push(`LOWER(g.billing_cycle) = $${params.length}`);
  }

  if (isMultiGym !== null && isMultiGym !== undefined && isMultiGym !== '') {
    params.push(isMultiGym === 'true' || isMultiGym === true);
    conditions.push(`g.is_multi_gym = $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) AS total FROM gyms g WHERE ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || 0, 10);

  const dataParams = [...params, parsedLimit, offset];
  const query = `
    SELECT
      g.id AS gym_id,
      g.name AS gym_name,
      g.owner_name,
      g.subscription_plan,
      g.subscription_status,
      g.is_multi_gym,
      g.max_locations,
      g.billing_cycle,
      g.trial_started_at,
      g.trial_ends_at,
      g.subscription_start_date,
      g.subscription_end_date,
      GREATEST(0, (g.subscription_end_date - CURRENT_DATE)) AS days_remaining,
      (
        SELECT json_build_object(
          'id', h.id,
          'amountPaid', h.amount_paid,
          'eventType', h.event_type,
          'createdAt', h.created_at
        )
        FROM gym_subscription_history h
        WHERE h.gym_id = g.id
        ORDER BY h.created_at DESC
        LIMIT 1
      ) AS last_payment
    FROM gyms g
    WHERE ${whereClause}
    ORDER BY ${search && search.trim() ? 'g.created_at DESC' : 'g.subscription_end_date ASC NULLS LAST, g.created_at DESC'}
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const result = await pool.query(query, dataParams);

  return {
    subscriptions: result.rows.map((r) => ({
      gymId: r.gym_id,
      gymName: r.gym_name,
      ownerName: r.owner_name,
      plan: resolveCanonicalPlan(r.subscription_plan),
      status: r.subscription_status,
      isMultiGym: Boolean(r.is_multi_gym),
      locations: Number(r.max_locations || 1),
      billingCycle: r.billing_cycle,
      trialEndsAt: r.trial_ends_at,
      subscriptionStartDate: r.subscription_start_date,
      subscriptionEndDate: r.subscription_end_date,
      daysRemaining: Number(r.days_remaining),
      lastPayment: r.last_payment
    })),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
};

const listSubscriptionHistoryAdmin = async (gymId = null, limit = 50) => {
  let query = `
    SELECT
      h.id,
      h.gym_id,
      g.name AS gym_name,
      h.plan,
      h.is_multi_gym,
      h.max_locations,
      h.billing_cycle,
      h.start_date,
      h.end_date,
      h.amount_paid,
      h.event_type,
      h.notes,
      h.created_at,
      au.name AS created_by_admin_name
    FROM gym_subscription_history h
    JOIN gyms g ON g.id = h.gym_id
    LEFT JOIN admin_users au ON au.id = h.created_by_admin_id
  `;
  const params = [];
  if (gymId) {
    query += ` WHERE h.gym_id = $1`;
    params.push(gymId);
  }
  query += ` ORDER BY h.created_at DESC LIMIT $${params.length + 1}`;
  params.push(parseInt(limit, 10) || 50);

  const result = await pool.query(query, params);
  return result.rows.map((r) => ({
    id: r.id,
    gymId: r.gym_id,
    gymName: r.gym_name,
    plan: resolveCanonicalPlan(r.plan),
    isMultiGym: Boolean(r.is_multi_gym),
    maxLocations: Number(r.max_locations),
    billingCycle: r.billing_cycle,
    startDate: r.start_date,
    endDate: r.end_date,
    amountPaid: Number(r.amount_paid),
    eventType: r.event_type,
    notes: r.notes,
    createdAt: r.created_at,
    createdByAdmin: r.created_by_admin_name
  }));
};

// =============================================================================
// 4. REVENUE & MRR / ARR
// =============================================================================

const getPlatformRevenueStats = async () => {
  // Cash collected strictly from gym_subscription_history where amount_paid > 0
  const cashCheckRes = await pool.query(`
    SELECT
      COALESCE(SUM(amount_paid), 0) AS total_all_time,
      COUNT(*) FILTER (WHERE amount_paid > 0) AS positive_payment_count,
      COALESCE(SUM(amount_paid) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS current_month_cash,
      COALESCE(SUM(amount_paid) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND created_at < date_trunc('month', CURRENT_DATE)), 0) AS last_month_cash
    FROM gym_subscription_history
  `);
  const cashRow = cashCheckRes.rows[0];
  const positivePaymentCount = Number(cashRow?.positive_payment_count || 0);
  const currentMonthCash = Number(cashRow?.current_month_cash || 0);
  const lastMonthCash = Number(cashRow?.last_month_cash || 0);
  const hasRecordedCash = positivePaymentCount > 0;

  const growthPct = lastMonthCash > 0
    ? Math.round(((currentMonthCash - lastMonthCash) / lastMonthCash) * 1000) / 10
    : (currentMonthCash > 0 ? 100 : 0);

  // All active gyms to compute canonical MRR, ARR, and exact reconciled breakdowns
  const activeGymsRes = await pool.query(`
    SELECT id, name, subscription_plan, is_multi_gym, max_locations, billing_cycle
    FROM gyms
    WHERE deleted_at IS NULL AND subscription_status = 'ACTIVE' AND is_active = TRUE
  `);

  const portfolio = calculatePortfolioMetrics(activeGymsRes.rows);

  return {
    hasRecordedCash,
    currentMonthCash: hasRecordedCash ? currentMonthCash : null,
    lastMonthCash: hasRecordedCash ? lastMonthCash : null,
    growthPct,
    mrr: portfolio.mrr,
    arr: portfolio.arr,
    byPlan: portfolio.byPlan,
    byCycle: portfolio.byCycle,
    activeGyms: activeGymsRes.rows
  };
};

const getRevenueTrend = async (months = 12) => {
  // Check if any positive recorded cash exists
  const checkRes = await pool.query(`
    SELECT COUNT(*) AS count
    FROM gym_subscription_history
    WHERE amount_paid > 0
  `);
  const hasRecordedHistory = Number(checkRes.rows[0]?.count || 0) > 0;

  if (!hasRecordedHistory) {
    return {
      hasRecordedHistory: false,
      trend: []
    };
  }

  const query = `
    SELECT
      to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
      COALESCE(SUM(amount_paid), 0) AS revenue,
      COUNT(*) AS payment_count
    FROM gym_subscription_history
    WHERE created_at >= date_trunc('month', CURRENT_DATE - ($1 || ' months')::interval)
      AND amount_paid > 0
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at) ASC
  `;
  const result = await pool.query(query, [months]);
  return {
    hasRecordedHistory: true,
    trend: result.rows.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      paymentCount: Number(r.payment_count)
    }))
  };
};

// =============================================================================
// 5. USAGE & COSTS ENGINE
// =============================================================================

const listCostRules = async () => {
  const query = `
    SELECT id, provider, country_code, category, unit_cost, currency,
           effective_from, effective_to, is_active, notes, created_at
    FROM platform_whatsapp_cost_rules
    ORDER BY effective_from DESC, created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    countryCode: r.country_code,
    category: r.category,
    unitCost: Number(r.unit_cost),
    currency: r.currency,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
    isActive: Boolean(r.is_active),
    notes: r.notes,
    createdAt: r.created_at
  }));
};

const upsertCostRule = async ({
  id = null,
  provider = 'META',
  countryCode = 'IN',
  category = 'ALL',
  unitCost,
  currency = 'INR',
  effectiveFrom = null,
  effectiveTo = null,
  isActive = true,
  notes = null
}) => {
  if (id) {
    const query = `
      UPDATE platform_whatsapp_cost_rules
      SET provider = $2, country_code = $3, category = $4, unit_cost = $5,
          currency = $6, effective_from = COALESCE($7, effective_from),
          effective_to = $8, is_active = $9, notes = $10, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const res = await pool.query(query, [
      id, provider, countryCode, category, Number(unitCost),
      currency, effectiveFrom, effectiveTo, Boolean(isActive), notes
    ]);
    return res.rows[0] || null;
  }

  const query = `
    INSERT INTO platform_whatsapp_cost_rules (
      provider, country_code, category, unit_cost, currency,
      effective_from, effective_to, is_active, notes
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9)
    RETURNING *
  `;
  const res = await pool.query(query, [
    provider, countryCode, category, Number(unitCost),
    currency, effectiveFrom, effectiveTo, Boolean(isActive), notes
  ]);
  return res.rows[0];
};

const getEffectiveWhatsAppUnitCost = async () => {
  const query = `
    SELECT unit_cost
    FROM platform_whatsapp_cost_rules
    WHERE is_active = TRUE
      AND effective_from <= CURRENT_DATE
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1
  `;
  const result = await pool.query(query);
  return Number(result.rows[0]?.unit_cost || 0.1200);
};

const listOperatingCosts = async (month = null) => {
  let query = `
    SELECT c.id, c.month, c.category, c.cost_type, c.gym_id, g.name AS gym_name,
           c.provider, c.amount, c.currency, c.notes, c.created_at, au.name AS created_by_admin
    FROM platform_operating_costs c
    LEFT JOIN gyms g ON g.id = c.gym_id
    LEFT JOIN admin_users au ON au.id = c.created_by
  `;
  const params = [];
  if (month) {
    query += ` WHERE c.month = $1`;
    params.push(month);
  }
  query += ` ORDER BY c.month DESC, c.category ASC`;

  const result = await pool.query(query, params);
  return result.rows.map((r) => ({
    id: r.id,
    month: r.month,
    category: r.category,
    costType: r.cost_type,
    gymId: r.gym_id,
    gymName: r.gym_name,
    provider: r.provider,
    amount: Number(r.amount),
    currency: r.currency,
    notes: r.notes,
    createdAt: r.created_at,
    createdByAdmin: r.created_by_admin
  }));
};

const createOperatingCost = async ({
  month,
  category,
  costType = 'SHARED',
  gymId = null,
  provider,
  amount,
  currency = 'INR',
  notes = null,
  createdBy = null
}) => {
  const query = `
    INSERT INTO platform_operating_costs (
      month, category, cost_type, gym_id, provider, amount, currency, notes, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `;
  const res = await pool.query(query, [
    month, category, costType, gymId || null, provider, Number(amount) || 0, currency, notes, createdBy
  ]);
  return res.rows[0];
};

const deleteOperatingCost = async (id) => {
  const res = await pool.query(`DELETE FROM platform_operating_costs WHERE id = $1 RETURNING id`, [id]);
  return Boolean(res.rows[0]);
};

// Returns per-gym breakdown of usage, estimated whatsapp cost, subscription revenue, allocated shared cost, contribution
const getPerGymUsageAndCosts = async (month = null) => {
  const currentMonthStr = month || new Date().toISOString().slice(0, 7);
  const unitCost = await getEffectiveWhatsAppUnitCost();

  // Total shared operating costs for this month
  const sharedCostRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_shared
     FROM platform_operating_costs
     WHERE month = $1 AND cost_type = 'SHARED'`,
    [currentMonthStr]
  );
  const totalSharedCosts = Number(sharedCostRes.rows[0]?.total_shared || 0);

  // Check if real cash collections have been recorded in SaaS history
  const cashCheck = await pool.query(
    `SELECT COUNT(*) AS count FROM gym_subscription_history WHERE amount_paid > 0`
  );
  const hasRecordedCash = parseInt(cashCheck.rows[0]?.count || 0, 10) > 0;

  // Active gyms count in this month
  const activeGymsCountRes = await pool.query(
    `SELECT COUNT(*) AS count
     FROM gyms
     WHERE deleted_at IS NULL AND subscription_status = 'ACTIVE' AND is_active = TRUE`
  );
  const activeGymsCount = Math.max(1, parseInt(activeGymsCountRes.rows[0]?.count || 1, 10));
  const allocatedSharedCostPerGym = Math.round((totalSharedCosts / activeGymsCount) * 100) / 100;

  // Aggregate all gyms with their WhatsApp logs and subscription revenue for the given month
  const query = `
    SELECT
      g.id AS gym_id,
      g.name AS gym_name,
      g.subscription_plan,
      g.subscription_status,
      g.is_multi_gym,
      g.max_locations,
      g.billing_cycle,
      COALESCE(wa.attempted, 0) AS wa_attempted,
      COALESCE(wa.delivered, 0) AS wa_delivered,
      COALESCE(wa.read, 0) AS wa_read,
      COALESCE(wa.failed, 0) AS wa_failed,
      COALESCE(wa.not_configured, 0) AS wa_not_configured,
      COALESCE(rev.subscription_revenue, 0) AS subscription_revenue,
      COALESCE(direct_costs.total_direct, 0) AS direct_operating_costs
    FROM gyms g
    LEFT JOIN (
      SELECT
        gym_id,
        COUNT(*) AS attempted,
        COUNT(*) FILTER (WHERE status IN ('SENT', 'DELIVERED', 'READ')) AS delivered,
        COUNT(*) FILTER (WHERE status = 'READ') AS read,
        COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
        COUNT(*) FILTER (WHERE status IN ('NOT_CONFIGURED', 'SIMULATED_UNCONFIGURED')) AS not_configured
      FROM whatsapp_logs
      WHERE to_char(sent_at, 'YYYY-MM') = $1
      GROUP BY gym_id
    ) wa ON wa.gym_id = g.id
    LEFT JOIN (
      SELECT
        gym_id,
        COALESCE(SUM(amount_paid), 0) AS subscription_revenue
      FROM gym_subscription_history
      WHERE to_char(created_at, 'YYYY-MM') = $1
      GROUP BY gym_id
    ) rev ON rev.gym_id = g.id
    LEFT JOIN (
      SELECT
        gym_id,
        COALESCE(SUM(amount), 0) AS total_direct
      FROM platform_operating_costs
      WHERE month = $1 AND cost_type = 'DIRECT' AND gym_id IS NOT NULL
      GROUP BY gym_id
    ) direct_costs ON direct_costs.gym_id = g.id
    WHERE g.deleted_at IS NULL
    ORDER BY wa_delivered DESC, g.name ASC
  `;
  const result = await pool.query(query, [currentMonthStr]);

  return {
    month: currentMonthStr,
    unitCost,
    totalSharedCosts,
    activeGymsCount,
    allocatedSharedCostPerGym,
    hasRecordedCash,
    gyms: result.rows.map((r) => {
      const waDelivered = Number(r.wa_delivered);
      const estimatedWaCost = Math.round(waDelivered * unitCost * 100) / 100;
      const subRevenue = Number(r.subscription_revenue);
      const directCosts = Number(r.direct_operating_costs);
      const allocatedShared = r.subscription_status === 'ACTIVE' ? allocatedSharedCostPerGym : 0;
      const totalCost = Math.round((estimatedWaCost + directCosts + allocatedShared) * 100) / 100;
      const estimatedContribution = Math.round((subRevenue - totalCost) * 100) / 100;
      const marginPct = subRevenue > 0 ? Math.round((estimatedContribution / subRevenue) * 1000) / 10 : 0;

      return {
        gymId: r.gym_id,
        gymName: r.gym_name,
        subscriptionPlan: resolveCanonicalPlan(r.subscription_plan),
        subscriptionStatus: r.subscription_status,
        isMultiGym: Boolean(r.is_multi_gym),
        locations: Number(r.max_locations || 1),
        billingCycle: r.billing_cycle,
        whatsapp: {
          attempted: Number(r.wa_attempted),
          delivered: waDelivered,
          read: Number(r.wa_read),
          failed: Number(r.wa_failed),
          notConfigured: Number(r.wa_not_configured),
          estimatedCost: estimatedWaCost
        },
        financials: {
          subscriptionRevenue: subRevenue,
          estimatedWhatsAppCost: estimatedWaCost,
          directCosts,
          allocatedSharedCost: allocatedShared,
          totalDirectAndAllocatedCost: totalCost,
          estimatedGrossContribution: estimatedContribution,
          contributionMarginPct: marginPct
        }
      };
    })
  };
};

// =============================================================================
// 6. WHATSAPP OPERATIONS & FAILURE INTELLIGENCE
// =============================================================================

const getWhatsAppOperationalMetrics = async (days = 30) => {
  const summaryRes = await pool.query(
    `SELECT
       COUNT(*) AS total_messages,
       COUNT(*) FILTER (WHERE status = 'SENT') AS sent,
       COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
       COUNT(*) FILTER (WHERE status = 'READ') AS read,
       COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
       COUNT(*) FILTER (WHERE status IN ('NOT_CONFIGURED', 'SIMULATED_UNCONFIGURED')) AS not_configured
     FROM whatsapp_logs
     WHERE sent_at >= (CURRENT_DATE - ($1 || ' days')::interval)`,
    [days]
  );
  const row = summaryRes.rows[0];
  const total = Number(row?.total_messages || 0);
  const successful = Number(row?.delivered || 0) + Number(row?.read || 0) + Number(row?.sent || 0);
  const failed = Number(row?.failed || 0);

  // Failure breakdown
  const failuresRes = await pool.query(
    `SELECT
       COALESCE(error_message, 'Unknown Provider Error') AS reason,
       COUNT(*) AS count
     FROM whatsapp_logs
     WHERE status = 'FAILED' AND sent_at >= (CURRENT_DATE - ($1 || ' days')::interval)
     GROUP BY error_message
     ORDER BY count DESC
     LIMIT 10`,
    [days]
  );

  // Connection mode across gyms
  const connectionModesRes = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE ws.is_enabled = TRUE AND ws.phone_number_id IS NOT NULL) AS live_meta,
      COUNT(*) FILTER (WHERE ws.is_enabled = TRUE AND ws.phone_number_id IS NULL) AS log_only,
      COUNT(*) FILTER (WHERE ws.is_enabled = FALSE OR ws.is_enabled IS NULL) AS not_configured
    FROM gyms g
    LEFT JOIN whatsapp_settings ws ON ws.gym_id = g.id
    WHERE g.deleted_at IS NULL
  `);

  return {
    periodDays: days,
    totalMessages: total,
    sent: Number(row?.sent || 0),
    delivered: Number(row?.delivered || 0),
    read: Number(row?.read || 0),
    failed,
    notConfigured: Number(row?.not_configured || 0),
    deliveryRatePct: total > 0 ? Math.round((successful / total) * 1000) / 10 : 100,
    failureRatePct: total > 0 ? Math.round((failed / total) * 1000) / 10 : 0,
    failures: failuresRes.rows.map((f) => ({ reason: f.reason, count: Number(f.count) })),
    gymConnectionModes: {
      liveMetaApi: Number(connectionModesRes.rows[0]?.live_meta || 0),
      logOnlyMode: Number(connectionModesRes.rows[0]?.log_only || 0),
      notConfigured: Number(connectionModesRes.rows[0]?.not_configured || 0)
    }
  };
};

const listAllWhatsAppLogsAdmin = async ({
  gymId = null,
  status = null,
  event = null,
  search = '',
  page = 1,
  limit = 50
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  if (gymId) {
    params.push(gymId);
    conditions.push(`wl.gym_id = $${params.length}`);
  }

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`wl.status = $${params.length}`);
  }

  if (event) {
    params.push(event);
    conditions.push(`wl.automation_type = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(wl.phone_number) LIKE $${params.length} OR LOWER(wl.template_name) LIKE $${params.length} OR LOWER(g.name) LIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM whatsapp_logs wl
    JOIN gyms g ON g.id = wl.gym_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || 0, 10);

  const dataParams = [...params, parsedLimit, offset];
  const query = `
    SELECT
      wl.id,
      wl.gym_id,
      g.name AS gym_name,
      wl.automation_type,
      wl.template_name,
      wl.phone_number,
      wl.status,
      wl.provider_message_id,
      wl.error_message,
      wl.sent_at
    FROM whatsapp_logs wl
    JOIN gyms g ON g.id = wl.gym_id
    ${whereClause}
    ORDER BY wl.sent_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const result = await pool.query(query, dataParams);

  // Mask phone numbers: +91 98*****210
  const maskPhone = (phone) => {
    if (!phone) return 'UNKNOWN';
    const clean = String(phone).replace(/\s+/g, '');
    if (clean.length < 6) return clean;
    return `${clean.slice(0, 4)}*****${clean.slice(-3)}`;
  };

  return {
    logs: result.rows.map((r) => ({
      id: r.id,
      gymId: r.gym_id,
      gymName: r.gym_name,
      automationType: r.automation_type,
      templateName: r.template_name,
      maskedPhone: maskPhone(r.phone_number),
      status: r.status,
      providerMessageId: r.provider_message_id,
      errorMessage: r.error_message,
      sentAt: r.sent_at
    })),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
};

// =============================================================================
// 7. PLATFORM ALERTS
// =============================================================================

const listPlatformAlerts = async ({ status = '', severity = '', limit = 50 }) => {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status.toUpperCase());
    conditions.push(`pa.status = $${params.length}`);
  }

  if (severity) {
    params.push(severity.toUpperCase());
    conditions.push(`pa.severity = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit, 10) || 50);

  const query = `
    SELECT
      pa.id,
      pa.severity,
      pa.title,
      pa.description,
      pa.alert_key,
      pa.gym_id,
      g.name AS gym_name,
      pa.status,
      pa.created_at,
      pa.acknowledged_at,
      pa.resolved_at,
      au_ack.name AS acknowledged_by_name,
      au_res.name AS resolved_by_name
    FROM platform_alerts pa
    LEFT JOIN gyms g ON g.id = pa.gym_id
    LEFT JOIN admin_users au_ack ON au_ack.id = pa.acknowledged_by
    LEFT JOIN admin_users au_res ON au_res.id = pa.resolved_by
    ${whereClause}
    ORDER BY
      CASE pa.severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
      END,
      pa.created_at DESC
    LIMIT $${params.length}
  `;
  const result = await pool.query(query, params);
  return result.rows.map((r) => ({
    id: r.id,
    severity: r.severity,
    title: r.title,
    description: r.description,
    alertKey: r.alert_key,
    gymId: r.gym_id,
    gymName: r.gym_name,
    status: r.status,
    createdAt: r.created_at,
    acknowledgedAt: r.acknowledged_at,
    resolvedAt: r.resolved_at,
    acknowledgedBy: r.acknowledged_by_name,
    resolvedBy: r.resolved_by_name
  }));
};

const createAlertIfNotActive = async ({
  severity,
  title,
  description,
  alertKey,
  gymId = null,
  metadata = null
}) => {
  const query = `
    INSERT INTO platform_alerts (
      severity, title, description, alert_key, gym_id, status, metadata, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, NOW(), NOW())
    ON CONFLICT (alert_key) WHERE status = 'ACTIVE' DO UPDATE
    SET updated_at = NOW(),
        description = EXCLUDED.description
    RETURNING id, alert_key, status, created_at
  `;
  const result = await pool.query(query, [
    severity, title, description, alertKey, gymId || null, metadata ? JSON.stringify(metadata) : null
  ]);
  return result.rows[0];
};

const acknowledgeAlert = async (id, adminId) => {
  const query = `
    UPDATE platform_alerts
    SET status = 'ACKNOWLEDGED',
        acknowledged_by = $2,
        acknowledged_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id, adminId]);
  return result.rows[0] || null;
};

const resolveAlert = async (id, adminId) => {
  const query = `
    UPDATE platform_alerts
    SET status = 'RESOLVED',
        resolved_by = $2,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id, adminId]);
  return result.rows[0] || null;
};

const countActiveAlerts = async () => {
  const res = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE severity IN ('CRITICAL', 'HIGH')) AS urgent
    FROM platform_alerts
    WHERE status = 'ACTIVE'
  `);
  return {
    total: Number(res.rows[0]?.total || 0),
    urgent: Number(res.rows[0]?.urgent || 0)
  };
};

// =============================================================================
// 8. ADMIN AUDIT LOGGING
// =============================================================================

const createAuditLog = async ({
  adminUserId = null,
  adminEmail,
  action,
  entityType,
  entityId = null,
  gymId = null,
  reason = null,
  beforeState = null,
  afterState = null,
  ipAddress = null,
  userAgent = null
}) => {
  // Sanitize states to ensure no secrets or password hashes are logged
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    const forbidden = ['password', 'password_hash', 'token', 'access_token', 'jwt_secret', 'secret'];
    for (const key of Object.keys(clone)) {
      if (forbidden.some((f) => key.toLowerCase().includes(f))) {
        clone[key] = '[REDACTED]';
      }
    }
    return clone;
  };

  const query = `
    INSERT INTO admin_audit_logs (
      admin_user_id, admin_email, action, entity_type, entity_id, gym_id,
      reason, before_state, after_state, ip_address, user_agent, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    RETURNING id, action, created_at
  `;
  const result = await pool.query(query, [
    adminUserId || null,
    adminEmail,
    action,
    entityType,
    entityId ? String(entityId) : null,
    gymId || null,
    reason,
    beforeState ? JSON.stringify(sanitize(beforeState)) : null,
    afterState ? JSON.stringify(sanitize(afterState)) : null,
    ipAddress,
    userAgent
  ]);
  return result.rows[0];
};

const listAuditLogs = async ({
  action = '',
  entityType = '',
  gymId = null,
  search = '',
  page = 1,
  limit = 50
}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const params = [];

  if (action) {
    params.push(action);
    conditions.push(`al.action = $${params.length}`);
  }

  if (entityType) {
    params.push(entityType);
    conditions.push(`al.entity_type = $${params.length}`);
  }

  if (gymId) {
    params.push(gymId);
    conditions.push(`al.gym_id = $${params.length}`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(al.admin_email) LIKE $${params.length} OR LOWER(COALESCE(al.reason, '')) LIKE $${params.length} OR LOWER(COALESCE(g.name, '')) LIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM admin_audit_logs al
    LEFT JOIN gyms g ON g.id = al.gym_id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || 0, 10);

  const dataParams = [...params, parsedLimit, offset];
  const query = `
    SELECT
      al.id,
      al.admin_user_id,
      al.admin_email,
      al.action,
      al.entity_type,
      al.entity_id,
      al.gym_id,
      g.name AS gym_name,
      al.reason,
      al.before_state,
      al.after_state,
      al.ip_address,
      al.created_at
    FROM admin_audit_logs al
    LEFT JOIN gyms g ON g.id = al.gym_id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const result = await pool.query(query, dataParams);

  return {
    logs: result.rows.map((r) => ({
      id: r.id,
      adminUserId: r.admin_user_id,
      adminEmail: r.admin_email,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      gymId: r.gym_id,
      gymName: r.gym_name,
      reason: r.reason,
      beforeState: r.before_state,
      afterState: r.after_state,
      ipAddress: r.ip_address,
      createdAt: r.created_at
    })),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
};

// =============================================================================
// 9. USERS LIST (OWNERS, STAFF, MEMBERS)
// =============================================================================

const listAllUsersAdmin = async ({ role = 'ALL', search = '', gymId = null, page = 1, limit = 50 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  // We union staff (Owners & Staff) and members
  const conditions = [];
  const params = [];

  if (gymId) {
    params.push(gymId);
    conditions.push(`u.gym_id = $${params.length}`);
  }

  if (role && role !== 'ALL') {
    params.push(role);
    conditions.push(`UPPER(u.role) = UPPER($${params.length})`);
  }

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(COALESCE(u.email, '')) LIKE $${params.length} OR LOWER(COALESCE(u.phone, '')) LIKE $${params.length} OR LOWER(u.gym_name) LIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const baseUnion = `
    SELECT
      s.id,
      s.gym_id,
      g.name AS gym_name,
      CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS name,
      s.email,
      s.phone,
      s.role,
      s.is_active,
      s.created_at
    FROM staff s
    JOIN gyms g ON g.id = s.gym_id
    WHERE s.deleted_at IS NULL AND g.deleted_at IS NULL

    UNION ALL

    SELECT
      m.id,
      m.gym_id,
      g.name AS gym_name,
      CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) AS name,
      m.email,
      m.phone,
      'Member' AS role,
      m.is_active,
      m.created_at
    FROM members m
    JOIN gyms g ON g.id = m.gym_id
    WHERE m.deleted_at IS NULL AND g.deleted_at IS NULL
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM (${baseUnion}) u
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0]?.total || 0, 10);

  const dataParams = [...params, parsedLimit, offset];
  const query = `
    SELECT *
    FROM (${baseUnion}) u
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const result = await pool.query(query, dataParams);

  const maskPhone = (phone) => {
    if (!phone) return '—';
    const clean = String(phone).replace(/\s+/g, '');
    if (clean.length < 6) return clean;
    return `${clean.slice(0, 4)}*****${clean.slice(-3)}`;
  };

  return {
    users: result.rows.map((r) => ({
      id: r.id,
      gymId: r.gym_id,
      gymName: r.gym_name,
      name: r.name.trim(),
      email: r.email,
      maskedPhone: maskPhone(r.phone),
      role: r.role,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at
    })),
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1
  };
};

// =============================================================================
// 10. PLATFORM SETTINGS
// =============================================================================

const getPlatformSettings = async () => {
  const result = await pool.query('SELECT key, value, description, updated_at FROM platform_settings');
  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings;
};

const setPlatformSetting = async (key, value, description = null, adminId = null) => {
  const query = `
    INSERT INTO platform_settings (key, value, description, updated_by, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, platform_settings.description),
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    RETURNING key, value, description, updated_at
  `;
  const result = await pool.query(query, [key, JSON.stringify(value), description, adminId]);
  return result.rows[0];
};

module.exports = {
  findAdminByEmail,
  findAdminById,
  createAdminUser,
  updateAdminLastLogin,
  listAdminUsers,
  setAdminStatus,
  listGymsAdmin,
  findGymDetailAdmin,
  updateGymSubscriptionStatus,
  extendGymTrial,
  changeGymSubscription,
  adjustGymLocationLimit,
  listSubscriptionsAdmin,
  listSubscriptionHistoryAdmin,
  getPlatformRevenueStats,
  getRevenueTrend,
  listCostRules,
  upsertCostRule,
  getEffectiveWhatsAppUnitCost,
  listOperatingCosts,
  createOperatingCost,
  deleteOperatingCost,
  getPerGymUsageAndCosts,
  getWhatsAppOperationalMetrics,
  listAllWhatsAppLogsAdmin,
  listPlatformAlerts,
  createAlertIfNotActive,
  acknowledgeAlert,
  resolveAlert,
  countActiveAlerts,
  createAuditLog,
  listAuditLogs,
  listAllUsersAdmin,
  getPlatformSettings,
  setPlatformSetting
};