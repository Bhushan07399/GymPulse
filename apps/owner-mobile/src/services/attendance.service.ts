import { apiClient } from '../lib/api-client';
import { AttendanceRecord, ScanQrInput, ScanQrResponse } from '../types/attendance';

export interface GetAttendanceLedgerParams {
  date?: string;
  search?: string;
}

export const attendanceService = {
  async getTodayLedger(params?: GetAttendanceLedgerParams): Promise<AttendanceRecord[]> {
    const res = await apiClient.get<{ data: any }>('/attendance', { params });
    const rawData = res.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.attendance || []);

    return items.map((a: any) => ({
      id: a.id,
      gymId: a.gymId,
      memberId: a.memberId || a.memberUuid,
      checkInTime: a.checkInTime || a.createdAt,
      status: a.status || 'PRESENT',
      checkInMethod: a.attendanceMethod || 'QR',
      member: a.member ? {
        id: a.member.id,
        memberId: a.member.memberId || a.member.member_id,
        gymId: a.member.gymId,
        membershipPlanId: a.member.membershipPlanId,
        firstName: a.member.firstName || a.member.first_name,
        lastName: a.member.lastName || a.member.last_name,
        gender: a.member.gender,
        phone: a.member.phone,
        joinDate: a.member.joinDate,
        expiryDate: a.member.expiryDate,
        isActive: a.member.isActive,
        createdAt: a.member.createdAt,
        updatedAt: a.member.updatedAt,
      } : undefined,
      createdAt: a.createdAt,
    }));
  },

  async scanQrCode(input: ScanQrInput): Promise<ScanQrResponse> {
    // Parse QR payload format: GYMPULSE-MEMBER:<memberId>:<gymId>
    const parts = input.qrData.split(':');
    const memberId = parts.length >= 2 ? parts[1] : input.qrData;

    try {
      const res = await apiClient.post<{ data: any }>('/attendance', {
        memberId,
        attendanceMethod: 'QR',
      });
      const a = res.data.data?.attendance || res.data.data;

      return {
        message: 'Member checked in successfully!',
        alreadyCheckedIn: false,
        member: {
          id: a.memberId || memberId,
          memberId: a.memberId || memberId,
          firstName: a.member?.firstName || 'Member',
          lastName: a.member?.lastName || '',
          phone: a.member?.phone || '',
          expiryDate: a.member?.expiryDate || new Date().toISOString(),
          isActive: true,
          membershipPlanName: a.member?.membershipPlanName || 'Active Plan',
        },
        attendance: {
          id: a.id,
          gymId: a.gymId,
          memberId: a.memberId,
          checkInTime: a.checkInTime || new Date().toISOString(),
          status: 'PRESENT',
          checkInMethod: 'QR',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already') || err.message?.includes('409')) {
        return {
          message: 'Member already checked in today.',
          alreadyCheckedIn: true,
          member: {
            id: memberId,
            memberId: memberId,
            firstName: 'Member',
            lastName: '',
            phone: '',
            expiryDate: new Date().toISOString(),
            isActive: true,
          },
          attendance: {
            id: 'existing',
            gymId: '',
            memberId: memberId,
            checkInTime: new Date().toISOString(),
            status: 'PRESENT',
            checkInMethod: 'QR',
            createdAt: new Date().toISOString(),
          },
        };
      }
      throw err;
    }
  },

  async manualCheckIn(memberId: string): Promise<AttendanceRecord> {
    const res = await apiClient.post<{ data: any }>('/attendance', {
      memberId,
      attendanceMethod: 'MANUAL',
    });
    const a = res.data.data?.attendance || res.data.data;

    return {
      id: a.id,
      gymId: a.gymId,
      memberId: a.memberId || memberId,
      checkInTime: a.checkInTime || new Date().toISOString(),
      status: 'PRESENT',
      checkInMethod: 'MANUAL',
      createdAt: a.createdAt || new Date().toISOString(),
    };
  },
};
