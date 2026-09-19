/**
 * obo Unified Mobile App — Class Types
 */

export interface ClassScheduleItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  capacity?: number;
}

export interface AvailableGroupClass {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  instructorName?: string | null;
  capacity: number;
  monthlyPrice: number;
  dropInPrice: number;
  isActive: boolean;
  schedule: ClassScheduleItem[];
  bookedCount: number;
  availableSeats: number;
  isFull: boolean;
  isBookedByMember: boolean;
  memberAccessStatus: 'INCLUDED' | 'REQUIRES_PAYMENT' | 'DROP_IN_ONLY' | 'NOT_ALLOWED';
}

export interface ClassBookingRecord {
  id: string;
  classId: string;
  className: string;
  sessionId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  instructorName?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED';
  createdAt?: string;
}
