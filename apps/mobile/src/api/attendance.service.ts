/**
 * obo Unified Mobile App — Canonical Attendance API Service
 * Single source of truth for all attendance domain network calls across Owner, Staff, and Member.
 */

import { apiClient } from './client';
import {
  AttendanceRecord,
  ScanQrInput,
  ScanQrResponse,
  ScanQrResult,
  MemberAttendanceHistoryResponse,
  MemberAttendanceItem,
  TodayAttendance,
} from '../types';

export interface GetAttendanceParams {
  date?: string;
  search?: string;
}

export const attendanceService = {
  /**
   * Fetch Attendance Ledger (Owner & Staff Desk)
   * GET /attendance
   */
  async getLedger(params?: GetAttendanceParams): Promise<AttendanceRecord[]> {
    const res = await apiClient.get<{ data: any }>('/attendance', { params });
    const rawData = res.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.attendance || []);

    return items.map((a: any) => ({
      id: a.id,
      gymId: a.gymId,
      memberId: a.memberId || a.memberUuid,
      checkInTime: a.checkInTime || a.createdAt,
      checkOutTime: a.checkOutTime || a.check_out_time || null,
      status: a.status || 'PRESENT',
      checkInMethod: a.attendanceMethod || 'QR',
      member: a.member ? {
        id: a.member.id,
        memberId: a.member.memberId || a.member.member_id,
        gymId: a.member.gymId,
        firstName: a.member.firstName || a.member.first_name,
        lastName: a.member.lastName || a.member.last_name,
        phone: a.member.phone,
        expiryDate: a.member.expiryDate,
        isActive: a.member.isActive,
      } : undefined,
      createdAt: a.createdAt,
    }));
  },

  /**
   * Scan Member QR Code at Reception Desk (Owner & Staff Desk)
   * POST /attendance
   */
  async scanMemberQr(input: ScanQrInput): Promise<ScanQrResponse> {
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

  /**
   * Manual Check-in by Member ID (Owner & Staff Desk)
   * POST /attendance
   */
  async manualCheckIn(memberId: string): Promise<AttendanceRecord> {
    const now = new Date();
    const res = await apiClient.post<{ data: any }>('/attendance', {
      memberId,
      checkInTime: now.toISOString(),
      attendanceDate: now.toISOString().split('T')[0],
      attendanceMethod: 'Manual',
      notes: 'Manual check-in via mobile desk',
    });
    const a = res.data.data?.attendance || res.data.data;
    return {
      id: a.id,
      gymId: a.gymId,
      memberId: a.memberId || memberId,
      checkInTime: a.checkInTime || now.toISOString(),
      status: 'PRESENT',
      checkInMethod: 'MANUAL',
      createdAt: a.createdAt || now.toISOString(),
    };
  },

  /**
   * Check Out Member (Owner & Staff Desk)
   * PUT /attendance/:id
   */
  async checkOut(attendanceId: string): Promise<AttendanceRecord> {
    const res = await apiClient.put<{ data: any }>(`/attendance/${attendanceId}`, {
      checkOutTime: new Date().toISOString(),
    });
    const a = res.data.data?.attendance || res.data.data;
    return {
      id: a.id,
      gymId: a.gymId,
      memberId: a.memberId,
      checkInTime: a.checkInTime || a.createdAt,
      checkOutTime: a.checkOutTime,
      status: 'PRESENT',
      checkInMethod: (a.attendanceMethod?.toUpperCase() as any) || 'MANUAL',
      createdAt: a.createdAt,
    };
  },

  /**
   * Scan Gym QR Code by Member for Self Entry
   * POST /member/attendance/scan
   */
  async memberScanGymQr(qrPayload: string): Promise<ScanQrResult> {
    try {
      const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
        '/member/attendance/scan',
        { qrPayload }
      );
      const d = res.data.data;
      return {
        action: d.action || 'CHECK_IN',
        status: d.status || 'CHECKED_IN',
        checkInTime: d.checkInTime || d.attendance?.checkInTime,
        checkOutTime: d.checkOutTime || d.attendance?.checkOutTime,
        attendance: d.attendance,
        eligibleClasses: d.eligibleClasses || [],
        message: res.data.message || 'Check-in successful!',
      };
    } catch (err: any) {
      if (err.response?.status === 409) {
        const errData = err.response?.data?.data || {};
        const code = err.response?.data?.error?.code || 'ALREADY_CHECKED_IN';
        return {
          action: code === 'ALREADY_COMPLETED' ? 'ALREADY_COMPLETED' : 'DUPLICATE',
          status: code === 'ALREADY_COMPLETED' ? 'CHECKED_OUT' : 'CHECKED_IN',
          checkInTime: errData.checkInTime,
          checkOutTime: errData.checkOutTime,
          attendance: errData,
          eligibleClasses: errData.eligibleClasses || [],
          message: err.response?.data?.message || err.response?.data?.error?.message || "You're already checked in today.",
        };
      }
      throw err;
    }
  },

  /**
   * Member Self Check-out
   * POST /member/attendance/checkout
   */
  async memberCheckOut(attendanceId?: string | null): Promise<ScanQrResult> {
    const endpoint = attendanceId ? `/member/attendance/${attendanceId}/checkout` : '/member/attendance/checkout';
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(endpoint);
    const d = res.data.data;
    return {
      action: 'CHECK_OUT',
      status: 'CHECKED_OUT',
      checkInTime: d.attendance?.checkInTime,
      checkOutTime: d.checkOutTime || d.attendance?.checkOutTime,
      attendance: d.attendance,
      message: res.data.message || 'Successfully checked out!',
    };
  },

  /**
   * Check in to Class Session
   * POST /member/attendance/class-checkin
   */
  async markClassAttendance(sessionId: string, classId: string): Promise<any> {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>(
      '/member/attendance/class-checkin',
      { sessionId, classId }
    );
    return res.data;
  },

  /**
   * Fetch Member Attendance History
   * GET /member/attendance
   */
  async getMemberAttendanceHistory(): Promise<MemberAttendanceHistoryResponse> {
    const res = await apiClient.get<{ data: any }>('/member/attendance');
    const d = res.data.data || res.data;
    const items = Array.isArray(d) ? d : (d?.logs || d?.attendance || []);

    const mapped: MemberAttendanceItem[] = items.map((a: any) => ({
      id: a.id,
      gymId: a.gymId || a.gym_id,
      gymName: a.gymName || a.gym_name,
      attendanceDate: a.attendanceDate || a.attendance_date || a.created_at,
      checkInTime: a.checkInTime || a.check_in_time || a.createdAt,
      checkOutTime: a.checkOutTime || a.check_out_time,
      durationMinutes: typeof a.durationMinutes === 'number' ? a.durationMinutes : undefined,
      attendanceMethod: a.attendanceMethod || a.attendance_method || 'QR',
      status: a.status || (!a.checkOutTime && !a.check_out_time ? 'IN' : 'COMPLETED'),
      markedByStaff: a.markedByStaff || a.marked_by_staff_id,
    }));

    let todayData: TodayAttendance | undefined = undefined;
    if (d?.today) {
      todayData = {
        id: d.today.id,
        gymId: d.today.gymId || d.today.gym_id,
        gymName: d.today.gymName || d.today.gym_name,
        checkedIn: Boolean(d.today.checkedIn),
        checkInTime: d.today.checkInTime,
        checkOutTime: d.today.checkOutTime,
        attendanceMethod: d.today.attendanceMethod || d.today.attendance_method || 'QR',
        status: d.today.status || (d.today.checkedIn ? 'CHECKED_IN' : d.today.checkOutTime ? 'CHECKED_OUT' : 'NOT_CHECKED_IN'),
      };
    }

    return {
      today: todayData,
      attendance: mapped,
      totalCheckIns: typeof d?.stats?.totalVisits === 'number' ? d.stats.totalVisits : mapped.length,
    };
  },
};
