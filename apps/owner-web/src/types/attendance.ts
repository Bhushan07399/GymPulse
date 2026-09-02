import type { Pagination } from "@/src/types/member";

export type Attendance = {
  id: string;
  gymId: string;
  memberId: string;
  memberUuid: string;
  checkInTime: string;
  checkOutTime: string | null;
  attendanceDate: string;
  attendanceMethod: "QR" | "Manual";
  markedByStaffId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceInput = Pick<
  Attendance,
  "memberId" | "checkInTime" | "attendanceDate" | "attendanceMethod"
> & {
  checkOutTime?: string | null;
  markedByStaffId?: string | null;
  notes?: string | null;
};

export type AttendanceList = {
  attendance: Attendance[];
  pagination: Pagination;
};
