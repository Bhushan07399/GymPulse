export interface ClassSessionSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface AvailableGroupClass {
  id: string;
  name: string;
  category: string;
  description: string | null;
  instructorName: string | null;
  capacity: number;
  monthlyPrice: number;
  dropInPrice: number;
  isActive: boolean;
  schedule: ClassSessionSchedule[];
  bookedCount: number;
  availableSeats: number;
  isFull: boolean;
  isBookedByMember: boolean;
  memberAccessStatus?: 'INCLUDED' | 'NOT_INCLUDED' | 'NO_SESSIONS' | 'EXPIRED' | 'NO_MEMBERSHIP';
}

export interface ClassBookingRecord {
  bookingId: string;
  bookingStatus: 'Booked' | 'Attended' | 'Cancelled' | 'No Show';
  bookedAt: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  category: string;
  instructorName: string | null;
}
