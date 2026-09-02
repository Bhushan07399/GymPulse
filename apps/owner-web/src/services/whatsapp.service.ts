import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export type WhatsAppSettings = {
  gym_id: string;
  is_enabled: boolean;
  phone_number_id: string | null;
  business_account_id: string | null;
  welcome_enabled: boolean;
  payment_enabled: boolean;
  reminder_enabled: boolean;
  birthday_enabled: boolean;
  updated_at: string;
};

export type WhatsAppLog = {
  id: string;
  gym_id: string;
  member_id: string | null;
  automation_type: string;
  phone_number: string;
  template_name: string;
  provider_message_id: string | null;
  status: "SENT" | "FAILED" | "SIMULATED_UNCONFIGURED";
  error_message: string | null;
  sent_at: string;
  first_name?: string;
  last_name?: string;
};

export type AutomationTemplate = {
  event_type: string;
  is_enabled: boolean;
  template_body: string;
  default_body: string;
  is_customized: boolean;
};

export type GymBranding = {
  id: string;
  gym_name: string;
  logo_url: string | null;
  gym_phone: string;
  email: string;
  address: string;
  whatsapp_number: string;
  instagram_url: string;
  terms_and_conditions: string;
  management_contact: string;
  fitbhuz_playstore_url: string;
  fitbhuz_ios_url: string;
};

export type BroadcastHistoryItem = {
  id: string;
  title: string;
  message_body: string;
  media_url: string | null;
  audience_type: string;
  recipient_count: number;
  status: string;
  sent_at: string;
};

export type AutomationStats = {
  total: number;
  sent: number;
  failed: number;
  today: number;
  month: number;
};

export async function getWhatsAppSettings() {
  const response = await apiClient.get<ApiResponse<{ settings: WhatsAppSettings }>>("/whatsapp/settings");
  return response.data.data.settings;
}

export async function updateWhatsAppSettings(data: Partial<WhatsAppSettings>) {
  const response = await apiClient.put<ApiResponse<{ settings: WhatsAppSettings }>>("/whatsapp/settings", data);
  return response.data.data.settings;
}

export async function getWhatsAppLogs() {
  const response = await apiClient.get<ApiResponse<{ logs: WhatsAppLog[] }>>("/whatsapp/logs");
  return response.data.data.logs;
}

export async function sendWhatsAppTestMessage(phone: string) {
  const response = await apiClient.post<ApiResponse<any>>("/whatsapp/test", { phone });
  return response.data;
}

export async function getAutomationTemplates() {
  const response = await apiClient.get<ApiResponse<{ templates: AutomationTemplate[] }>>("/whatsapp/templates");
  return response.data.data.templates;
}

export async function saveAutomationTemplate(payload: { eventType: string; isEnabled: boolean; templateBody: string }) {
  const response = await apiClient.put<ApiResponse<{ setting: any }>>("/whatsapp/templates", payload);
  return response.data.data.setting;
}

export async function getGymBranding() {
  const response = await apiClient.get<ApiResponse<{ branding: GymBranding }>>("/whatsapp/branding");
  return response.data.data.branding;
}

export async function updateGymBranding(data: Partial<GymBranding>) {
  const response = await apiClient.put<ApiResponse<{ branding: GymBranding }>>("/whatsapp/branding", data);
  return response.data.data.branding;
}

export async function previewBroadcast(audienceType: string, audienceFilter?: any) {
  const response = await apiClient.post<ApiResponse<{ recipientCount: number; members: any[] }>>("/whatsapp/broadcast/preview", { audienceType, audienceFilter });
  return response.data.data;
}

export async function sendBroadcast(payload: { title: string; messageBody: string; mediaUrl?: string; audienceType: string; audienceFilter?: any }) {
  const response = await apiClient.post<ApiResponse<{ broadcast: BroadcastHistoryItem; recipientCount: number }>>("/whatsapp/broadcast/send", payload);
  return response.data.data;
}

export async function getBroadcastHistory() {
  const response = await apiClient.get<ApiResponse<{ broadcasts: BroadcastHistoryItem[] }>>("/whatsapp/broadcast/history");
  return response.data.data.broadcasts;
}

export async function getAutomationStats() {
  const response = await apiClient.get<ApiResponse<{ stats: AutomationStats }>>("/whatsapp/stats");
  return response.data.data.stats;
}

export async function assignMemberClassSchedules(payload: { memberId: string; classId: string; classMembershipId?: string; scheduleIds: string[] }) {
  const response = await apiClient.post<ApiResponse<{ schedules: any[] }>>("/whatsapp/schedules/assign", payload);
  return response.data.data.schedules;
}

export async function getMemberClassSchedules(memberId: string, classId?: string) {
  const response = await apiClient.get<ApiResponse<{ schedules: any[] }>>(`/whatsapp/schedules/members/${memberId}`, { params: { classId } });
  return response.data.data.schedules;
}
