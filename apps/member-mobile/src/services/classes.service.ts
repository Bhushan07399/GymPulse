import { memberApiClient } from '../lib/api-client';
import { AvailableGroupClass, ClassBookingRecord } from '../types/class';

export const memberClassesService = {
  async browseClasses(): Promise<AvailableGroupClass[]> {
    const res = await memberApiClient.get<{ data: any }>('/classes/member/browse');
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
      isFull: !!c.isFull,
      isBookedByMember: !!c.isBookedByMember,
      memberAccessStatus: c.memberAccessStatus || 'INCLUDED',
    }));
  },

  async getMyBookings(): Promise<{ upcoming: ClassBookingRecord[]; completed: ClassBookingRecord[] }> {
    const res = await memberApiClient.get<{ data: any }>('/classes/member/my-bookings');
    const d = res.data.data?.bookings || res.data.data || {};

    return {
      upcoming: Array.isArray(d.upcoming) ? d.upcoming : [],
      completed: Array.isArray(d.completed) ? d.completed : [],
    };
  },

  async bookClass(classId: string, sessionId: string): Promise<ClassBookingRecord> {
    const res = await memberApiClient.post<{ data: any }>('/classes/member/book', {
      classId,
      sessionId,
    });
    const booking = res.data.data?.booking || res.data.data;
    return booking;
  },

  async cancelBooking(bookingId: string): Promise<void> {
    await memberApiClient.delete(`/classes/member/bookings/${bookingId}`);
  },
};
