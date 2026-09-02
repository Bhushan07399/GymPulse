import { memberApiClient } from '../lib/api-client';
import { MemberDashboardSummary } from '../types/member';

export const memberDashboardService = {
  async getSummary(): Promise<MemberDashboardSummary> {
    const res = await memberApiClient.get<{ data: any }>('/member/dashboard');
    const d = res.data.data;

    const profile = d.profile || d.member || {};
    const membership = d.membership || {};
    const attendance = d.attendance || {};

    const planName = profile.planName || membership.planName || profile.plan_name || 'Standard Membership';
    const expiryDate = profile.expiryDate || membership.expiryDate || profile.expiry_date || new Date().toISOString().split('T')[0];
    const daysRemaining = typeof profile.daysRemaining === 'number' ? profile.daysRemaining : (typeof membership.daysRemaining === 'number' ? membership.daysRemaining : 30);
    const isMembershipActive = profile.isMembershipActive ?? (membership.status === 'Active' || daysRemaining > 0);

    return {
      member: {
        id: profile.id || '',
        memberId: profile.memberId || profile.member_id || '',
        firstName: profile.firstName || profile.first_name || 'Member',
        lastName: profile.lastName || profile.last_name || '',
        phone: profile.phone || '',
        gymName: profile.gymName || profile.gym_name || d.gymName || 'GymPulse Gym',
        gymId: profile.gymId || profile.gym_id || '',
      },
      membership: {
        planName,
        status: isMembershipActive ? 'Active' : 'Expired',
        expiryDate: String(expiryDate).split('T')[0],
        daysRemaining,
        startDate: profile.joinDate || membership.startDate,
      },
      attendance: {
        totalCheckIns: typeof attendance.totalCheckins === 'number' ? attendance.totalCheckins : (typeof attendance.totalCheckIns === 'number' ? attendance.totalCheckIns : 0),
        lastCheckInDate: attendance.todayStatus?.checkInTime || attendance.lastCheckInDate || null,
      },
    };
  },
};
