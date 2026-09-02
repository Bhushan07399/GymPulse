import axios from "axios";

import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";
import type { Attendance, AttendanceInput, AttendanceList } from "@/src/types/attendance";

type AttendanceListResponse = ApiResponse<{ attendance: Attendance[] }> & {
  pagination: AttendanceList["pagination"];
};

export async function listAttendance() {
  try {
    const response = await apiClient.get<AttendanceListResponse>("/attendance", {
      // Keep query values within the Attendance DTO's exact pagination and sorting constraints.
      params: { page: 1, limit: 100, sortBy: "checkInTime", order: "desc" },
    });

    return { attendance: response.data.data.attendance, pagination: response.data.pagination };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Attendance list request failed.", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.baseURL ? `${error.config.baseURL}${error.config.url ?? ""}` : error.config?.url,
        params: error.config?.params,
        status: error.response?.status,
        response: error.response?.data,
      });
    } else {
      console.error("Attendance list request failed.", error);
    }
    throw error;
  }
}

export async function createAttendance(attendance: AttendanceInput) {
  const response = await apiClient.post<ApiResponse<{ attendance: Attendance }>>("/attendance", attendance);
  return response.data.data.attendance;
}

export async function updateAttendance(id: string, attendance: Partial<AttendanceInput>) {
  const response = await apiClient.put<ApiResponse<{ attendance: Attendance }>>(`/attendance/${id}`, attendance);
  return response.data.data.attendance;
}
