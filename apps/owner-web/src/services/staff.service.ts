import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type { CreateStaffInput, StaffMember, UpdateStaffInput } from "@/src/types/staff";

export async function listStaff(query?: { search?: string; role?: string; status?: string }): Promise<{ staff: StaffMember[] }> {
  const response = await apiClient.get<ApiResponse<{ staff: StaffMember[] }>>("/staff", {
    params: query,
  });
  return response.data.data;
}

export async function getStaff(id: string): Promise<{ staff: StaffMember }> {
  const response = await apiClient.get<ApiResponse<{ staff: StaffMember }>>(`/staff/${id}`);
  return response.data.data;
}

export async function createStaff(input: CreateStaffInput): Promise<{ staff: StaffMember }> {
  const response = await apiClient.post<ApiResponse<{ staff: StaffMember }>>("/staff", input);
  return response.data.data;
}

export async function updateStaff(id: string, input: UpdateStaffInput): Promise<{ staff: StaffMember }> {
  const response = await apiClient.put<ApiResponse<{ staff: StaffMember }>>(`/staff/${id}`, input);
  return response.data.data;
}

export async function updateStaffStatus(id: string, isActive: boolean): Promise<{ staff: StaffMember }> {
  const response = await apiClient.patch<ApiResponse<{ staff: StaffMember }>>(`/staff/${id}/status`, {
    isActive,
  });
  return response.data.data;
}

export async function deleteStaff(id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}

export async function resetStaffPassword(id: string, newPassword: string): Promise<void> {
  await apiClient.patch(`/staff/${id}/password`, { newPassword });
}
