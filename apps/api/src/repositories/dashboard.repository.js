const { pool } = require('../db/pool');

const getSummary = async (gymId) => {
  const result = await pool.query(
    `WITH gym_scope AS (
      SELECT id
      FROM gyms
      WHERE id = $1 AND deleted_at IS NULL
    ),
    member_stats AS (
      SELECT
        COUNT(*)::INTEGER AS total_members,
        COUNT(*) FILTER (
          WHERE is_active = TRUE AND expiry_date >= CURRENT_DATE
        )::INTEGER AS active_members,
        COUNT(*) FILTER (
          WHERE expiry_date < CURRENT_DATE
        )::INTEGER AS expired_members,
        COUNT(*) FILTER (
          WHERE join_date >= DATE_TRUNC('month', CURRENT_DATE)::date
        )::INTEGER AS new_joinings_this_month,
        COUNT(*) FILTER (
          WHERE left_date IS NOT NULL AND left_date >= DATE_TRUNC('month', CURRENT_DATE)::date
        )::INTEGER AS members_left_this_month
      FROM members
      WHERE gym_id = $1 AND deleted_at IS NULL
    ),
    plan_stats AS (
      SELECT COUNT(*)::INTEGER AS total_membership_plans
      FROM membership_plans
      WHERE gym_id = $1 AND deleted_at IS NULL
    ),
    gym_revenue_stats AS (
      SELECT
        COALESCE(SUM(paid_amount), 0)::NUMERIC AS gym_total_revenue,
        COALESCE(SUM(paid_amount) FILTER (WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)::date), 0)::NUMERIC AS gym_monthly_revenue
      FROM payments
      WHERE gym_id = $1 AND deleted_at IS NULL
    ),
    class_revenue_stats AS (
      SELECT
        COALESCE(SUM(paid_amount), 0)::NUMERIC AS class_total_revenue,
        COALESCE(SUM(paid_amount) FILTER (WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)::date), 0)::NUMERIC AS class_monthly_revenue
      FROM class_payments
      WHERE gym_id = $1
    ),
    gym_settings_stats AS (
      SELECT 
        g.subscription_plan,
        g.subscription_status,
        g.trial_started_at,
        g.trial_ends_at,
        (
          CASE 
            WHEN g.subscription_status = 'ACTIVE' AND LOWER(g.subscription_plan) LIKE '%class%' THEN TRUE 
            ELSE FALSE 
          END
        ) AND COALESCE(gs.has_classes_enabled, TRUE) AS has_classes_enabled
      FROM gyms g
      LEFT JOIN gym_settings gs ON gs.gym_id = g.id
      WHERE g.id = $1
    ),
    attendance_stats AS (
      SELECT COUNT(*)::INTEGER AS todays_attendance
      FROM attendance
      WHERE gym_id = $1
        AND attendance_date = CURRENT_DATE
        AND deleted_at IS NULL
    ),
    outstanding_stats AS (
      SELECT
        COALESCE(SUM(remaining_amount), 0)::NUMERIC AS total_outstanding,
        COUNT(DISTINCT member_id)::INTEGER AS members_count
      FROM payments
      WHERE gym_id = $1 AND remaining_amount > 0 AND deleted_at IS NULL
    ),
    class_overview_stats AS (
      SELECT
        (SELECT COUNT(*)::INTEGER FROM classes WHERE gym_id = $1 AND deleted_at IS NULL AND is_active = TRUE) AS active_classes,
        (SELECT COUNT(DISTINCT cs.id)::INTEGER
         FROM class_schedules cs JOIN classes c ON c.id = cs.class_id
         WHERE cs.gym_id = $1 AND c.deleted_at IS NULL AND c.is_active = TRUE
           AND LOWER(cs.day_of_week) = LOWER(TO_CHAR(CURRENT_DATE, 'Day'))) AS todays_sessions,
        (SELECT COUNT(DISTINCT cs.id)::INTEGER
         FROM class_schedules cs JOIN classes c ON c.id = cs.class_id
         WHERE cs.gym_id = $1 AND c.deleted_at IS NULL AND c.is_active = TRUE
           AND LOWER(cs.day_of_week) = LOWER(TO_CHAR(CURRENT_DATE, 'Day'))
           AND CURRENT_TIME >= cs.start_time AND CURRENT_TIME <= cs.end_time) AS live_sessions,
        (SELECT COUNT(DISTINCT member_id)::INTEGER
         FROM class_memberships WHERE gym_id = $1 AND status = 'Active') AS class_members
    ),
    outstanding_members AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'memberId', o.member_id,
            'firstName', o.first_name,
            'lastName', o.last_name,
            'totalAmount', o.total_amount,
            'paidAmount', o.paid_amount,
            'remainingAmount', o.remaining_amount,
            'paymentStatus', o.payment_status
          )
          ORDER BY o.created_at DESC
        ),
        '[]'::jsonb
      ) AS items
      FROM (
        SELECT p.id, m.member_id, m.first_name, m.last_name, p.total_amount, p.paid_amount, p.remaining_amount, p.payment_status, p.created_at
        FROM payments p
        JOIN members m ON m.id = p.member_id
        WHERE p.gym_id = $1 AND p.remaining_amount > 0 AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT 5
      ) AS o
    ),
    recent_payments AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', payment_rows.id,
            'memberId', payment_rows.member_id,
            'totalAmount', payment_rows.total_amount,
            'paymentMethod', payment_rows.payment_method,
            'paymentStatus', payment_rows.payment_status,
            'paymentDate', payment_rows.payment_date
          )
          ORDER BY payment_rows.payment_date DESC, payment_rows.created_at DESC
        ),
        '[]'::jsonb
      ) AS recent_payments
      FROM (
        SELECT p.id, m.member_id, p.total_amount, p.payment_method, p.payment_status,
               p.payment_date, p.created_at
        FROM payments p JOIN members m ON m.id = p.member_id
        WHERE p.gym_id = $1 AND p.deleted_at IS NULL
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT 5
      ) AS payment_rows
    ),
    recent_members AS (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', member_rows.id,
            'memberId', member_rows.member_id,
            'firstName', member_rows.first_name,
            'lastName', member_rows.last_name,
            'email', member_rows.email,
            'membershipPlanId', member_rows.membership_plan_id,
            'joinDate', member_rows.join_date,
            'expiryDate', member_rows.expiry_date,
            'isActive', member_rows.is_active
          )
          ORDER BY member_rows.created_at DESC
        ),
        '[]'::jsonb
      ) AS recent_members
      FROM (
        SELECT id, member_id, first_name, last_name, email, membership_plan_id,
               join_date, expiry_date, is_active, created_at
        FROM members
        WHERE gym_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      ) AS member_rows
    )
    SELECT
      member_stats.total_members,
      member_stats.active_members,
      member_stats.expired_members,
      member_stats.new_joinings_this_month,
      member_stats.members_left_this_month,
      plan_stats.total_membership_plans,
      gym_revenue_stats.gym_total_revenue,
      gym_revenue_stats.gym_monthly_revenue,
      class_revenue_stats.class_total_revenue,
      class_revenue_stats.class_monthly_revenue,
      COALESCE(gym_settings_stats.has_classes_enabled, TRUE) AS has_classes_enabled,
      gym_settings_stats.subscription_plan,
      gym_settings_stats.subscription_status,
      gym_settings_stats.trial_started_at,
      gym_settings_stats.trial_ends_at,
      attendance_stats.todays_attendance,
      outstanding_stats.total_outstanding,
      outstanding_stats.members_count AS outstanding_members_count,
      class_overview_stats.active_classes,
      class_overview_stats.todays_sessions,
      class_overview_stats.live_sessions,
      class_overview_stats.class_members,
      outstanding_members.items AS outstanding_members,
      recent_payments.recent_payments,
      recent_members.recent_members
    FROM gym_scope
    CROSS JOIN member_stats
    CROSS JOIN plan_stats
    CROSS JOIN gym_revenue_stats
    CROSS JOIN class_revenue_stats
    LEFT JOIN gym_settings_stats ON TRUE
    CROSS JOIN attendance_stats
    CROSS JOIN outstanding_stats
    CROSS JOIN class_overview_stats
    CROSS JOIN outstanding_members
    CROSS JOIN recent_payments
    CROSS JOIN recent_members`,
    [gymId]
  );

  const row = result.rows[0];
  if (!row) return null;

  const now = new Date();
  const trialEndsAt = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
  const status = row.subscription_status || 'ACTIVE';

  let isTrialActive = false;
  let isTrialExpired = false;
  let trialDaysRemaining = 0;

  if (status === 'TRIAL') {
    if (trialEndsAt && now < trialEndsAt) {
      isTrialActive = true;
      const diffMs = trialEndsAt.getTime() - now.getTime();
      trialDaysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      isTrialExpired = true;
      trialDaysRemaining = 0;
    }
  }

  const hasClassFeature = !isTrialActive && !isTrialExpired && Boolean(row.has_classes_enabled);

  return {
    ...row,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    hasClassFeature
  };
};

const resolveDateRange = (period, startDateParam, endDateParam) => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "this_week" || period === "week") {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diffToMon));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === "this_month" || period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "this_year" || period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (period === "last_6_months") {
    start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === "custom" && startDateParam && endDateParam) {
    start = new Date(startDateParam);
    end = new Date(endDateParam);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const startDateStr = start.toISOString().slice(0, 10);
  const endDateStr = end.toISOString().slice(0, 10);
  return { startDateStr, endDateStr, start, end };
};

const getAnalytics = async (gymId, { period, startDate, endDate }) => {
  const { startDateStr, endDateStr } = resolveDateRange(period, startDate, endDate);

  // 1. Business KPIs for selected period
  const kpiQuery = `
    SELECT
      (SELECT COUNT(*)::INTEGER FROM members WHERE gym_id = $1 AND deleted_at IS NULL AND join_date >= $2::date AND join_date <= $3::date) AS new_joinings,
      (SELECT COUNT(*)::INTEGER FROM members WHERE gym_id = $1 AND deleted_at IS NULL AND left_date IS NOT NULL AND left_date >= $2::date AND left_date <= $3::date) AS members_left,
      (SELECT COALESCE(SUM(paid_amount), 0)::NUMERIC FROM payments WHERE gym_id = $1 AND deleted_at IS NULL AND payment_date >= $2::date AND payment_date <= $3::date) AS revenue_collected,
      (SELECT COALESCE(SUM(remaining_amount), 0)::NUMERIC FROM payments WHERE gym_id = $1 AND deleted_at IS NULL AND remaining_amount > 0) AS total_outstanding,
      (SELECT COUNT(*)::INTEGER FROM payments WHERE gym_id = $1 AND deleted_at IS NULL AND paid_amount > 0 AND payment_date >= $2::date AND payment_date <= $3::date) AS payment_count
  `;
  const kpiRes = await pool.query(kpiQuery, [gymId, startDateStr, endDateStr]);
  const kpisRaw = kpiRes.rows[0] || {};

  const newJoinings = Number(kpisRaw.new_joinings || 0);
  const membersLeft = Number(kpisRaw.members_left || 0);
  const netGrowth = newJoinings - membersLeft;
  const revenueCollected = Number(kpisRaw.revenue_collected || 0);
  const totalOutstanding = Number(kpisRaw.total_outstanding || 0);
  const paymentCount = Number(kpisRaw.payment_count || 0);

  // 2. Weekly breakdown query (Mon - Sun of the selected or current week)
  const now = new Date();
  const day = now.getDay();
  const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
  const monDate = new Date(now.setDate(diffToMon));
  monDate.setHours(0,0,0,0);
  const sunDate = new Date(monDate);
  sunDate.setDate(sunDate.getDate() + 6);

  const weekStartStr = monDate.toISOString().slice(0, 10);
  const weekEndStr = sunDate.toISOString().slice(0, 10);

  const weeklyQuery = `
    WITH week_days AS (
      SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS day_date
    )
    SELECT
      d.day_date::text AS date,
      TO_CHAR(d.day_date, 'Dy') AS day,
      COUNT(DISTINCT mj.id)::INTEGER AS joined,
      COUNT(DISTINCT ml.id)::INTEGER AS left
    FROM week_days d
    LEFT JOIN members mj ON mj.gym_id = $1 AND mj.deleted_at IS NULL AND mj.join_date = d.day_date
    LEFT JOIN members ml ON ml.gym_id = $1 AND ml.deleted_at IS NULL AND ml.left_date = d.day_date
    GROUP BY d.day_date
    ORDER BY d.day_date ASC
  `;
  const weeklyRes = await pool.query(weeklyQuery, [gymId, weekStartStr, weekEndStr]);

  // 3. Monthly Member Growth trend query (Last 6 Months)
  const monthlyGrowthQuery = `
    WITH month_series AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
        DATE_TRUNC('month', CURRENT_DATE),
        '1 month'::interval
      )::date AS month_start
    )
    SELECT
      TO_CHAR(ms.month_start, 'Mon YYYY') AS month,
      ms.month_start::text AS month_start,
      COUNT(DISTINCT mj.id)::INTEGER AS joined,
      COUNT(DISTINCT ml.id)::INTEGER AS left
    FROM month_series ms
    LEFT JOIN members mj ON mj.gym_id = $1 AND mj.deleted_at IS NULL 
      AND mj.join_date >= ms.month_start 
      AND mj.join_date < (ms.month_start + INTERVAL '1 month')::date
    LEFT JOIN members ml ON ml.gym_id = $1 AND ml.deleted_at IS NULL 
      AND ml.left_date >= ms.month_start 
      AND ml.left_date < (ms.month_start + INTERVAL '1 month')::date
    GROUP BY ms.month_start
    ORDER BY ms.month_start ASC
  `;
  const monthlyGrowthRes = await pool.query(monthlyGrowthQuery, [gymId]);

  // 4. Monthly Revenue trend query (Last 6 Months)
  const revenueTrendQuery = `
    WITH month_series AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
        DATE_TRUNC('month', CURRENT_DATE),
        '1 month'::interval
      )::date AS month_start
    )
    SELECT
      TO_CHAR(ms.month_start, 'Mon YYYY') AS month,
      ms.month_start::text AS month_start,
      COALESCE(SUM(p.paid_amount), 0)::NUMERIC AS revenue,
      COUNT(DISTINCT p.id)::INTEGER AS payments_count
    FROM month_series ms
    LEFT JOIN payments p ON p.gym_id = $1 AND p.deleted_at IS NULL AND p.paid_amount > 0
      AND p.payment_date >= ms.month_start 
      AND p.payment_date < (ms.month_start + INTERVAL '1 month')::date
    GROUP BY ms.month_start
    ORDER BY ms.month_start ASC
  `;
  const revenueTrendRes = await pool.query(revenueTrendQuery, [gymId]);

  return {
    period: period || "this_month",
    startDate: startDateStr,
    endDate: endDateStr,
    kpis: {
      newJoinings,
      membersLeft,
      netGrowth,
      revenueCollected,
      totalOutstanding,
      paymentCount,
    },
    weeklyBreakdown: weeklyRes.rows.map((row) => ({
      date: row.date,
      day: row.day,
      joined: Number(row.joined),
      left: Number(row.left),
    })),
    monthlyGrowth: monthlyGrowthRes.rows.map((row) => ({
      month: row.month,
      joined: Number(row.joined),
      left: Number(row.left),
      netGrowth: Number(row.joined) - Number(row.left),
    })),
    revenueTrend: revenueTrendRes.rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue),
      paymentsCount: Number(row.payments_count),
    })),
  };
};

module.exports = { getSummary, getAnalytics, resolveDateRange };
