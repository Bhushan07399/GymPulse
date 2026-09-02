export interface MemberAttendanceItem {
  id: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string | null;
  attendanceMethod: 'QR' | 'Manual' | 'Barcode' | 'NFC';
  markedByStaff?: string | null;
}

export interface MemberAttendanceHistoryResponse {
  attendance: MemberAttendanceItem[];
  totalCheckIns: number;
}
