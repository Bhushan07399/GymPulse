const dashboardService = require('../services/dashboard.service');

const summary = async (request, response) => {
  const dashboard = await dashboardService.getSummary(request.user.gymId);

  const hasClassFeature = dashboard.has_classes_enabled !== false;
  const gymMonthlyRevenue = Number(dashboard.gym_monthly_revenue || 0);
  const gymTotalRevenue = Number(dashboard.gym_total_revenue || 0);
  const classMonthlyRevenue = hasClassFeature ? Number(dashboard.class_monthly_revenue || 0) : 0;
  const classTotalRevenue = hasClassFeature ? Number(dashboard.class_total_revenue || 0) : 0;
  const totalBusinessRevenue = gymMonthlyRevenue + classMonthlyRevenue;

  response.status(200).json({
    success: true,
    data: {
      hasClassFeature,
      gymMemberships: {
        totalMembers: dashboard.total_members,
        activeMembers: dashboard.active_members,
        expiredMembers: dashboard.expired_members,
        todaysAttendance: dashboard.todays_attendance,
        revenue: gymMonthlyRevenue,
        totalRevenue: gymTotalRevenue,
        newJoinings: dashboard.new_joinings_this_month,
        membersLeft: dashboard.members_left_this_month,
        totalOutstanding: Number(dashboard.total_outstanding || 0)
      },
      classes: hasClassFeature
        ? {
            activeClasses: dashboard.active_classes,
            todaysSessions: dashboard.todays_sessions,
            liveSessions: dashboard.live_sessions,
            classMembers: dashboard.class_members,
            revenue: classMonthlyRevenue,
            totalRevenue: classTotalRevenue
          }
        : null,
      business: {
        gymMembershipRevenue: gymMonthlyRevenue,
        classRevenue: classMonthlyRevenue,
        totalBusinessRevenue
      },
      totalMembers: dashboard.total_members,
      activeMembers: dashboard.active_members,
      expiredMembers: dashboard.expired_members,
      totalMembershipPlans: dashboard.total_membership_plans,
      totalRevenue: gymMonthlyRevenue,
      todaysAttendance: dashboard.todays_attendance,
      totalOutstanding: Number(dashboard.total_outstanding || 0),
      outstandingMembersCount: Number(dashboard.outstanding_members_count || 0),
      outstandingMembers: dashboard.outstanding_members || [],
      recentPayments: dashboard.recent_payments,
      recentMembers: dashboard.recent_members
    }
  });
};

const analytics = async (request, response) => {
  const analyticsData = await dashboardService.getAnalytics(
    request.user.gymId,
    request.query
  );

  response.status(200).json({
    success: true,
    data: analyticsData
  });
};

module.exports = { summary, analytics };
