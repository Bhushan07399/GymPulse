import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type { Member, MemberInput, Pagination } from "@/src/types/member";

type MemberListResponse = ApiResponse<{ members: Member[] }> & {
  pagination: Pagination;
};

export type ListMembersParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "firstName" | "expiryDate";
  order?: "asc" | "desc";
  status?: "active" | "inactive" | "expired";
};

export async function listMembers(params: ListMembersParams) {
  const response = await apiClient.get<MemberListResponse>("/members", { params });

  return {
    members: response.data.data.members,
    pagination: response.data.pagination,
  };
}

export async function getMember(id: string) {
  const response = await apiClient.get<ApiResponse<{ member: Member }>>(`/members/${id}`);

  return response.data.data.member;
}

export async function createMember(member: MemberInput) {
  const response = await apiClient.post<ApiResponse<{ member: Member }>>("/members", member);

  return response.data.data.member;
}

export async function updateMember(id: string, member: MemberInput) {
  const response = await apiClient.put<ApiResponse<{ member: Member }>>(
    `/members/${id}`,
    member,
  );

  return response.data.data.member;
}

export async function deleteMember(id: string) {
  await apiClient.delete(`/members/${id}`);
}
