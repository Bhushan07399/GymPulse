/**
 * obo Unified Mobile App — Attendance Types
 */

import { Member } from './member';

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'CHECKED_IN' | 'CHECKED_OUT';
  checkInMethod: 'QR' | 'MANUAL' | 'BIOMETRIC';
  member?: Partial<Member>;
  createdAt?: string;
}

export interface ScanQrInput {
  qrData: string;
}

export interface ScanQrResponse {
  message: string;
  alreadyCheckedIn: boolean;
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    expiryDate: string;
    isActive: boolean;
    membershipPlanName?: string;
  };
  attendance: {
    id: string;
    gymId: string;
    memberId: string;
    checkInTime: string;
    status: string;
    checkInMethod: string;
    createdAt: string;
  };
}

export interface EligibleClassSession {
  sessionId: string;
  classId: string;
  className: string;
  instructorName?: string;
  startTime: string;
  endTime: string;
  alreadyBooked?: boolean;
}

export interface ScanQrResult {
  action: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_COMPLETED' | 'DUPLICATE';
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  checkInTime?: string;
  checkOutTime?: string;
  attendance?: any;
  eligibleClasses?: EligibleClassSession[];
  message: string;
}

export interface MemberAttendanceItem {
  id: string;
  gymId: string;
  gymName?: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string | null;
  durationMinutes?: number;
  attendanceMethod: 'QR' | 'MANUAL' | 'BIOMETRIC';
  status: 'IN' | 'COMPLETED';
  markedByStaff?: string;
}

export interface TodayAttendance {
  id?: string;
  gymId?: string;
  gymName?: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceMethod?: string;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'NOT_CHECKED_IN';
}

export interface MemberAttendanceHistoryResponse {
  today?: TodayAttendance;
  attendance: MemberAttendanceItem[];
  totalCheckIns: number;
}
