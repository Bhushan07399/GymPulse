/**
 * obo Unified Mobile App — Canonical Classes API Service
 * Single source of truth for group fitness class discovery, schedules, and bookings.
 */

import { apiClient } from './client';
import {
  AvailableGroupClass,
  ClassBookingRecord,
} from '../types';

export const classesService = {
  /**
   * Browse Group Fitness Classes (Member)
   * GET /classes/member/browse
   */
  async browseClasses(): Promise<AvailableGroupClass[]> {
    const res = await apiClient.get<{ data: any }>('/classes/member/browse');
    const items = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.classes || []);

    return items.map((c: any) => ({
      id: c.id,
      name: c.name || c.className || 'Group Fitness Class',
      category: c.category || 'Fitness',
      description: c.description || null,
      instructorName: c.instructorName || c.trainerName || null,
      capacity: c.capacity || 20,
      monthlyPrice: Number(c.monthlyPrice || 0),
      dropInPrice: Number(c.dropInPrice || 0),
      isActive: c.isActive !== false,
      schedule: Array.isArray(c.schedule) ? c.schedule : [],
      bookedCount: typeof c.bookedCount === 'number' ? c.bookedCount : 0,
      availableSeats: typeof c.availableSeats === 'number' ? c.availableSeats : (c.capacity || 20),
      isFull: Boolean(c.isFull),
      isBookedByMember: Boolean(c.isBookedByMember),
      memberAccessStatus: c.memberAccessStatus || 'INCLUDED',
    }));
  },

  /**
   * Fetch Member's Class Bookings (Member)
   * GET /classes/member/my-bookings
   */
  async getMyBookings(): Promise<{ upcoming: ClassBookingRecord[]; completed: ClassBookingRecord[] }> {
    const res = await apiClient.get<{ data: any }>('/classes/member/my-bookings');
    const d = res.data.data?.bookings || res.data.data || {};

    return {
      upcoming: Array.isArray(d.upcoming) ? d.upcoming : [],
      completed: Array.isArray(d.completed) ? d.completed : [],
    };
  },

  /**
   * Book a Class Session (Member)
   * POST /classes/member/book
   */
  async bookClass(classId: string, sessionId: string): Promise<ClassBookingRecord> {
    const res = await apiClient.post<{ data: any }>('/classes/member/book', {
      classId,
      sessionId,
    });
    return res.data.data?.booking || res.data.data;
  },

  /**
   * Cancel a Class Booking (Member)
   * DELETE /classes/member/bookings/:id
   */
  async cancelBooking(bookingId: string): Promise<void> {
    await apiClient.delete(`/classes/member/bookings/${bookingId}`);
  },
};
