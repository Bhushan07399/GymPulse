import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export type BmiAssessment = {
  id: string;
  gym_id: string;
  member_id: string;
  assessment_type: "FREE" | "PAID";
  price: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: string;
  payment_status: "Paid" | "Partial" | "Unpaid" | "Free";
  appointment_date: string;
  appointment_time: string | null;
  status: "Scheduled" | "Completed" | "Cancelled";
  height: number | null;
  weight: number | null;
  bmi_score: number | null;
  report_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  member_code?: string;
};

export type BmiInput = {
  memberId: string;
  assessmentType: "FREE" | "PAID";
  price?: number;
  paidAmount?: number;
  paymentMethod?: string;
  appointmentDate: string;
  appointmentTime?: string;
  height?: number;
  weight?: number;
  bmiScore?: number;
  reportUrl?: string;
  notes?: string;
  status?: "Scheduled" | "Completed" | "Cancelled";
};

export async function createBmiAppointment(data: BmiInput) {
  const response = await apiClient.post<ApiResponse<{ assessment: BmiAssessment }>>("/bmi/appointments", data);
  return response.data.data.assessment;
}

export async function updateBmiAppointment(id: string, data: Partial<BmiInput>) {
  const response = await apiClient.put<ApiResponse<{ assessment: BmiAssessment }>>(`/bmi/appointments/${id}`, data);
  return response.data.data.assessment;
}

export async function getBmiAppointment(id: string) {
  const response = await apiClient.get<ApiResponse<{ assessment: BmiAssessment }>>(`/bmi/appointments/${id}`);
  return response.data.data.assessment;
}

export async function listBmiAppointmentsByMember(memberId: string) {
  const response = await apiClient.get<ApiResponse<{ assessments: BmiAssessment[] }>>(`/bmi/members/${memberId}`);
  return response.data.data.assessments;
}

export async function listBmiAppointments(params?: { date?: string; status?: string }) {
  const response = await apiClient.get<ApiResponse<{ assessments: BmiAssessment[] }>>("/bmi/assessments", { params });
  return response.data.data.assessments;
}

export async function deleteBmiAppointment(id: string) {
  const response = await apiClient.delete<ApiResponse<any>>(`/bmi/appointments/${id}`);
  return response.data;
}
