const { pool } = require('../db/pool');

const getBusinessRevenueOverview = async (gymId, startDate = null, endDate = null) => {
  // 1. Gym Membership Revenue from payments table
  const gymRevenueQuery = `
    SELECT 
      COALESCE(SUM(paid_amount), 0) AS gym_revenue,
      COUNT(*) AS gym_payment_count,
      COALESCE(SUM(remaining_amount), 0) AS gym_outstanding_dues
    FROM payments
    WHERE gym_id = $1 
      AND ($2::date IS NULL OR payment_date >= $2)
      AND ($3::date IS NULL OR payment_date <= $3)
  `;
  const gymRes = await pool.query(gymRevenueQuery, [gymId, startDate ?? null, endDate ?? null]);
  const gymStats = gymRes.rows[0];

  // 2. Class Revenue from class_payments table
  const classRevenueQuery = `
    SELECT 
      COALESCE(SUM(paid_amount), 0) AS class_revenue,
      COUNT(*) AS class_payment_count,
      COALESCE(SUM(remaining_amount), 0) AS class_outstanding_dues
    FROM class_payments
    WHERE gym_id = $1
      AND ($2::date IS NULL OR payment_date >= $2)
      AND ($3::date IS NULL OR payment_date <= $3)
  `;
  const classRes = await pool.query(classRevenueQuery, [gymId, startDate ?? null, endDate ?? null]);
  const classStats = classRes.rows[0];

  // 3. Active Class Members count
  const classMembersQuery = `
    SELECT COUNT(DISTINCT member_id) AS active_class_members
    FROM class_memberships
    WHERE gym_id = $1 AND status = 'Active'
  `;
  const classMembersRes = await pool.query(classMembersQuery, [gymId]);

  // 4. Revenue by Class (Zumba, Yoga, CrossFit, etc.)
  const revenueByClassQuery = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.category,
      COALESCE(SUM(cp.paid_amount), 0) AS class_revenue,
      COALESCE(SUM(cp.remaining_amount), 0) AS outstanding_dues,
      COALESCE(
        (
          SELECT COUNT(DISTINCT cm.member_id)
          FROM class_memberships cm
          WHERE cm.class_id = c.id AND cm.gym_id = $1 AND cm.status = 'Active'
        ), 0
      ) AS active_members
    FROM classes c
    LEFT JOIN class_payments cp ON cp.class_id = c.id AND cp.gym_id = $1
    WHERE c.gym_id = $1 AND c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.category
    ORDER BY class_revenue DESC
  `;
  const revByClassRes = await pool.query(revenueByClassQuery, [gymId]);

  // 5. Revenue by Class Plan
  const revenueByPlanQuery = `
    SELECT 
      cplan.id AS plan_id,
      cplan.name AS plan_name,
      c.name AS class_name,
      COALESCE(SUM(cp.paid_amount), 0) AS plan_revenue,
      COALESCE(
        (
          SELECT COUNT(*)
          FROM class_memberships cm
          WHERE cm.class_plan_id = cplan.id AND cm.gym_id = $1 AND cm.status = 'Active'
        ), 0
      ) AS active_subscribers
    FROM class_plans cplan
    JOIN classes c ON c.id = cplan.class_id
    LEFT JOIN class_payments cp ON cp.class_plan_id = cplan.id AND cp.gym_id = $1
    WHERE cplan.gym_id = $1 AND cplan.deleted_at IS NULL
    GROUP BY cplan.id, cplan.name, c.name
    ORDER BY plan_revenue DESC
  `;
  const revByPlanRes = await pool.query(revenueByPlanQuery, [gymId]);

  const gymRevenue = Number(gymStats.gym_revenue);
  const classRevenue = Number(classStats.class_revenue);
  const totalBusinessRevenue = gymRevenue + classRevenue;

  return {
    businessSummary: {
      totalBusinessRevenue,
      gymMembershipRevenue: gymRevenue,
      classRevenue: classRevenue
    },
    gymMetrics: {
      totalRevenue: gymRevenue,
      paymentCount: Number(gymStats.gym_payment_count),
      outstandingDues: Number(gymStats.gym_outstanding_dues)
    },
    classMetrics: {
      totalRevenue: classRevenue,
      paymentCount: Number(classStats.class_payment_count),
      outstandingDues: Number(classStats.class_outstanding_dues),
      activeClassMembers: Number(classMembersRes.rows[0]?.active_class_members ?? 0)
    },
    revenueByClass: revByClassRes.rows.map((r) => ({
      classId: r.class_id,
      className: r.class_name,
      category: r.category,
      revenue: Number(r.class_revenue),
      outstanding: Number(r.outstanding_dues),
      activeMembers: Number(r.active_members)
    })),
    revenueByClassPlan: revByPlanRes.rows.map((r) => ({
      planId: r.plan_id,
      planName: r.plan_name,
      className: r.class_name,
      revenue: Number(r.plan_revenue),
      activeSubscribers: Number(r.active_subscribers)
    }))
  };
};

module.exports = {
  getBusinessRevenueOverview
};
