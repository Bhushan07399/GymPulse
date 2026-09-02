import { Member } from './member';

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
  receiptNumber: string;
  member?: Member;
  createdAt: string;
}

export interface RecordPaymentInput {
  memberId: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  notes?: string;
}
