/**
 * obo Unified Mobile App — Payment Types
 */

import { Pagination } from './member';

export interface Payment {
  id: string;
  gymId: string;
  memberId: string;
  memberName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer' | string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Void';
  notes?: string;
  receiptNumber: string;
  createdAt?: string;
}

export interface RecordPaymentInput {
  memberId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  membershipPlanId?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: Pagination;
}
