import { apiClient } from '../lib/api-client';
import { Member, MemberInput, MembershipPlan, Pagination } from '../types/member';

export interface GetMembersParams {
  search?: string;
  status?: string;
  membershipPlanId?: string;
  page?: number;
  limit?: number;
}

export interface MembersResponse {
  members: Member[];
  pagination: Pagination;
}

export const membersService = {
  async getMembers(params?: GetMembersParams): Promise<MembersResponse> {
    const res = await apiClient.get<{ data: any; pagination: Pagination }>('/members', { params });
    const rawData = res.data.data;
    const membersList = Array.isArray(rawData) ? rawData : (rawData?.members || []);

    return {
      members: membersList,
      pagination: res.data.pagination || { page: 1, limit: 50, total: membersList.length, totalPages: 1 },
    };
  },

  async getMemberById(id: string): Promise<Member> {
    const res = await apiClient.get<{ data: any }>(`/members/${id}`);
    const rawData = res.data.data;
    return rawData.member || rawData;
  },

  async createMember(input: MemberInput): Promise<Member> {
    const res = await apiClient.post<{ data: any }>('/members', input);
    const rawData = res.data.data;
    return rawData.member || rawData;
  },

  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const res = await apiClient.get<{ data: any }>('/membership-plans');
    const rawData = res.data.data;
    return Array.isArray(rawData) ? rawData : (rawData?.membershipPlans || []);
  },
};
