import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export interface ClassPlan {
  id: string;
  gymId: string;
  classId: string;
  className: string;
  classCategory: string;
  name: string;
  description: string | null;
  price: number;
  billingPeriod: "Monthly" | "Quarterly" | "Yearly" | "Drop-In";
  sessionLimit: number | null;
  isUnlimited: boolean;
  isActive: boolean;
  activeSubscribers: number;
  totalRevenue: number;
  createdAt?: string;
}

export interface ClassOutstandingDue {
  paymentId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string;
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  paymentMethod: string;
  receiptNumber: string;
  memberUuid: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  className: string;
  planName: string;
  expiryDate?: string;
}

export interface BusinessRevenueOverview {
  businessSummary: {
    totalBusinessRevenue: number;
    gymMembershipRevenue: number;
    classRevenue: number;
  };
  gymMetrics: {
    totalRevenue: number;
    paymentCount: number;
    outstandingDues: number;
  };
  classMetrics: {
    totalRevenue: number;
    paymentCount: number;
    outstandingDues: number;
    activeClassMembers: number;
  };
  revenueByClass: Array<{
    classId: string;
    className: string;
    category: string;
    revenue: number;
    outstanding: number;
    activeMembers: number;
  }>;
  revenueByClassPlan: Array<{
    planId: string;
    planName: string;
    className: string;
    revenue: number;
    activeSubscribers: number;
  }>;
}

export async function listClassPlans(classId?: string) {
  const response = await apiClient.get<ApiResponse<{ plans: ClassPlan[] }>>("/class-plans/plans", {
    params: { classId }
  });
  return response.data.data.plans;
}

export async function createClassPlan(payload: {
  classId: string;
  name: string;
  price: number;
  description?: string;
  billingPeriod?: string;
  sessionLimit?: number | null;
  isUnlimited?: boolean;
  isActive?: boolean;
  allowedClassIds?: string[];
}) {
  const response = await apiClient.post<ApiResponse<{ plan: ClassPlan }>>("/class-plans/plans", payload);
  return response.data.data.plan;
}

export async function updateClassPlan(
  planId: string,
  payload: Partial<{
    name: string;
    price: number;
    description: string;
    billingPeriod: string;
    sessionLimit: number | null;
    isUnlimited: boolean;
    isActive: boolean;
  }>
) {
  const response = await apiClient.put<ApiResponse<{ plan: ClassPlan }>>(`/class-plans/plans/${planId}`, payload);
  return response.data.data.plan;
}

export async function deleteClassPlan(planId: string) {
  const response = await apiClient.delete<ApiResponse<null>>(`/class-plans/plans/${planId}`);
  return response.data;
}

export async function enrollMemberInClassPlan(payload: {
  memberId: string;
  classPlanId: string;
  paymentData?: {
    startDate?: string;
    totalAmount?: number;
    paidAmount?: number;
    paymentMethod?: string;
    notes?: string;
  };
}) {
  const response = await apiClient.post<ApiResponse<any>>("/class-plans/memberships/enroll", payload);
  return response.data.data;
}

export async function listClassOutstandingDues() {
  const response = await apiClient.get<ApiResponse<{ dues: ClassOutstandingDue[] }>>("/class-plans/payments/outstanding");
  return response.data.data.dues;
}

export async function recordClassDuesPayment(payload: {
  paymentId: string;
  amountPaid: number;
  paymentMethod?: string;
}) {
  const response = await apiClient.post<ApiResponse<{ payment: any }>>("/class-plans/payments/record-dues", payload);
  return response.data.data;
}

export async function getBusinessRevenueOverview(startDate?: string, endDate?: string) {
  const response = await apiClient.get<ApiResponse<BusinessRevenueOverview>>("/class-plans/revenue-overview", {
    params: { startDate, endDate }
  });
  return response.data.data;
}
