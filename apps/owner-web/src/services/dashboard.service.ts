import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export type DashboardSummary = {
  hasClassFeature?: boolean;
  gymMemberships?: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    todaysAttendance: number;
    revenue: number;
    totalRevenue?: number;
    newJoinings: number;
    membersLeft: number;
    totalOutstanding: number;
  };
  classes?: {
    activeClasses: number;
    todaysSessions: number;
    liveSessions: number;
    classMembers: number;
    revenue: number;
    totalRevenue?: number;
  } | null;
  business?: {
    gymMembershipRevenue: number;
    classRevenue: number;
    totalBusinessRevenue: number;
  };
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  totalMembershipPlans: number;
  totalRevenue: number;
  todaysAttendance: number;
  totalOutstanding: number;
  outstandingMembersCount: number;
  outstandingMembers: Array<{
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }>;
  recentPayments: Array<{ id: string; totalAmount: number; paymentMethod: string; paymentStatus: string; paymentDate: string }>;
  recentMembers: Array<{ id: string; firstName: string; lastName: string; email: string; membershipPlanId: string; joinDate: string; expiryDate: string; isActive: boolean }>;
};

export type DashboardAnalyticsParams = {
  period?: "today" | "this_week" | "this_month" | "last_month" | "this_year" | "last_6_months" | "custom";
  startDate?: string;
  endDate?: string;
};

export type DashboardAnalytics = {
  period: string;
  startDate: string;
  endDate: string;
  kpis: {
    newJoinings: number;
    membersLeft: number;
    netGrowth: number;
    revenueCollected: number;
    totalOutstanding: number;
    paymentCount: number;
  };
  weeklyBreakdown: Array<{
    date: string;
    day: string;
    joined: number;
    left: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    joined: number;
    left: number;
    netGrowth: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    paymentsCount: number;
  }>;
};

export async function getDashboardSummary() {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>("/dashboard/summary");
  if (!response.data?.data) {
    throw new Error("Dashboard data unavailable.");
  }
  return response.data.data;
}

export async function getDashboardAnalytics(params: DashboardAnalyticsParams = {}) {
  const response = await apiClient.get<ApiResponse<DashboardAnalytics>>("/dashboard/analytics", { params });
  if (!response.data?.data) {
    throw new Error("Analytics data unavailable.");
  }
  return response.data.data;
}
