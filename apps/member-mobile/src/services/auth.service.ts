import { memberApiClient, setMemberUnauthorizedCallback } from '../lib/api-client';
import { memberSecureStorage } from '../lib/secure-store';
import { MemberAuthResponse, MemberUser } from '../types/auth';

export const memberAuthService = {
  async login(identifier: string, password: string): Promise<MemberAuthResponse> {
    const res = await memberApiClient.post<{ data: any }>('/member/auth/login', {
      identifier,
      password,
    });
    const authData = res.data.data;
    const token = authData.token;
    const memberObj: MemberUser = {
      id: authData.member?.id || authData.user?.id || '',
      memberId: authData.member?.memberId || authData.member?.member_id || identifier,
      gymId: authData.member?.gymId || authData.member?.gym_id || '',
      firstName: authData.member?.firstName || authData.member?.first_name || 'Member',
      lastName: authData.member?.lastName || authData.member?.last_name || '',
      phone: authData.member?.phone || '',
      email: authData.member?.email,
      gymName: authData.member?.gymName || authData.gymName || 'GymPulse Gym',
      role: 'Member',
    };

    if (token) {
      await memberSecureStorage.setItem('gympulse_member_token', token);
      await memberSecureStorage.setItem('gympulse_member_user', JSON.stringify(memberObj));
    }

    return {
      token,
      member: memberObj,
    };
  },

  async logout(): Promise<void> {
    await memberSecureStorage.removeItem('gympulse_member_token');
    await memberSecureStorage.removeItem('gympulse_member_user');
  },

  async getStoredSession(): Promise<{ token: string | null; member: MemberUser | null }> {
    const token = await memberSecureStorage.getItem('gympulse_member_token');
    const memberStr = await memberSecureStorage.getItem('gympulse_member_user');

    return {
      token,
      member: memberStr ? JSON.parse(memberStr) : null,
    };
  },

  registerUnauthorizedHandler(handler: () => void) {
    setMemberUnauthorizedCallback(handler);
  },
};
