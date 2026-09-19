/**
 * obo Unified Mobile App — Owner API Service
 * Interacts with authoritative backend endpoints for gym owners.
 */

import { apiClient } from './client';
import { attendanceService, GetAttendanceParams } from './attendance.service';
import { paymentsService, GetPaymentsParams, PaymentsResponse } from './payments.service';
import {
  DashboardSummary,
  Member,
  MemberInput,
  MembershipPlan,
  Pagination,
  AttendanceRecord,
  ScanQrInput,
  ScanQrResponse,
  Payment,
  RecordPaymentInput,
  GymLocation,
} from '../types';

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

export type { GetAttendanceParams } from './attendance.service';
export type { GetPaymentsParams, PaymentsResponse } from './payments.service';

export const ownerService = {
  /**
   * Fetch Owner Dashboard KPI Summary
   * GET /dashboard/summary
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<{ data: any }>('/dashboard/summary');
    const raw = res.data.data;

    return {
      totalMembers: raw.totalMembers ?? raw.gymMemberships?.totalMembers ?? 0,
      activeMembers: raw.activeMembers ?? raw.gymMemberships?.activeMembers ?? 0,
      expiredMembers: raw.expiredMembers ?? raw.gymMemberships?.expiredMembers ?? 0,
      todayCheckIns: raw.todaysAttendance ?? raw.gymMemberships?.todaysAttendance ?? 0,
      membershipRevenue: raw.business?.gymMembershipRevenue ?? raw.gymMemberships?.revenue ?? raw.totalRevenue ?? 0,
      classRevenue: raw.business?.classRevenue ?? raw.classes?.revenue ?? 0,
      totalRevenue: raw.business?.totalBusinessRevenue ?? raw.gymMemberships?.totalRevenue ?? 0,
      outstandingAmount: raw.totalOutstanding ?? raw.gymMemberships?.totalOutstanding ?? 0,
      newJoiningsThisMonth: raw.newJoiningsThisMonth ?? raw.gymMemberships?.newJoinings ?? 0,
      activeClasses: raw.classes?.activeClasses ?? 0,
      hasClassFeature: Boolean(raw.hasClassFeature),
    };
  },

  /**
   * Fetch Members List with Search, Filter & Pagination
   * GET /members
   */
  async getMembers(params?: GetMembersParams): Promise<MembersResponse> {
    const res = await apiClient.get<{ data: any; pagination: Pagination }>('/members', { params });
    const rawData = res.data.data;
    const membersList = Array.isArray(rawData) ? rawData : (rawData?.members || []);

    const mapped: Member[] = membersList.map((m: any) => ({
      id: m.id,
      memberId: m.memberId || m.member_id,
      gymId: m.gymId || m.gym_id,
      membershipPlanId: m.membershipPlanId || m.membership_plan_id,
      membershipPlanName: m.membershipPlanName || m.membership_plan_name || m.planName || m.plan_name,
      firstName: m.firstName || m.first_name,
      lastName: m.lastName || m.last_name || '',
      email: m.email,
      phone: m.phone,
      gender: m.gender,
      joinDate: m.joinDate || m.join_date,
      expiryDate: m.expiryDate || m.expiry_date,
      isActive: Boolean(m.isActive ?? m.is_active),
      outstandingAmount: Number(m.outstandingAmount ?? m.outstanding_amount ?? 0),
      notes: m.notes,
      createdAt: m.createdAt || m.created_at,
      updatedAt: m.updatedAt || m.updated_at,
    }));

    return {
      members: mapped,
      pagination: res.data.pagination || {
        page: 1,
        limit: 50,
        total: mapped.length,
        totalPages: 1,
      },
    };
  },

  /**
   * Fetch Member Details by ID
   * GET /members/:id
   */
  async getMemberById(id: string): Promise<Member> {
    const res = await apiClient.get<{ data: any }>(`/members/${id}`);
    const m = res.data.data?.member || res.data.data;
    return {
      id: m.id,
      memberId: m.memberId || m.member_id,
      gymId: m.gymId || m.gym_id,
      membershipPlanId: m.membershipPlanId || m.membership_plan_id,
      membershipPlanName: m.membershipPlanName || m.membership_plan_name || m.planName,
      firstName: m.firstName || m.first_name,
      lastName: m.lastName || m.last_name || '',
      email: m.email,
      phone: m.phone,
      gender: m.gender,
      joinDate: m.joinDate || m.join_date,
      expiryDate: m.expiryDate || m.expiry_date,
      isActive: Boolean(m.isActive ?? m.is_active),
      outstandingAmount: Number(m.outstandingAmount ?? m.outstanding_amount ?? 0),
      notes: m.notes,
      createdAt: m.createdAt || m.created_at,
      updatedAt: m.updatedAt || m.updated_at,
    };
  },

  /**
   * Register a New Member
   * POST /members
   */
  async createMember(input: MemberInput): Promise<Member> {
    const res = await apiClient.post<{ data: any }>('/members', input);
    const m = res.data.data?.member || res.data.data;
    return {
      id: m.id,
      memberId: m.memberId || m.member_id,
      gymId: m.gymId || m.gym_id,
      membershipPlanId: m.membershipPlanId || m.membership_plan_id,
      membershipPlanName: m.membershipPlanName || m.membership_plan_name,
      firstName: m.firstName || m.first_name,
      lastName: m.lastName || m.last_name || '',
      email: m.email,
      phone: m.phone,
      gender: m.gender,
      joinDate: m.joinDate || m.join_date,
      expiryDate: m.expiryDate || m.expiry_date,
      isActive: Boolean(m.isActive ?? m.is_active),
      outstandingAmount: Number(m.outstandingAmount ?? m.outstanding_amount ?? 0),
      notes: m.notes,
    };
  },

  /**
   * Fetch Available Membership Plans
   * GET /membership-plans
   */
  async getMembershipPlans(): Promise<MembershipPlan[]> {
    const res = await apiClient.get<{ data: any }>('/membership-plans');
    const rawData = res.data.data;
    const plans = Array.isArray(rawData) ? rawData : (rawData?.membershipPlans || []);
    return plans.map((p: any) => ({
      id: p.id,
      gymId: p.gymId || p.gym_id,
      name: p.name,
      durationMonths: Number(p.durationMonths ?? p.duration_months ?? 1),
      price: Number(p.price ?? 0),
      description: p.description,
      isActive: Boolean(p.isActive ?? p.is_active ?? true),
      createdAt: p.createdAt || p.created_at,
    }));
  },

  /**
   * Fetch Today's Attendance Ledger
   * Delegates to canonical attendanceService
   */
  getAttendanceLedger(params?: GetAttendanceParams): Promise<AttendanceRecord[]> {
    return attendanceService.getLedger(params);
  },

  /**
   * Scan Member QR Code at Reception Desk
   * Delegates to canonical attendanceService
   */
  scanQrCode(input: ScanQrInput): Promise<ScanQrResponse> {
    return attendanceService.scanMemberQr(input);
  },

  /**
   * Manual Check-in by Member ID
   * Delegates to canonical attendanceService
   */
  manualCheckIn(memberId: string): Promise<AttendanceRecord> {
    return attendanceService.manualCheckIn(memberId);
  },

  /**
   * Check Out Member
   * Delegates to canonical attendanceService
   */
  checkOut(attendanceId: string): Promise<AttendanceRecord> {
    return attendanceService.checkOut(attendanceId);
  },

  /**
   * Fetch Payments History
   * Delegates to canonical paymentsService
   */
  getPayments(params?: GetPaymentsParams): Promise<PaymentsResponse> {
    return paymentsService.getPayments(params);
  },

  /**
   * Record a Member Payment
   * Delegates to canonical paymentsService
   */
  recordPayment(input: RecordPaymentInput): Promise<Payment> {
    return paymentsService.recordPayment(input);
  },

  /**
   * Fetch Multi-Gym Locations for Authenticated Owner
   * GET /auth/my-gyms
   */
  async getMyGyms(): Promise<GymLocation[]> {
    const res = await apiClient.get<{ data: any[] }>('/auth/my-gyms');
    const gyms = res.data.data || [];
    return gyms.map((g: any) => ({
      id: g.id,
      name: g.name,
      subscriptionPlan: g.subscriptionPlan || g.subscription_plan,
      subscriptionStatus: g.subscriptionStatus || g.subscription_status,
      isMultiGym: Boolean(g.isMultiGym ?? g.is_multi_gym),
      maxLocations: Number(g.maxLocations ?? g.max_locations ?? 1),
      billingCycle: g.billingCycle ?? g.billing_cycle,
      isCurrent: Boolean(g.isCurrent),
    }));
  },

  /**
   * Switch Active Gym Branch for Owner
   * POST /auth/switch-gym
   * Returns new signed JWT scoped to the new gym
   */
  async switchGym(gymId: string): Promise<{ token: string; gym: GymLocation }> {
    const res = await apiClient.post<{ data: { token: string; gym: any } }>('/auth/switch-gym', {
      targetGymId: gymId,
      gymId,
    });
    const data = res.data.data;
    return {
      token: data.token,
      gym: {
        id: data.gym.id,
        name: data.gym.name,
        subscriptionPlan: data.gym.subscriptionPlan || data.gym.subscription_plan,
        subscriptionStatus: data.gym.subscriptionStatus || data.gym.subscription_status,
        isMultiGym: Boolean(data.gym.isMultiGym ?? data.gym.is_multi_gym),
        maxLocations: Number(data.gym.maxLocations ?? data.gym.max_locations ?? 1),
        billingCycle: data.gym.billingCycle ?? data.gym.billing_cycle,
        isCurrent: true,
      },
    };
  },
};
