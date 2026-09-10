export type TodayAttendanceStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';

export interface EligibleClassSession {
  sessionId: string;
  classId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  className: string;
  category?: string;
  instructorName?: string;
  isBooked: boolean;
  alreadyAttended: boolean;
  markedAt?: string | null;
  checkoutAt?: string | null;
}

export interface TodayAttendance {
  id?: string | null;
  gymId?: string | null;
  gymName?: string | null;
  checkedIn: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  attendanceMethod?: string | null;
  status: TodayAttendanceStatus;
}

export interface MemberAttendanceItem {
  id: string;
  gymId?: string | null;
  gymName?: string | null;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string | null;
  durationMinutes?: number;
  attendanceMethod: 'QR' | 'Manual' | 'Barcode' | 'NFC' | string;
  status?: 'IN' | 'COMPLETED';
  markedByStaff?: string | null;
}

export interface MemberAttendanceHistoryResponse {
  today?: TodayAttendance;
  attendance: MemberAttendanceItem[];
  totalCheckIns: number;
}

export interface ScanQrResult {
  action: 'CHECK_IN' | 'CHECK_OUT' | 'DUPLICATE' | 'ALREADY_COMPLETED';
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  attendance?: any;
  eligibleClasses?: EligibleClassSession[];
  message: string;
}
