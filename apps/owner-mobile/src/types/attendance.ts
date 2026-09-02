import { Member } from './member';

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  checkInTime: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  checkInMethod?: 'QR' | 'MANUAL' | 'BIOMETRIC';
  member?: Member;
  createdAt: string;
}

export interface ScanQrInput {
  qrData: string;
}

export interface ScanQrResponse {
  message: string;
  alreadyCheckedIn?: boolean;
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    phone: string;
    expiryDate: string;
    isActive: boolean;
    membershipPlanName?: string;
  };
  attendance: AttendanceRecord;
}
