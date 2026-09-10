const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { env } = require('../config/env');
const { calculateSubscriptionPrice, resolveCanonicalPlan, CANONICAL_PLANS } = require('../config/pricing');
const adminRepository = require('../repositories/admin.repository');
const { AppError } = require('../utils/app-error');

// =============================================================================
// 1. ADMIN AUTHENTICATION
// =============================================================================

const loginSuperAdmin = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError(400, 'Email and password are required.');
  }

  const admin = await adminRepository.findAdminByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    throw new AppError(401, 'Invalid admin email or password.');
  }

  if (admin.is_active !== true) {
    throw new AppError(403, 'Super Admin account is deactivated. Contact platform management.');
  }

  await adminRepository.updateAdminLastLogin(admin.id);

  const token = jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'SUPER_ADMIN',
      type: 'SUPER_ADMIN'
    },
    env.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLoginAt: admin.last_login_at
    },
    token
  };
};

// =============================================================================
// 2. DASHBOARD & OVERVIEW
// =============================================================================

const getDashboardOverview = async () => {
  // 1. Gyms counts
  const gymsCountsRes = await pool.query(`
    SELECT
      COUNT(*) AS total_gyms,
      COUNT(*) FILTER (WHERE subscription_status = 'ACTIVE' AND is_active = TRUE) AS active_gyms,
      COUNT(*) FILTER (WHERE subscription_status = 'TRIAL') AS trial_gyms,
      COUNT(*) FILTER (WHERE subscription_status = 'EXPIRED') AS expired_gyms,
      COUNT(*) FILTER (WHERE subscription_status = 'SUSPENDED' OR is_active = FALSE) AS suspended_gyms,
      COALESCE(SUM(max_locations), COUNT(*)) AS total_locations,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS new_gyms_this_month
    FROM gyms
    WHERE deleted_at IS NULL
  `);
  const gymsRow = gymsCountsRes.rows[0];

  // 2. Total members
  const memberTotalRes = await pool.query(`SELECT COUNT(*) AS total FROM members WHERE deleted_at IS NULL`);
  const totalMembers = Number(memberTotalRes.rows[0]?.total || 0);

  // 3. Platform Revenue & Normalized MRR / ARR
  const revStats = await adminRepository.getPlatformRevenueStats();
  const totalMRR = revStats.mrr;
  const totalARR = revStats.arr;

  // 4. WhatsApp monthly usage and estimated cost
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const usageStats = await adminRepository.getPerGymUsageAndCosts(currentMonthStr);

  let totalWhatsAppCostThisMonth = 0;
  let totalWhatsAppMessagesThisMonth = 0;
  let totalWhatsAppFailedThisMonth = 0;
  for (const g of usageStats.gyms) {
    totalWhatsAppCostThisMonth += g.whatsapp.estimatedCost;
    totalWhatsAppMessagesThisMonth += g.whatsapp.attempted;
    totalWhatsAppFailedThisMonth += g.whatsapp.failed;
  }
  totalWhatsAppCostThisMonth = Math.round(totalWhatsAppCostThisMonth * 100) / 100;

  // 5. Operating Costs this month
  const totalOperatingCostsThisMonth = usageStats.totalSharedCosts;
  const totalEstimatedCostsThisMonth = Math.round((totalWhatsAppCostThisMonth + totalOperatingCostsThisMonth) * 100) / 100;

  // 6. Estimated Gross Contribution
  const currentRevenue = revStats.currentMonthCash;
  const estimatedGrossContribution = Math.round((currentRevenue - totalEstimatedCostsThisMonth) * 100) / 100;
  const contributionMarginPct = currentRevenue > 0
    ? Math.round((estimatedGrossContribution / currentRevenue) * 1000) / 10
    : 0;

  // 7. Trial -> Paid conversion % & Churn %
  const conversionRes = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE trial_started_at IS NOT NULL) AS total_trials,
      COUNT(*) FILTER (WHERE trial_started_at IS NOT NULL AND subscription_status = 'ACTIVE') AS converted_trials,
      COUNT(*) FILTER (WHERE subscription_status = 'EXPIRED') AS churned_gyms,
      COUNT(*) AS total_ever_gyms
    FROM gyms
    WHERE deleted_at IS NULL
  `);
  const convRow = conversionRes.rows[0];
  const totalTrials = Number(convRow?.total_trials || 0);
  const convertedTrials = Number(convRow?.converted_trials || 0);
  const churnedGyms = Number(convRow?.churned_gyms || 0);
  const totalEver = Number(convRow?.total_ever_gyms || 0);

  const trialConversionRatePct = totalTrials > 0 ? Math.round((convertedTrials / totalTrials) * 1000) / 10 : 0;
  const churnRatePct = totalEver > 0 ? Math.round((churnedGyms / totalEver) * 1000) / 10 : 0;

  // 8. Alerts
  const alertStats = await adminRepository.countActiveAlerts();

  // 9. Revenue trend (last 6 months)
  const revenueTrend = await adminRepository.getRevenueTrend(6);

  // 10. System health quick status
  const systemHealth = await getSystemHealth();

  return {
    primaryMetrics: {
      totalGyms: Number(gymsRow?.total_gyms || 0),
      activeGyms: Number(gymsRow?.active_gyms || 0),
      trialGyms: Number(gymsRow?.trial_gyms || 0),
      expiredGyms: Number(gymsRow?.expired_gyms || 0),
      suspendedGyms: Number(gymsRow?.suspended_gyms || 0),
      totalLocations: Number(gymsRow?.total_locations || 0),
      totalMembers,
      newGymsThisMonth: Number(gymsRow?.new_gyms_this_month || 0)
    },
    businessMetrics: {
      mrr: Math.round(totalMRR * 100) / 100,
      arr: Math.round(totalARR * 100) / 100,
      revenueThisMonth: currentRevenue,
      revenueLastMonth: revStats.lastMonthCash,
      revenueGrowthPct: revStats.growthPct,
      estimatedPlatformCosts: totalEstimatedCostsThisMonth,
      estimatedGrossContribution,
      contributionMarginPct,
      trialConversionRatePct,
      churnRatePct
    },
    operations: {
      whatsAppMessagesThisMonth: totalWhatsAppMessagesThisMonth,
      whatsAppEstimatedCost: totalWhatsAppCostThisMonth,
      whatsAppFailedMessages: totalWhatsAppFailedThisMonth,
      connectedWhatsAppGyms: usageStats.gyms.filter((g) => g.whatsapp.attempted > 0).length,
      activeAlerts: alertStats.total,
      urgentAlerts: alertStats.urgent
    },
    systemHealth,
    trends: {
      revenueTrend
    }
  };
};

// =============================================================================
// 3. GYMS MANAGEMENT & ACTIONS
// =============================================================================

const getGyms = (filters) => adminRepository.listGymsAdmin(filters);

const getGymDetail = async (gymId) => {
  const detail = await adminRepository.findGymDetailAdmin(gymId);
  if (!detail) throw new AppError(404, 'Gym not found.');
  return detail;
};
const suspendGym = async (gymId, reason, admin) => {
  const current = await adminRepository.findGymDetailAdmin(gymId);
  if (!current) throw new AppError(404, 'Gym not found.');

  const updated = await adminRepository.updateGymSubscriptionStatus(gymId, 'SUSPENDED', false);

  await pool.query(
    `INSERT INTO gym_subscription_history (
      gym_id, plan, is_multi_gym, max_locations, billing_cycle,
      start_date, end_date, amount_paid, event_type, notes, created_by_admin_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), COALESCE($7, CURRENT_DATE), 0, 'SUSPENDED', $8, $9, NOW())`,
    [
      gymId,
      resolveCanonicalPlan(current.gym.subscriptionPlan),
      Boolean(current.gym.isMultiGym),
      Number(current.gym.maxLocations) || 1,
      current.gym.billingCycle || 'monthly',
      current.gym.subscriptionStartDate,
      current.gym.subscriptionEndDate,
      reason || 'Suspended by Super Admin',
      admin.id
    ]
  );

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'GYM_SUSPENDED',
    entityType: 'GYM',
    entityId: gymId,
    gymId,
    reason: reason || 'Suspended by Super Admin',
    beforeState: { subscriptionStatus: current.gym.subscriptionStatus, isActive: current.gym.isActive },
    afterState: { subscriptionStatus: 'SUSPENDED', isActive: false }
  });

  return updated;
};

const reactivateGym = async (gymId, reason, admin) => {
  const current = await adminRepository.findGymDetailAdmin(gymId);
  if (!current) throw new AppError(404, 'Gym not found.');

  const updated = await adminRepository.updateGymSubscriptionStatus(gymId, 'ACTIVE', true);

  await pool.query(
    `INSERT INTO gym_subscription_history (
      gym_id, plan, is_multi_gym, max_locations, billing_cycle,
      start_date, end_date, amount_paid, event_type, notes, created_by_admin_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), COALESCE($7, CURRENT_DATE), 0, 'REACTIVATED', $8, $9, NOW())`,
    [
      gymId,
      resolveCanonicalPlan(current.gym.subscriptionPlan),
      Boolean(current.gym.isMultiGym),
      Number(current.gym.maxLocations) || 1,
      current.gym.billingCycle || 'monthly',
      current.gym.subscriptionStartDate,
      current.gym.subscriptionEndDate,
      reason || 'Reactivated by Super Admin',
      admin.id
    ]
  );

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'GYM_REACTIVATED',
    entityType: 'GYM',
    entityId: gymId,
    gymId,
    reason: reason || 'Reactivated by Super Admin',
    beforeState: { subscriptionStatus: current.gym.subscriptionStatus, isActive: current.gym.isActive },
    afterState: { subscriptionStatus: 'ACTIVE', isActive: true }
  });

  return updated;
};

const extendGymTrial = async (gymId, days, reason, admin) => {
  const current = await adminRepository.findGymDetailAdmin(gymId);
  if (!current) throw new AppError(404, 'Gym not found.');

  const updated = await adminRepository.extendGymTrial(gymId, days || 7);

  await pool.query(
    `INSERT INTO gym_subscription_history (
      gym_id, plan, is_multi_gym, max_locations, billing_cycle,
      start_date, end_date, amount_paid, event_type, notes, created_by_admin_id, created_at
    )
    VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), COALESCE($7, CURRENT_DATE), 0, 'TRIAL_EXTENDED', $8, $9, NOW())`,
    [
      gymId,
      resolveCanonicalPlan(current.gym.subscriptionPlan),
      Boolean(current.gym.isMultiGym),
      Number(current.gym.maxLocations) || 1,
      current.gym.billingCycle || 'monthly',
      current.gym.subscriptionStartDate,
      updated.trial_ends_at,
      reason || `Extended trial by ${days || 7} days`,
      admin.id
    ]
  );

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'TRIAL_EXTENDED',
    entityType: 'GYM',
    entityId: gymId,
    gymId,
    reason: reason || `Extended trial by ${days || 7} days`,
    beforeState: { trialEndsAt: current.gym.trialEndsAt },
    afterState: { trialEndsAt: updated.trial_ends_at }
  });

  return updated;
};

const changeGymSubscription = async (gymId, data, reason, admin) => {
  const current = await adminRepository.findGymDetailAdmin(gymId);
  if (!current) throw new AppError(404, 'Gym not found.');

  const planTiers = {
    'Growth': 1,
    'Pro': 2,
    'Gym + Classes': 3
  };
  const currentPlan = resolveCanonicalPlan(current.gym.subscriptionPlan);
  const targetPlan = resolveCanonicalPlan(data.subscriptionPlan || data.plan || currentPlan);
  const oldTier = planTiers[currentPlan] || 1;
  const newTier = planTiers[targetPlan] || 1;
  let inferredEventType = 'PLAN_CHANGE';
  if (newTier > oldTier) inferredEventType = 'PLAN_UPGRADE';
  else if (newTier < oldTier) inferredEventType = 'PLAN_DOWNGRADE';
  else inferredEventType = 'PLAN_CHANGE';

  const targetBillingCycle = data.billingCycle || current.gym.billingCycle || 'monthly';
  const targetMaxLocations = data.maxLocations !== undefined ? data.maxLocations : current.gym.maxLocations;
  const targetIsMultiGym = data.isMultiGym !== undefined ? data.isMultiGym : current.gym.isMultiGym;

  const result = await adminRepository.changeGymSubscription(gymId, {
    ...data,
    plan: targetPlan,
    billingCycle: targetBillingCycle,
    maxLocations: targetMaxLocations,
    isMultiGym: targetIsMultiGym,
    eventType: data.eventType || inferredEventType,
    notes: reason || data.notes,
    adminId: admin.id
  });

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'SUBSCRIPTION_CHANGED',
    entityType: 'SUBSCRIPTION',
    entityId: gymId,
    gymId,
    reason: reason || 'Subscription modified by Super Admin',
    beforeState: {
      plan: current.gym.subscriptionPlan,
      billingCycle: current.gym.billingCycle,
      isMultiGym: current.gym.isMultiGym,
      maxLocations: current.gym.maxLocations
    },
    afterState: {
      plan: result.gym.subscription_plan,
      billingCycle: result.gym.billing_cycle,
      isMultiGym: result.gym.is_multi_gym,
      maxLocations: result.gym.max_locations
    }
  });

  return {
    ...result.gym,
    gym: result.gym,
    subscriptionEvent: result.subscriptionEvent
  };
};

const adjustGymLocationLimit = async (gymId, maxLocations, reason, admin) => {
  const current = await adminRepository.findGymDetailAdmin(gymId);
  if (!current) throw new AppError(404, 'Gym not found.');

  const updated = await adminRepository.adjustGymLocationLimit(gymId, maxLocations);

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'LOCATION_LIMIT_CHANGED',
    entityType: 'GYM',
    entityId: gymId,
    gymId,
    reason: reason || `Adjusted location limit to ${maxLocations}`,
    beforeState: { maxLocations: current.gym.maxLocations, isMultiGym: current.gym.isMultiGym },
    afterState: { maxLocations: updated.max_locations, isMultiGym: updated.is_multi_gym }
  });

  return updated;
};

// =============================================================================
// 4. SUBSCRIPTIONS & REVENUE
// =============================================================================

const getSubscriptions = (filters) => adminRepository.listSubscriptionsAdmin(filters);

const getSubscriptionHistory = (gymId, limit) => adminRepository.listSubscriptionHistoryAdmin(gymId, limit);

const getRevenueAnalytics = async () => {
  const stats = await adminRepository.getPlatformRevenueStats();
  const trendData = await adminRepository.getRevenueTrend(12);

  return {
    cashCollectedThisMonth: stats.currentMonthCash,
    cashCollectedLastMonth: stats.lastMonthCash,
    hasRecordedCash: stats.hasRecordedCash,
    hasRecordedHistory: trendData.hasRecordedHistory,
    growthPct: stats.growthPct,
    mrr: stats.mrr,
    arr: stats.arr,
    byPlan: stats.byPlan,
    byCycle: stats.byCycle,
    trend: trendData.trend
  };
};

// =============================================================================
// 5. USAGE & COSTS
// =============================================================================

const getUsageAndCosts = async (month) => {
  const currentMonthStr = month || new Date().toISOString().slice(0, 7);
  const data = await adminRepository.getPerGymUsageAndCosts(currentMonthStr);

  let totalSubscriptionRevenue = 0;
  let totalWhatsAppCost = 0;
  let totalDirectCosts = 0;

  for (const g of data.gyms) {
    totalSubscriptionRevenue += g.financials.subscriptionRevenue;
    totalWhatsAppCost += g.financials.estimatedWhatsAppCost;
    totalDirectCosts += g.financials.directCosts;
  }

  const totalOperatingCosts = Math.round((data.totalSharedCosts + totalDirectCosts) * 100) / 100;
  const totalAllCosts = Math.round((totalWhatsAppCost + totalOperatingCosts) * 100) / 100;
  const estimatedGrossContribution = Math.round((totalSubscriptionRevenue - totalAllCosts) * 100) / 100;
  const contributionMarginPct = totalSubscriptionRevenue > 0
    ? Math.round((estimatedGrossContribution / totalSubscriptionRevenue) * 1000) / 10
    : 0;

  // Identify top usage/cost gyms
  const topWhatsAppUsage = [...data.gyms].sort((a, b) => b.whatsapp.attempted - a.whatsapp.attempted).slice(0, 5);
  const topWhatsAppCost = [...data.gyms].sort((a, b) => b.whatsapp.estimatedCost - a.whatsapp.estimatedCost).slice(0, 5);
  const highestRevenue = [...data.gyms].sort((a, b) => b.financials.subscriptionRevenue - a.financials.subscriptionRevenue).slice(0, 5);
  const lowestContribution = [...data.gyms].sort((a, b) => a.financials.estimatedGrossContribution - b.financials.estimatedGrossContribution).slice(0, 5);

  return {
    month: currentMonthStr,
    companyEconomics: {
      totalPlatformSubscriptionRevenue: totalSubscriptionRevenue,
      totalWhatsAppCost: Math.round(totalWhatsAppCost * 100) / 100,
      totalOperatingCosts,
      totalCosts: totalAllCosts,
      estimatedGrossContribution,
      contributionMarginPct,
      unitCostUsed: data.unitCost,
      activeGymsCount: data.activeGymsCount,
      allocatedSharedCostPerGym: data.allocatedSharedCostPerGym
    },
    topRankings: {
      topWhatsAppUsage,
      topWhatsAppCost,
      highestRevenue,
      lowestContribution
    },
    gyms: data.gyms
  };
};

const getOperatingCosts = (month) => adminRepository.listOperatingCosts(month);

const addOperatingCost = async (payload, admin) => {
  if (!payload.month || !payload.category || !payload.provider || payload.amount === undefined) {
    throw new AppError(400, 'Month (YYYY-MM), category, provider, and amount are required.');
  }

  const created = await adminRepository.createOperatingCost({
    ...payload,
    createdBy: admin.id
  });

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'OPERATING_COST_ADDED',
    entityType: 'COST',
    entityId: created.id,
    gymId: created.gym_id,
    reason: `Added ${created.category} cost for ${created.month} (Amount: ₹${created.amount})`,
    afterState: created
  });

  return created;
};

const deleteOperatingCost = async (id, admin) => {
  const success = await adminRepository.deleteOperatingCost(id);
  if (!success) throw new AppError(404, 'Cost entry not found.');

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'OPERATING_COST_DELETED',
    entityType: 'COST',
    entityId: id,
    reason: `Deleted operating cost entry ID: ${id}`
  });

  return { success: true };
};

const getWhatsAppCostRules = () => adminRepository.listCostRules();

const saveWhatsAppCostRule = async (payload, admin) => {
  if (payload.unitCost === undefined || Number(payload.unitCost) < 0) {
    throw new AppError(400, 'Valid non-negative unitCost is required.');
  }

  const rule = await adminRepository.upsertCostRule(payload);

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'COST_RULE_CHANGED',
    entityType: 'COST_RULE',
    entityId: rule.id,
    reason: `Updated WhatsApp unit cost rule to ₹${rule.unit_cost}`,
    afterState: rule
  });

  return {
    ...rule,
    unitCost: Number(rule.unit_cost),
    countryCode: rule.country_code,
    effectiveFrom: rule.effective_from,
    effectiveTo: rule.effective_to,
    isActive: Boolean(rule.is_active)
  };
};

// =============================================================================
// 6. WHATSAPP OPERATIONS
// =============================================================================

const getWhatsAppOperations = (days) => adminRepository.getWhatsAppOperationalMetrics(days || 30);

const getWhatsAppLogs = (filters) => adminRepository.listAllWhatsAppLogsAdmin(filters);

// =============================================================================
// 7. USERS & ALERTS
// =============================================================================

const getUsers = (filters) => adminRepository.listAllUsersAdmin(filters);

const getAlerts = (filters) => adminRepository.listPlatformAlerts(filters || {});

const acknowledgeAlert = async (id, admin) => {
  const updated = await adminRepository.acknowledgeAlert(id, admin.id);
  if (!updated) throw new AppError(404, 'Alert not found.');

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'ALERT_ACKNOWLEDGED',
    entityType: 'ALERT',
    entityId: id,
    reason: `Acknowledged alert: ${updated.title}`
  });

  return updated;
};

const resolveAlert = async (id, admin) => {
  const updated = await adminRepository.resolveAlert(id, admin.id);
  if (!updated) throw new AppError(404, 'Alert not found.');

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'ALERT_RESOLVED',
    entityType: 'ALERT',
    entityId: id,
    reason: `Resolved alert: ${updated.title}`
  });

  return updated;
};

// =============================================================================
// 8. AUDIT LOGS & SETTINGS
// =============================================================================

const getAuditLogs = (filters) => adminRepository.listAuditLogs(filters);

const getSettings = async () => {
  const settings = await adminRepository.getPlatformSettings();
  const costRules = await adminRepository.listCostRules();
  const admins = await adminRepository.listAdminUsers();

  return {
    settings,
    costRules,
    admins: admins.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      isActive: a.is_active,
      lastLoginAt: a.last_login_at,
      createdAt: a.created_at
    }))
  };
};

const saveSetting = async (key, value, description, admin) => {
  const result = await adminRepository.setPlatformSetting(key, value, description, admin.id);

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'PLATFORM_SETTING_CHANGED',
    entityType: 'SETTING',
    entityId: key,
    reason: `Updated setting: ${key}`,
    afterState: result
  });

  return result;
};

const createAdminUser = async ({ email, password, name, role }, admin) => {
  if (!email || !password || !name) {
    throw new AppError(400, 'Email, password, and name are required.');
  }

  const existing = await adminRepository.findAdminByEmail(email);
  if (existing) {
    throw new AppError(409, 'An admin account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await adminRepository.createAdminUser({
    email,
    passwordHash,
    name,
    role: role || 'SUPER_ADMIN'
  });

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'ADMIN_USER_CREATED',
    entityType: 'ADMIN_USER',
    entityId: created.id,
    reason: `Created new Super Admin user: ${created.email}`
  });

  return {
    ...created,
    isActive: Boolean(created.is_active)
  };
};

const toggleAdminStatus = async (id, isActive, admin) => {
  const updated = await adminRepository.setAdminStatus(id, isActive);
  if (!updated) throw new AppError(404, 'Admin user not found.');

  await adminRepository.createAuditLog({
    adminUserId: admin.id,
    adminEmail: admin.email,
    action: 'ADMIN_STATUS_CHANGED',
    entityType: 'ADMIN_USER',
    entityId: id,
    reason: `Changed admin status for ${updated.email} to ${isActive ? 'Active' : 'Inactive'}`
  });

  return {
    ...updated,
    isActive: Boolean(updated.is_active)
  };
};

// =============================================================================
// 9. SYSTEM HEALTH (TRUTHFUL REPORTING)
// =============================================================================

const getSystemHealth = async () => {
  const now = Date.now();
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;

  try {
    const startDb = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - startDb;
  } catch (err) {
    dbStatus = 'DOWN';
  }

  // Check Meta WhatsApp configuration
  const waConfigured = Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID);
  const webhookConfigured = Boolean(process.env.META_WHATSAPP_VERIFY_TOKEN);

  return {
    timestamp: new Date().toISOString(),
    api: {
      status: 'HEALTHY',
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      environment: env.nodeEnv
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      activeConnections: pool.totalCount || 1,
      idleConnections: pool.idleCount || 0
    },
    whatsappProvider: {
      status: waConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
      mode: waConfigured ? 'LIVE_META_API' : 'LOG_ONLY_MODE',
      configured: waConfigured
    },
    whatsappWebhook: {
      status: webhookConfigured ? 'HEALTHY' : 'NOT_CONFIGURED',
      configured: webhookConfigured
    },
    backgroundTasks: {
      status: 'HEALTHY',
      description: 'In-process event scheduler active'
    },
    backup: {
      status: 'UNKNOWN',
      message: 'No automated cloud backup archive detected on local development instance'
    }
  };
};

module.exports = {
  loginSuperAdmin,
  getDashboardOverview,
  getGyms,
  getGymDetail,
  suspendGym,
  reactivateGym,
  extendGymTrial,
  changeGymSubscription,
  adjustGymLocationLimit,
  getSubscriptions,
  getSubscriptionHistory,
  getRevenueAnalytics,
  getUsageAndCosts,
  getOperatingCosts,
  addOperatingCost,
  deleteOperatingCost,
  getWhatsAppCostRules,
  saveWhatsAppCostRule,
  getWhatsAppOperations,
  getWhatsAppLogs,
  getUsers,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAuditLogs,
  getSettings,
  saveSetting,
  createAdminUser,
  toggleAdminStatus,
  getSystemHealth
};