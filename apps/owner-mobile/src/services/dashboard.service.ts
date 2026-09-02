import { apiClient } from '../lib/api-client';

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  todayCheckIns: number;
  membershipRevenue: number;
  classRevenue: number;
  totalRevenue: number;
  outstandingAmount: number;
  newJoiningsThisMonth?: number;
  activeClasses?: number;
}

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<{ data: any }>('/dashboard/summary');
    const raw = res.data.data;

    return {
      totalMembers: raw.totalMembers ?? raw.gymMemberships?.totalMembers ?? 0,
      activeMembers: raw.activeMembers ?? raw.gymMemberships?.activeMembers ?? 0,
      expiredMembers: raw.expiredMembers ?? raw.gymMemberships?.expiredMembers ?? 0,
      todayCheckIns: raw.todaysAttendance ?? raw.gymMemberships?.todaysAttendance ?? 0,
      membershipRevenue: raw.business?.gymMembershipRevenue ?? raw.gymMemberships?.revenue ?? raw.totalRevenue ?? 0,
      classRevenue: raw.business?.classRevenue ?? raw.classes?.revenue ?? 0,
      totalRevenue: raw.business?.totalBusinessRevenue ?? raw.gymMemberships?.totalRevenue ?? 0,
      outstandingAmount: raw.totalOutstanding ?? raw.gymMemberships?.totalOutstanding ?? 0,
      newJoiningsThisMonth: raw.newJoiningsThisMonth ?? raw.gymMemberships?.newJoinings ?? 0,
      activeClasses: raw.classes?.activeClasses ?? 0,
    };
  },
};
