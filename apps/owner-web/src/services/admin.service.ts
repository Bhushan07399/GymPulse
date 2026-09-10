import { apiClient, ADMIN_TOKEN_KEY } from "@/src/lib/api-client";

// =============================================================================
// TYPES
// =============================================================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface DashboardPrimaryMetrics {
  totalGyms: number;
  activeGyms: number;
  trialGyms: number;
  expiredGyms: number;
  suspendedGyms: number;
  totalLocations: number;
  totalMembers: number;
  newGymsThisMonth: number;
}

export interface DashboardBusinessMetrics {
  mrr: number;
  arr: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowthPct: number;
  estimatedPlatformCosts: number;
  estimatedGrossContribution: number;
  contributionMarginPct: number;
  trialConversionRatePct: number;
  churnRatePct: number;
}

export interface DashboardOperations {
  whatsAppMessagesThisMonth: number;
  whatsAppEstimatedCost: number;
  whatsAppFailedMessages: number;
  connectedWhatsAppGyms: number;
  activeAlerts: number;
  urgentAlerts: number;
}

export interface SystemHealthData {
  timestamp: string;
  api: {
    status: string;
    uptimeSeconds: number;
    memoryUsageMb: number;
    nodeVersion: string;
    environment: string;
  };
  database: {
    status: string;
    latencyMs: number;
    activeConnections: number;
    idleConnections: number;
  };
  whatsappProvider: {
    status: string;
    mode: string;
    configured: boolean;
  };
  whatsappWebhook: {
    status: string;
    configured: boolean;
  };
  backgroundTasks: {
    status: string;
    description: string;
  };
  backup: {
    status: string;
    message: string;
  };
}

export interface DashboardData {
  primaryMetrics: DashboardPrimaryMetrics;
  businessMetrics: DashboardBusinessMetrics;
  operations: DashboardOperations;
  systemHealth: SystemHealthData;
  trends: {
    revenueTrend: Array<{ month: string; revenue: number; paymentCount: number }>;
  };
}

export interface AdminGym {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isMultiGym: boolean;
  maxLocations: number;
  billingCycle: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  isActive: boolean;
  createdAt: string;
  memberCount: number;
  whatsappEnabled: boolean;
  whatsappConfigured: boolean;
  lastActivityAt?: string;
}

export interface GymDetailData {
  gym: AdminGym & {
    address?: string;
    pincode?: string;
    whatsapp: {
      isEnabled: boolean;
      isConfigured: boolean;
      phoneNumberIdMasked?: string | null;
    };
  };
  owner: {
    id: string;
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
    role: string;
    created_at: string;
  } | null;
  locations: Array<{
    id: string;
    name: string;
    city: string;
    address?: string;
    subscription_plan: string;
    subscription_status: string;
    is_active: boolean;
    created_at: string;
  }>;
  members: {
    total: number;
    active: number;
    inactive: number;
  };
  whatsappMonthly: {
    totalMessages: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    notConfigured: number;
  };
  totalPlatformRevenue: number;
  recentAuditHistory: Array<{
    id: string;
    admin_email: string;
    action: string;
    reason: string;
    created_at: string;
  }>;
}

export interface AdminSubscription {
  gymId: string;
  gymName: string;
  ownerName: string;
  plan: string;
  status: string;
  isMultiGym: boolean;
  locations: number;
  billingCycle: string;
  trialEndsAt?: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  daysRemaining: number;
  lastPayment?: {
    id: string;
    amountPaid: number;
    eventType: string;
    createdAt: string;
  };
}

export interface SubscriptionHistoryItem {
  id: string;
  gymId: string;
  gymName: string;
  plan: string;
  isMultiGym: boolean;
  maxLocations: number;
  billingCycle: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  eventType: string;
  notes?: string;
  createdAt: string;
  createdByAdmin?: string;
}

export interface RevenueAnalyticsData {
  cashCollectedThisMonth: number;
  cashCollectedLastMonth: number;
  growthPct: number;
  mrr: number;
  arr: number;
  byPlan: Array<{ plan: string; total: number; count: number }>;
  byCycle: Array<{ cycle: string; total: number; count: number }>;
  trend: Array<{ month: string; revenue: number; paymentCount: number }>;
}

export interface PerGymUsageAndCost {
  gymId: string;
  gymName: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isMultiGym: boolean;
  locations: number;
  billingCycle: string;
  whatsapp: {
    attempted: number;
    delivered: number;
    read: number;
    failed: number;
    notConfigured: number;
    estimatedCost: number;
  };
  financials: {
    subscriptionRevenue: number;
    estimatedWhatsAppCost: number;
    directCosts: number;
    allocatedSharedCost: number;
    totalDirectAndAllocatedCost: number;
    estimatedGrossContribution: number;
    contributionMarginPct: number;
  };
}

export interface UsageAndCostsData {
  month: string;
  companyEconomics: {
    totalPlatformSubscriptionRevenue: number;
    totalWhatsAppCost: number;
    totalOperatingCosts: number;
    totalCosts: number;
    estimatedGrossContribution: number;
    contributionMarginPct: number;
    unitCostUsed: number;
    activeGymsCount: number;
    allocatedSharedCostPerGym: number;
  };
  topRankings: {
    topWhatsAppUsage: PerGymUsageAndCost[];
    topWhatsAppCost: PerGymUsageAndCost[];
    highestRevenue: PerGymUsageAndCost[];
    lowestContribution: PerGymUsageAndCost[];
  };
  gyms: PerGymUsageAndCost[];
}

export interface OperatingCostEntry {
  id: string;
  month: string;
  category: string;
  costType: string;
  gymId?: string;
  gymName?: string;
  provider: string;
  amount: number;
  currency: string;
  notes?: string;
  createdAt: string;
  createdByAdmin?: string;
}

export interface WhatsAppCostRule {
  id: string;
  provider: string;
  countryCode: string;
  category: string;
  unitCost: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface WhatsAppOperationsData {
  periodDays: number;
  totalMessages: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  notConfigured: number;
  deliveryRatePct: number;
  failureRatePct: number;
  failures: Array<{ reason: string; count: number }>;
  gymConnectionModes: {
    liveMetaApi: number;
    logOnlyMode: number;
    notConfigured: number;
  };
}

export interface AdminWhatsAppLog {
  id: string;
  gymId: string;
  gymName: string;
  automationType: string;
  templateName: string;
  maskedPhone: string;
  status: string;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt: string;
}

export interface AdminUserItem {
  id: string;
  gymId: string;
  gymName: string;
  name: string;
  email: string;
  maskedPhone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformAlert {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  title: string;
  description: string;
  alertKey: string;
  gymId?: string;
  gymName?: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId?: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  gymId?: string;
  gymName?: string;
  reason?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformSettingsData {
  settings: Record<string, any>;
  costRules: WhatsAppCostRule[];
  admins: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt?: string;
  }>;
}

// =============================================================================
// API CLIENT METHODS
// =============================================================================

export async function loginAdmin(credentials: { email: string; password: string }) {
  const res = await apiClient.post<{ success: boolean; data: { admin: AdminUser; token: string } }>(
    "/admin/auth/login",
    credentials
  );
  if (res.data?.data?.token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, res.data.data.token);
  }
  return res.data.data;
}

export async function getAdminMe() {
  const res = await apiClient.get<{ success: boolean; data: { admin: AdminUser } }>("/admin/auth/me");
  return res.data.data.admin;
}

export async function logoutAdmin() {
  try {
    await apiClient.post("/admin/auth/logout");
  } catch (_) {}
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function getAdminDashboard(): Promise<DashboardData> {
  const res = await apiClient.get<{ success: boolean; data: DashboardData }>("/admin/dashboard");
  return res.data.data;
}

export async function getAdminGyms(params?: Record<string, any>) {
  const res = await apiClient.get<{
    success: boolean;
    data: { gyms: AdminGym[]; total: number; page: number; limit: number; totalPages: number };
  }>("/admin/gyms", { params });
  return res.data.data;
}

export async function getAdminGymDetail(gymId: string): Promise<GymDetailData> {
  const res = await apiClient.get<{ success: boolean; data: GymDetailData }>(`/admin/gyms/${gymId}`);
  return res.data.data;
}

export async function suspendGym(gymId: string, reason: string) {
  const res = await apiClient.post(`/admin/gyms/${gymId}/suspend`, { reason });
  return res.data;
}

export async function reactivateGym(gymId: string, reason: string) {
  const res = await apiClient.post(`/admin/gyms/${gymId}/reactivate`, { reason });
  return res.data;
}

export async function extendGymTrial(gymId: string, days: number, reason: string) {
  const res = await apiClient.post(`/admin/gyms/${gymId}/extend-trial`, { days, reason });
  return res.data;
}

export async function changeGymSubscription(gymId: string, payload: any, reason: string) {
  const res = await apiClient.post(`/admin/gyms/${gymId}/change-subscription`, { ...payload, reason });
  return res.data;
}

export async function adjustGymLocationLimit(gymId: string, maxLocations: number, reason: string) {
  const res = await apiClient.post(`/admin/gyms/${gymId}/adjust-locations`, { maxLocations, reason });
  return res.data;
}

export async function getAdminSubscriptions(params?: Record<string, any>) {
  const res = await apiClient.get<{
    success: boolean;
    data: { subscriptions: AdminSubscription[]; total: number; page: number; limit: number; totalPages: number };
  }>("/admin/subscriptions", { params });
  return res.data.data;
}

export async function getAdminSubscriptionHistory(params?: { gymId?: string; limit?: number }) {
  const res = await apiClient.get<{
    success: boolean;
    data: { history: SubscriptionHistoryItem[] };
  }>("/admin/subscriptions/history", { params });
  return res.data.data.history;
}

export async function getAdminRevenue(): Promise<RevenueAnalyticsData> {
  const res = await apiClient.get<{ success: boolean; data: RevenueAnalyticsData }>("/admin/revenue");
  return res.data.data;
}

export async function getAdminUsageAndCosts(month?: string): Promise<UsageAndCostsData> {
  const res = await apiClient.get<{ success: boolean; data: UsageAndCostsData }>("/admin/usage-costs", {
    params: { month },
  });
  return res.data.data;
}

export async function getAdminOperatingCosts(month?: string): Promise<OperatingCostEntry[]> {
  const res = await apiClient.get<{ success: boolean; data: { costs: OperatingCostEntry[] } }>(
    "/admin/usage-costs/operating-costs",
    { params: { month } }
  );
  return res.data.data.costs;
}

export async function addAdminOperatingCost(payload: {
  month: string;
  category: string;
  provider: string;
  amount: number;
  costType?: string;
  gymId?: string;
  notes?: string;
}) {
  const res = await apiClient.post("/admin/usage-costs/operating-costs", payload);
  return res.data;
}

export async function deleteAdminOperatingCost(id: string) {
  const res = await apiClient.delete(`/admin/usage-costs/operating-costs/${id}`);
  return res.data;
}

export async function getAdminWhatsAppOperations(days?: number): Promise<WhatsAppOperationsData> {
  const res = await apiClient.get<{ success: boolean; data: WhatsAppOperationsData }>(
    "/admin/whatsapp/operations",
    { params: { days } }
  );
  return res.data.data;
}

export async function getAdminWhatsAppLogs(params?: Record<string, any>) {
  const res = await apiClient.get<{
    success: boolean;
    data: { logs: AdminWhatsAppLog[]; total: number; page: number; limit: number; totalPages: number };
  }>("/admin/whatsapp/logs", { params });
  return res.data.data;
}

export async function getAdminUsers(params?: Record<string, any>) {
  const res = await apiClient.get<{
    success: boolean;
    data: { users: AdminUserItem[]; total: number; page: number; limit: number; totalPages: number };
  }>("/admin/users", { params });
  return res.data.data;
}

export async function getAdminAlerts(params?: { status?: string; severity?: string }) {
  const res = await apiClient.get<{ success: boolean; data: { alerts: PlatformAlert[] } }>("/admin/alerts", {
    params,
  });
  return res.data.data.alerts;
}

export async function acknowledgeAlert(id: string) {
  const res = await apiClient.post(`/admin/alerts/${id}/acknowledge`);
  return res.data;
}

export async function resolveAlert(id: string) {
  const res = await apiClient.post(`/admin/alerts/${id}/resolve`);
  return res.data;
}

export async function getAdminAuditLogs(params?: Record<string, any>) {
  const res = await apiClient.get<{
    success: boolean;
    data: { logs: AdminAuditLog[]; total: number; page: number; limit: number; totalPages: number };
  }>("/admin/audit-logs", { params });
  return res.data.data;
}

export async function getAdminSystemHealth(): Promise<SystemHealthData> {
  const res = await apiClient.get<{ success: boolean; data: SystemHealthData }>("/admin/system-health");
  return res.data.data;
}

export async function getAdminSettings(): Promise<PlatformSettingsData> {
  const res = await apiClient.get<{ success: boolean; data: PlatformSettingsData }>("/admin/settings");
  return res.data.data;
}

export async function saveWhatsAppCostRule(payload: Partial<WhatsAppCostRule>) {
  const res = await apiClient.post("/admin/settings/whatsapp-cost-rules", payload);
  return res.data;
}

export async function savePlatformSetting(key: string, value: any, description?: string) {
  const res = await apiClient.post("/admin/settings", { key, value, description });
  return res.data;
}

export async function createSuperAdminUser(payload: { email: string; password: string; name: string; role?: string }) {
  const res = await apiClient.post("/admin/settings/admin-users", payload);
  return res.data;
}

export async function toggleAdminUserStatus(id: string, isActive: boolean) {
  const res = await apiClient.patch(`/admin/settings/admin-users/${id}/status`, { isActive });
  return res.data;
}