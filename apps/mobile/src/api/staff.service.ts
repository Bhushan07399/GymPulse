/**
 * obo Unified Mobile App — Staff API Service
 * Scoped API access for gym staff / receptionists.
 * Server authorization remains authoritative.
 */

import { apiClient } from './client';
import { attendanceService } from './attendance.service';
import { paymentsService } from './payments.service';
import {
  AttendanceRecord,
  ScanQrInput,
  ScanQrResponse,
  Member,
  Payment,
  RecordPaymentInput,
  Pagination,
} from '../types';

export interface StaffMembersResponse {
  members: Member[];
  pagination: Pagination;
}

export const staffService = {
  /**
   * Get Today's Reception Attendance Ledger
   * Delegates to canonical attendanceService
   */
  getTodayLedger(params?: { search?: string }): Promise<AttendanceRecord[]> {
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
   * Fast Member Search / Directory Lookup
   * GET /members
   */
  async searchMembers(query?: string): Promise<Member[]> {
    const res = await apiClient.get<{ data: any }>('/members', {
      params: { search: query, limit: 20 },
    });
    const rawData = res.data.data;
    const membersList = Array.isArray(rawData) ? rawData : (rawData?.members || []);

    return membersList.map((m: any) => ({
      id: m.id,
      memberId: m.memberId || m.member_id,
      gymId: m.gymId || m.gym_id,
      membershipPlanName: m.membershipPlanName || m.membership_plan_name || m.planName,
      firstName: m.firstName || m.first_name,
      lastName: m.lastName || m.last_name || '',
      email: m.email,
      phone: m.phone,
      expiryDate: m.expiryDate || m.expiry_date,
      isActive: Boolean(m.isActive ?? m.is_active),
      outstandingAmount: Number(m.outstandingAmount ?? m.outstanding_amount ?? 0),
    }));
  },

  /**
   * Record Desk Payment
   * Delegates to canonical paymentsService
   */
  recordPayment(input: RecordPaymentInput): Promise<Payment> {
    return paymentsService.recordPayment(input);
  },
};
