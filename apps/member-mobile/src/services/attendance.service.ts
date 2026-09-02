import { memberApiClient } from '../lib/api-client';
import { MemberAttendanceHistoryResponse, MemberAttendanceItem } from '../types/attendance';

export const memberAttendanceService = {
  async getAttendanceHistory(): Promise<MemberAttendanceHistoryResponse> {
    const res = await memberApiClient.get<{ data: any }>('/member/attendance');
    const d = res.data.data;
    const items = Array.isArray(d) ? d : (d?.attendance || []);

    const mapped: MemberAttendanceItem[] = items.map((a: any) => ({
      id: a.id,
      attendanceDate: a.attendanceDate || a.attendance_date || a.created_at,
      checkInTime: a.checkInTime || a.check_in_time || a.createdAt,
      checkOutTime: a.checkOutTime || a.check_out_time,
      attendanceMethod: a.attendanceMethod || a.attendance_method || 'QR',
      markedByStaff: a.markedByStaff || a.marked_by_staff_id,
    }));

    return {
      attendance: mapped,
      totalCheckIns: typeof d?.totalCheckIns === 'number' ? d.totalCheckIns : mapped.length,
    };
  },
};
