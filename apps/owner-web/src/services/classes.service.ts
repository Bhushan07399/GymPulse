import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export interface ClassScheduleItem {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface GymClass {
  id: string;
  gymId: string;
  name: string;
  category: string;
  description: string | null;
  instructorName: string | null;
  capacity: number;
  monthlyPrice: number;
  dropInPrice: number;
  isActive: boolean;
  schedule: ClassScheduleItem[];
  bookedCount: number;
  createdAt?: string;
}

export interface ClassKPIs {
  totalClasses: number;
  activeClasses: number;
  classesToday: number;
  totalBookingsToday: number;
  totalClassMemberships?: number;
  uniqueClassMembers?: number;
}

export interface WeeklyScheduleEntry {
  scheduleId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classId: string;
  className: string;
  category: string;
  instructorName: string | null;
  capacity: number;
  monthlyPrice: number;
}

export interface ClassBookingRecord {
  bookingId: string;
  bookingStatus: "Booked" | "Attended" | "Cancelled" | "No Show";
  bookedAt: string;
  sessionId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  memberUuid: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  className: string;
  instructorName: string | null;
}

export async function getClassKPIs() {
  const response = await apiClient.get<ApiResponse<ClassKPIs>>("/classes/dashboard");
  return response.data.data;
}

export async function listGymClasses() {
  const response = await apiClient.get<ApiResponse<{ classes: GymClass[] }>>("/classes");
  return response.data.data.classes;
}

export async function getClassDetails(classId: string) {
  const response = await apiClient.get<ApiResponse<{ class: GymClass }>>(`/classes/${classId}`);
  return response.data.data.class;
}

export async function createGymClass(payload: {
  name: string;
  category: string;
  description?: string;
  instructorName?: string;
  capacity: number;
  monthlyPrice: number;
  dropInPrice?: number;
  isActive?: boolean;
  schedule: ClassScheduleItem[];
}) {
  const response = await apiClient.post<ApiResponse<{ class: GymClass }>>("/classes", payload);
  return response.data.data.class;
}

export async function updateGymClass(
  classId: string,
  payload: Partial<{
    name: string;
    category: string;
    description: string;
    instructorName: string;
    capacity: number;
    monthlyPrice: number;
    dropInPrice: number;
    isActive: boolean;
    schedule: ClassScheduleItem[];
  }>
) {
  const response = await apiClient.put<ApiResponse<{ class: GymClass }>>(`/classes/${classId}`, payload);
  return response.data.data.class;
}

export async function deleteGymClass(classId: string) {
  const response = await apiClient.delete<ApiResponse<null>>(`/classes/${classId}`);
  return response.data;
}

export async function getWeeklySchedule() {
  const response = await apiClient.get<ApiResponse<{ schedule: WeeklyScheduleEntry[] }>>("/classes/schedule");
  return response.data.data.schedule;
}

export async function listClassBookings(classId?: string, sessionId?: string) {
  const response = await apiClient.get<ApiResponse<{ bookings: ClassBookingRecord[] }>>("/classes/bookings", {
    params: { classId, sessionId }
  });
  return response.data.data.bookings;
}

export async function updateClassBookingStatus(bookingId: string, status: "Attended" | "Cancelled" | "No Show") {
  const response = await apiClient.put<ApiResponse<{ booking: any }>>(`/classes/bookings/${bookingId}/status`, { status });
  return response.data.data;
}

export async function markClassAttendance(payload: {
  classId: string;
  sessionId: string;
  memberId: string;
  status: "Attended" | "No Show";
}) {
  const response = await apiClient.post<ApiResponse<{ attendance: any }>>("/classes/attendance", payload);
  return response.data.data;
}

export async function getSessionQR(sessionId: string) {
  const response = await apiClient.get<ApiResponse<any>>(`/classes/sessions/${sessionId}/qr`);
  return response.data.data;
}

export async function getClassAttendanceAnalytics(classId?: string, category?: string) {
  const response = await apiClient.get<ApiResponse<{ analytics: any[] }>>("/classes/analytics", {
    params: { classId, category }
  });
  return response.data.data.analytics;
}
