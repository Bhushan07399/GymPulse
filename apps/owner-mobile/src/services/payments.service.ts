import { apiClient } from '../lib/api-client';
import { Payment, RecordPaymentInput } from '../types/payment';
import { Pagination } from '../types/member';

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
  async getPayments(params?: GetPaymentsParams): Promise<PaymentsResponse> {
    const res = await apiClient.get<{ data: any; pagination: Pagination }>('/payments', { params });
    const rawData = res.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.payments || []);

    const mapped = items.map((p: any) => ({
      id: p.id,
      gymId: p.gymId,
      memberId: p.memberId || p.memberUuid,
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
      pagination: res.data.pagination || { page: 1, limit: 50, total: mapped.length, totalPages: 1 },
    };
  },

  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    const res = await apiClient.post<{ data: any }>('/payments', {
      memberId: input.memberId,
      paymentAmount: input.amount,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    });
    const p = res.data.data?.payment || res.data.data;

    return {
      id: p.id,
      gymId: p.gymId,
      memberId: p.memberId || input.memberId,
      amount: Number(p.totalAmount ?? p.paymentAmount ?? input.amount),
      paymentDate: p.paymentDate || new Date().toISOString(),
      paymentMethod: p.paymentMethod || input.paymentMethod,
      paymentStatus: p.paymentStatus || 'Paid',
      notes: p.notes,
      receiptNumber: p.receiptNumber || p.transactionReference || `REC-${p.id?.slice(0, 6)}`,
      createdAt: p.createdAt || new Date().toISOString(),
    };
  },
};
