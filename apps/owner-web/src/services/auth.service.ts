import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse, LoginCredentials, LoginResponse } from "@/src/types/api";

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    credentials,
  );

  return response.data.data;
}
