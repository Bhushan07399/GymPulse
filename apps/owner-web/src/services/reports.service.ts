import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type { Pagination } from "@/src/types/member";

export type ReportType = "member" | "payment" | "attendance" | "revenue";
export type ReportSummary = {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  renewalsDue: number;
  totalRevenue: number;
  monthRevenue: number;
};
export type ReportRow = Record<string, string | number | boolean | null>;
export type ReportParams = {
  type: ReportType;
  page?: number;
  limit?: number;
  sortBy: "name" | "expiry" | "joinDate" | "revenue";
  order: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  planId?: string;
  memberStatus?: "active" | "expired" | "due";
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  search?: string;
};

type Response = ApiResponse<{ summary: ReportSummary; rows: ReportRow[] }> & {
  pagination: Pagination;
};

export async function getReport(params: ReportParams) {
  const response = await apiClient.get<Response>("/reports", { params });
  return { ...response.data.data, pagination: response.data.pagination };
}

export async function exportReportData(params: ReportParams) {
  const response = await apiClient.get<
    ApiResponse<{ summary: ReportSummary; rows: ReportRow[]; total: number }>
  >("/reports/export", { params });
  return response.data.data;
}
