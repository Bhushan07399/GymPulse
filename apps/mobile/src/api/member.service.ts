/**
 * obo Unified Mobile App — Member API Service
 * Interacts with authoritative member endpoints.
 */

import { apiClient } from './client';
import { attendanceService } from './attendance.service';
import { classesService } from './classes.service';
import { paymentsService } from './payments.service';
import {
  MemberDashboardSummary,
  DigitalCardData,
  MemberAttendanceHistoryResponse,
  ScanQrResult,
  AvailableGroupClass,
  ClassBookingRecord,
  UserProfile,
  Payment,
} from '../types';

export const memberService = {
  /**
   * Fetch Member Dashboard Summary
   * GET /member/dashboard
   */
  async getDashboard(): Promise<MemberDashboardSummary> {
    const res = await apiClient.get<{ data: any }>('/member/dashboard');
    const d = res.data.data;

    const profile = d.profile || d.member || {};
    const membership = d.membership || {};
    const attendance = d.attendance || {};

    const planName = profile.planName || membership.planName || profile.plan_name || 'Standard Membership';
    const expiryDate = profile.expiryDate || membership.expiryDate || profile.expiry_date || new Date().toISOString().split('T')[0];
    const daysRemaining = typeof profile.daysRemaining === 'number' ? profile.daysRemaining : (typeof membership.daysRemaining === 'number' ? membership.daysRemaining : 30);
    const isMembershipActive = profile.isMembershipActive ?? (membership.status === 'Active' || daysRemaining > 0);

    return {
      member: {
        id: profile.id || '',
        memberId: profile.memberId || profile.member_id || '',
        firstName: profile.firstName || profile.first_name || 'Member',
        lastName: profile.lastName || profile.last_name || '',
        phone: profile.phone || '',
        gymName: profile.gymName || profile.gym_name || d.gymName || 'My Gym',
        gymId: profile.gymId || profile.gym_id || '',
      },
      membership: {
        planName,
        status: isMembershipActive ? 'Active' : 'Expired',
        expiryDate: String(expiryDate).split('T')[0],
        daysRemaining,
        startDate: profile.joinDate || membership.startDate,
      },
      attendance: {
        totalCheckIns: typeof attendance.totalCheckins === 'number' ? attendance.totalCheckins : (typeof attendance.totalCheckIns === 'number' ? attendance.totalCheckIns : 0),
        lastCheckInDate: attendance.todayStatus?.checkInTime || attendance.lastCheckInDate || null,
      },
      hasClassFeature: d.hasClassFeature !== false,
      hasClassEntitlement: d.hasClassEntitlement !== false,
    };
  },

  /**
   * Fetch Member Digital ID Card & QR Token
   * GET /member/card
   */
  async getDigitalCard(): Promise<DigitalCardData> {
    const res = await apiClient.get<{ data: any }>('/member/card');
    const c = res.data.data?.card || res.data.data;

    return {
      memberId: c.memberId || c.member_id || '',
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Member',
      gymName: c.gymName || 'My Gym',
      gymId: c.gymId || '',
      qrToken: c.qrToken || c.qr_code || `GYMPULSE-MEMBER:${c.memberId || c.id}:${c.gymId}`,
      status: c.status || 'Active',
      expiryDate: c.expiryDate || new Date().toISOString().split('T')[0],
      profilePhotoUrl: c.profilePhotoUrl,
    };
  },

  /**
   * Scan Gym QR Code by Member for Entry
   * Delegates to canonical attendanceService
   */
  scanGymQr(qrPayload: string): Promise<ScanQrResult> {
    return attendanceService.memberScanGymQr(qrPayload);
  },

  /**
   * Member Check-out
   * Delegates to canonical attendanceService
   */
  checkOut(attendanceId?: string | null): Promise<ScanQrResult> {
    return attendanceService.memberCheckOut(attendanceId);
  },

  /**
   * Check in to Class Session
   * Delegates to canonical attendanceService
   */
  markClassAttendance(sessionId: string, classId: string): Promise<any> {
    return attendanceService.markClassAttendance(sessionId, classId);
  },

  /**
   * Fetch Member Attendance History
   * Delegates to canonical attendanceService
   */
  getAttendanceHistory(): Promise<MemberAttendanceHistoryResponse> {
    return attendanceService.getMemberAttendanceHistory();
  },

  /**
   * Browse Group Fitness Classes
   * Delegates to canonical classesService
   */
  browseClasses(): Promise<AvailableGroupClass[]> {
    return classesService.browseClasses();
  },

  /**
   * Fetch Member's Class Bookings
   * Delegates to canonical classesService
   */
  getMyBookings(): Promise<{ upcoming: ClassBookingRecord[]; completed: ClassBookingRecord[] }> {
    return classesService.getMyBookings();
  },

  /**
   * Book a Class Session
   * Delegates to canonical classesService
   */
  bookClass(classId: string, sessionId: string): Promise<ClassBookingRecord> {
    return classesService.bookClass(classId, sessionId);
  },

  /**
   * Cancel a Class Booking
   * Delegates to canonical classesService
   */
  cancelBooking(bookingId: string): Promise<void> {
    return classesService.cancelBooking(bookingId);
  },

  /**
   * Fetch Member Profile
   * GET /member/me
   */
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<{ data: any }>('/member/me');
    const p = res.data.data?.profile || res.data.data;
    return {
      id: p.id,
      gymId: p.gymId || p.gym_id,
      role: 'Member',
      firstName: p.firstName || p.first_name || 'Member',
      lastName: p.lastName || p.last_name || '',
      email: p.email,
      phone: p.phone,
      memberId: p.memberId || p.member_id,
    };
  },

  /**
   * Fetch Member Payment Receipts
   * Delegates to canonical paymentsService
   */
  getPayments(): Promise<Payment[]> {
    return paymentsService.getMemberPayments();
  },
};
