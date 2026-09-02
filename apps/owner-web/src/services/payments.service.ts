import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type { Payment, PaymentList } from "@/src/types/payment";

export type PaymentSummaryTotals = {
  totalRevenue: number;
  todaysCollections: number;
};

type Response = ApiResponse<{ payments: Payment[]; summary?: PaymentSummaryTotals }> & { pagination: PaymentList["pagination"] };

export interface OutstandingMemberPayment {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  planName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  lastPaymentDate: string | null;
  expiryDate: string | null;
  isActive: boolean;
  paymentStatus: string;
}

export interface OutstandingPaymentsResponse {
  summary: {
    totalOutstanding: number;
    pendingCount: number;
  };
  members: OutstandingMemberPayment[];
}

export async function listPayments(params: {
  page: number;
  status?: Payment["paymentStatus"];
  search?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<Response>("/payments", {
    params: {
      page: params.page,
      limit: 20,
      sortBy: "paymentDate",
      order: "desc",
      ...(params.status ? { status: params.status } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.period ? { period: params.period } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
    },
  });
  return {
    payments: response.data.data.payments,
    pagination: response.data.pagination,
    summary: response.data.data.summary,
  };
}

export async function getOutstandingPayments() {
  const response = await apiClient.get<ApiResponse<OutstandingPaymentsResponse>>("/payments/outstanding");
  return response.data.data;
}

export async function createPayment(payload: {
  memberId: string;
  membershipPlanId: string;
  paymentAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer";
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  paymentDate: string;
  nextDueDate: string;
  collectedByStaffId: string;
  notes: string | null;
}) {
  const response = await apiClient.post<ApiResponse<{ payment: Payment }>>("/payments", {
    ...payload,
    transactionReference: null,
  });

  return response.data.data.payment;
}
