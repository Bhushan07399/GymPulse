import { apiClient } from "@/src/lib/api-client";
import type { ApiResponse } from "@/src/types/api";

export type GymProfile = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsappNumber?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstNumber?: string | null;
  legalName?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  googleMapsUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  managementContact?: string | null;
  termsAndConditions?: string | null;
  privacyPolicy?: string | null;
};

export type OperatingDaySchedule = {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type WeeklyOperatingHours = {
  monday: OperatingDaySchedule;
  tuesday: OperatingDaySchedule;
  wednesday: OperatingDaySchedule;
  thursday: OperatingDaySchedule;
  friday: OperatingDaySchedule;
  saturday: OperatingDaySchedule;
  sunday: OperatingDaySchedule;
};

export type GymSettings = {
  currency: "INR";
  timezone: string;
  date_format: "DD MMM YYYY" | "DD/MM/YYYY" | "MM/DD/YYYY";
  time_format: "12" | "24";
  default_membership_duration: number;
  default_payment_method: "Cash" | "UPI" | "Card" | "Bank Transfer";
  auto_generate_member_id: boolean;
  has_classes_enabled: boolean;
  favicon_url?: string | null;
  receipt_header?: string | null;
  receipt_footer?: string | null;
  show_gym_logo: boolean;
  show_gst: boolean;
  show_address: boolean;
  show_contact_number: boolean;
  renewal_reminder?: boolean;
  expiry_reminder?: boolean;
  payment_confirmation?: boolean;
  attendance_confirmation?: boolean;
  operating_hours?: WeeklyOperatingHours | null;
  whatsapp_number?: string | null;
  instagram_url?: string | null;
  terms_and_conditions?: string | null;
  management_contact?: string | null;
};

export type GymAttendanceQrData = {
  gymId: string;
  gymName: string;
  gymQrString: string;
  subscriptionPlan: string;
  instructions: string;
};

export const defaultOperatingHours: WeeklyOperatingHours = {
  monday: { isOpen: true, openTime: "06:00", closeTime: "22:00" },
  tuesday: { isOpen: true, openTime: "06:00", closeTime: "22:00" },
  wednesday: { isOpen: true, openTime: "06:00", closeTime: "22:00" },
  thursday: { isOpen: true, openTime: "06:00", closeTime: "22:00" },
  friday: { isOpen: true, openTime: "06:00", closeTime: "22:00" },
  saturday: { isOpen: true, openTime: "06:00", closeTime: "21:00" },
  sunday: { isOpen: false, openTime: "07:00", closeTime: "13:00" },
};

export const getGymProfile = async (): Promise<GymProfile> => {
  const response = await apiClient.get<ApiResponse<{ profile?: any; gym?: any }>>("/gyms/profile");
  const raw = response.data?.data?.profile ?? response.data?.data?.gym;
  if (!raw) {
    throw new Error("Gym profile data unavailable.");
  }
  return {
    name: raw.name || "",
    ownerName: raw.ownerName ?? raw.owner_name ?? "",
    email: raw.email || "",
    phone: raw.phone || "",
    whatsappNumber: raw.whatsappNumber ?? raw.whatsapp_number ?? null,
    address: raw.address || "",
    city: raw.city || "",
    state: raw.state || "",
    country: raw.country || "India",
    pincode: raw.pincode || "",
    gstNumber: raw.gstNumber ?? raw.gst_number ?? null,
    legalName: raw.legalName ?? raw.legal_name ?? null,
    logoUrl: raw.logoUrl ?? raw.logo_url ?? null,
    coverImageUrl: raw.coverImageUrl ?? raw.cover_image_url ?? null,
    description: raw.description ?? null,
    googleMapsUrl: raw.googleMapsUrl ?? raw.google_maps_url ?? null,
    instagramUrl: raw.instagramUrl ?? raw.instagram_url ?? null,
    facebookUrl: raw.facebookUrl ?? raw.facebook_url ?? null,
    websiteUrl: raw.websiteUrl ?? raw.website_url ?? null,
    managementContact: raw.managementContact ?? raw.management_contact ?? null,
    termsAndConditions: raw.termsAndConditions ?? raw.terms_and_conditions ?? null,
    privacyPolicy: raw.privacyPolicy ?? raw.privacy_policy ?? null,
  };
};

export const saveGymProfile = async (value: Partial<GymProfile>): Promise<GymProfile> => {
  const response = await apiClient.put<ApiResponse<{ profile?: any; gym?: any }>>("/gyms/profile", {
    name: value.name,
    owner_name: value.ownerName,
    phone: value.phone,
    whatsapp_number: value.whatsappNumber || null,
    email: value.email,
    address: value.address,
    city: value.city,
    state: value.state,
    country: value.country,
    pincode: value.pincode,
    gst_number: value.gstNumber || null,
    legal_name: value.legalName || null,
    logo_url: value.logoUrl || null,
    cover_image_url: value.coverImageUrl || null,
    description: value.description || null,
    google_maps_url: value.googleMapsUrl || null,
    instagram_url: value.instagramUrl || null,
    facebook_url: value.facebookUrl || null,
    website_url: value.websiteUrl || null,
    management_contact: value.managementContact || null,
    terms_and_conditions: value.termsAndConditions || null,
    privacy_policy: value.privacyPolicy || null,
  });
  const raw = response.data?.data?.profile ?? response.data?.data?.gym;
  if (!raw) {
    throw new Error("Failed to save gym profile.");
  }
  return {
    name: raw.name || "",
    ownerName: raw.ownerName ?? raw.owner_name ?? "",
    email: raw.email || "",
    phone: raw.phone || "",
    whatsappNumber: raw.whatsappNumber ?? raw.whatsapp_number ?? null,
    address: raw.address || "",
    city: raw.city || "",
    state: raw.state || "",
    country: raw.country || "India",
    pincode: raw.pincode || "",
    gstNumber: raw.gstNumber ?? raw.gst_number ?? null,
    legalName: raw.legalName ?? raw.legal_name ?? null,
    logoUrl: raw.logoUrl ?? raw.logo_url ?? null,
    coverImageUrl: raw.coverImageUrl ?? raw.cover_image_url ?? null,
    description: raw.description ?? null,
    googleMapsUrl: raw.googleMapsUrl ?? raw.google_maps_url ?? null,
    instagramUrl: raw.instagramUrl ?? raw.instagram_url ?? null,
    facebookUrl: raw.facebookUrl ?? raw.facebook_url ?? null,
    websiteUrl: raw.websiteUrl ?? raw.website_url ?? null,
    managementContact: raw.managementContact ?? raw.management_contact ?? null,
    termsAndConditions: raw.termsAndConditions ?? raw.terms_and_conditions ?? null,
    privacyPolicy: raw.privacyPolicy ?? raw.privacy_policy ?? null,
  };
};

export const getGymSettings = async (): Promise<GymSettings> => {
  const response = await apiClient.get<ApiResponse<{ settings?: GymSettings }>>("/gyms/settings");
  const settings = response.data?.data?.settings;
  if (!settings) {
    throw new Error("Gym settings unavailable.");
  }
  return {
    ...settings,
    operating_hours: settings.operating_hours || defaultOperatingHours,
  };
};

export const saveGymSettings = async (value: GymSettings): Promise<GymSettings> => {
  const response = await apiClient.put<ApiResponse<{ settings?: GymSettings }>>("/gyms/settings", value);
  const settings = response.data?.data?.settings;
  if (!settings) {
    throw new Error("Failed to save gym settings.");
  }
  return settings;
};

export const getGymAttendanceQr = async (): Promise<GymAttendanceQrData> => {
  const response = await apiClient.get<ApiResponse<GymAttendanceQrData>>("/gyms/qr");
  if (!response.data?.data) {
    throw new Error("Gym QR data unavailable.");
  }
  return response.data.data;
};
