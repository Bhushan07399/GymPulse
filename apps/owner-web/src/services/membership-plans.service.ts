import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type {
  MembershipPlan,
  MembershipPlanInput,
  Pagination,
} from "@/src/types/member";

type MembershipPlanListResponse = ApiResponse<{ membershipPlans: MembershipPlan[] }> & {
  pagination: Pagination;
};

type ListMembershipPlansParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export async function listMembershipPlans(params: ListMembershipPlansParams) {
  const response = await apiClient.get<MembershipPlanListResponse>("/membership-plans", {
    params,
  });

  return {
    membershipPlans: response.data.data.membershipPlans,
    pagination: response.data.pagination,
  };
}

export async function listActiveMembershipPlans() {
  const response = await apiClient.get<MembershipPlanListResponse>("/membership-plans", {
    params: { limit: 100, status: "active" },
  });

  return response.data.data.membershipPlans;
}

export async function createMembershipPlan(plan: MembershipPlanInput) {
  const response = await apiClient.post<ApiResponse<{ membershipPlan: MembershipPlan }>>(
    "/membership-plans",
    plan,
  );

  return response.data.data.membershipPlan;
}

export async function updateMembershipPlan(id: string, plan: MembershipPlanInput) {
  const response = await apiClient.put<ApiResponse<{ membershipPlan: MembershipPlan }>>(
    `/membership-plans/${id}`,
    plan,
  );

  return response.data.data.membershipPlan;
}

export async function deleteMembershipPlan(id: string) {
  await apiClient.delete(`/membership-plans/${id}`);
}
