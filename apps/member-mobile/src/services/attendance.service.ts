import { memberApiClient } from '../lib/api-client';
import {
  MemberAttendanceHistoryResponse,
  MemberAttendanceItem,
  ScanQrResult,
  TodayAttendance,
} from '../types/attendance';

export const memberAttendanceService = {
  async scanGymQr(qrPayload: string): Promise<ScanQrResult> {
    try {
      const res = await memberApiClient.post<{ success: boolean; message: string; data: any }>(
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
          message: err.response?.data?.message || err.response?.data?.error?.message || "You're already checked in.",
        };
      }
      throw err;
    }
  },

  async checkOut(attendanceId?: string | null): Promise<ScanQrResult> {
    const endpoint = attendanceId ? `/member/attendance/${attendanceId}/checkout` : '/member/attendance/checkout';
    const res = await memberApiClient.post<{ success: boolean; message: string; data: any }>(endpoint);
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

  async markClassAttendance(sessionId: string, classId: string): Promise<any> {
    const res = await memberApiClient.post<{ success: boolean; message: string; data: any }>(
      '/member/attendance/class-checkin',
      { sessionId, classId }
    );
    return res.data;
  },

  async getAttendanceHistory(): Promise<MemberAttendanceHistoryResponse> {
    const res = await memberApiClient.get<{ data: any }>('/member/attendance');
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
