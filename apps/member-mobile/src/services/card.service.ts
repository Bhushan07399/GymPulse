import { memberApiClient } from '../lib/api-client';
import { DigitalCardData } from '../types/member';

export const memberCardService = {
  async getDigitalCard(): Promise<DigitalCardData> {
    const res = await memberApiClient.get<{ data: any }>('/member/card');
    const c = res.data.data?.card || res.data.data;

    return {
      memberId: c.memberId || c.member_id || '',
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Member',
      gymName: c.gymName || 'GymPulse Gym',
      gymId: c.gymId || '',
      qrToken: c.qrToken || c.qr_code || `GYMPULSE-MEMBER:${c.memberId || c.id}:${c.gymId}`,
      status: c.status || 'Active',
      expiryDate: c.expiryDate || new Date().toISOString().split('T')[0],
      profilePhotoUrl: c.profilePhotoUrl,
    };
  },
};
