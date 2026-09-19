/**
 * obo Unified Mobile App — Dashboard Types
 */

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
  hasClassFeature?: boolean;
}

export interface MemberDashboardSummary {
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    gymName: string;
    gymId: string;
  };
  membership: {
    planName: string;
    status: 'Active' | 'Expired' | 'Pending';
    expiryDate: string;
    daysRemaining: number;
    startDate?: string;
  };
  attendance: {
    totalCheckIns: number;
    lastCheckInDate?: string | null;
  };
  hasClassFeature: boolean;
  hasClassEntitlement: boolean;
}
