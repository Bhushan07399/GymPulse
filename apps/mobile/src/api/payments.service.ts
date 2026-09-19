/**
 * obo Unified Mobile App — Canonical Payments API Service
 * Single source of truth for payment ledger, desk fee collection, and member receipt queries.
 */

import { apiClient } from './client';
import {
  Payment,
  RecordPaymentInput,
  Pagination,
} from '../types';

export interface GetPaymentsParams {
  memberId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface PaymentsResponse {
  payments: Payment[];
  pagination: Pagination;
}

export const paymentsService = {
  /**
   * Fetch Payments Ledger (Owner)
   * GET /payments
   */
  async getPayments(params?: GetPaymentsParams): Promise<PaymentsResponse> {
    const res = await apiClient.get<{ data: any; pagination: Pagination }>('/payments', { params });
    const rawData = res.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.payments || []);

    const mapped: Payment[] = items.map((p: any) => ({
      id: p.id,
      gymId: p.gymId,
      memberId: p.memberId || p.memberUuid,
      memberName: p.member ? `${p.member.firstName || ''} ${p.member.lastName || ''}`.trim() : p.memberName,
      amount: Number(p.totalAmount ?? p.paymentAmount ?? p.amount ?? 0),
      paymentDate: p.paymentDate || p.createdAt,
      paymentMethod: p.paymentMethod || 'Cash',
      paymentStatus: p.paymentStatus || 'Paid',
      notes: p.notes,
      receiptNumber: p.receiptNumber || p.transactionReference || `REC-${p.id?.slice(0, 6)}`,
      createdAt: p.createdAt,
    }));

    return {
      payments: mapped,
      pagination: res.data.pagination || {
        page: 1,
        limit: 50,
        total: mapped.length,
        totalPages: 1,
      },
    };
  },

  /**
   * Record Desk Payment (Owner & Staff)
   * POST /payments
   */
  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    const now = new Date();
    const nextDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await apiClient.post<{ data: any }>('/payments', {
      memberId: input.memberId,
      membershipPlanId: input.membershipPlanId,
      paymentAmount: input.amount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'Paid',
      paymentDate: now.toISOString().split('T')[0],
      nextDueDate,
      notes: input.notes,
    });
    const p = res.data.data?.payment || res.data.data;

    return {
      id: p.id,
      gymId: p.gymId,
      memberId: p.memberId || input.memberId,
      amount: Number(p.totalAmount ?? p.paymentAmount ?? input.amount),
      paymentDate: p.paymentDate || now.toISOString(),
      paymentMethod: p.paymentMethod || input.paymentMethod,
      paymentStatus: p.paymentStatus || 'Paid',
      notes: p.notes,
      receiptNumber: p.receiptNumber || p.transactionReference || `REC-${p.id?.slice(0, 6)}`,
      createdAt: p.createdAt || now.toISOString(),
    };
  },

  /**
   * Fetch Member's Personal Payment Receipts (Member)
   * GET /member/payments
   */
  async getMemberPayments(): Promise<Payment[]> {
    try {
      const res = await apiClient.get<{ data: any }>('/member/payments');
      const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.payments || []);
      return items.map((p: any) => ({
        id: p.id,
        gymId: p.gymId || '',
        memberId: p.memberId || '',
        amount: Number(p.amount || p.totalAmount || 0),
        paymentDate: p.paymentDate || p.createdAt,
        paymentMethod: p.paymentMethod || 'Cash',
        paymentStatus: p.paymentStatus || 'Paid',
        notes: p.notes,
        receiptNumber: p.receiptNumber || `REC-${p.id?.slice(0, 6)}`,
        createdAt: p.createdAt,
      }));
    } catch {
      return [];
    }
  },
};
