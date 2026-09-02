const classesRepository = require('../repositories/classes.repository');
const { AppError } = require('../utils/app-error');

const getDashboardKPIs = (gymId) => classesRepository.getClassDashboardKPIs(gymId);

const getClassesList = (gymId) => classesRepository.listClasses(gymId);

const getClassById = async (gymId, classId) => {
  const item = await classesRepository.findClassById(gymId, classId);
  if (!item) throw new AppError(404, 'Class not found.');
  return item;
};

const createNewClass = async (gymId, payload) => {
  if (!payload.name || !payload.name.trim()) {
    throw new AppError(400, 'Class name is required.');
  }
  if (!payload.capacity || payload.capacity <= 0) {
    throw new AppError(400, 'Class capacity must be greater than 0.');
  }
  if (payload.monthlyPrice < 0 || payload.dropInPrice < 0) {
    throw new AppError(400, 'Price cannot be negative.');
  }
  if (!payload.schedule || !Array.isArray(payload.schedule) || payload.schedule.length === 0) {
    throw new AppError(400, 'At least one day schedule is required.');
  }

  return await classesRepository.createClass(
    gymId,
    {
      name: payload.name.trim(),
      category: payload.category ?? 'Other',
      description: payload.description ?? null,
      instructorName: payload.instructorName ?? null,
      capacity: Number(payload.capacity),
      monthlyPrice: Number(payload.monthlyPrice),
      dropInPrice: Number(payload.dropInPrice ?? 0),
      isActive: payload.isActive ?? true
    },
    payload.schedule
  );
};

const updateExistingClass = async (gymId, classId, payload) => {
  const existing = await classesRepository.findClassById(gymId, classId);
  if (!existing) throw new AppError(404, 'Class not found.');

  const updated = await classesRepository.updateClass(
    gymId,
    classId,
    {
      name: payload.name ? payload.name.trim() : undefined,
      category: payload.category,
      description: payload.description,
      instructorName: payload.instructorName,
      capacity: payload.capacity !== undefined ? Number(payload.capacity) : undefined,
      monthlyPrice: payload.monthlyPrice !== undefined ? Number(payload.monthlyPrice) : undefined,
      dropInPrice: payload.dropInPrice !== undefined ? Number(payload.dropInPrice) : undefined,
      isActive: payload.isActive
    },
    payload.schedule
  );

  if (payload.schedule && Array.isArray(payload.schedule) && payload.schedule.length > 0) {
    const whatsappRepo = require('../repositories/whatsapp.repository');
    const whatsappService = require('./whatsapp.service');
    whatsappRepo.getAffectedMembersForClass(gymId, classId).then((affectedMembers) => {
      if (affectedMembers.length > 0) {
        const scheduleStr = payload.schedule.map((s) => `${s.dayOfWeek || s.day_of_week} ${s.startTime || s.start_time}`).join(', ');
        whatsappService.sendClassScheduleChangedWhatsApp(gymId, affectedMembers, updated, scheduleStr).catch(() => {});
      }
    }).catch(() => {});
  }

  return updated;
};

const deleteExistingClass = async (gymId, classId) => {
  const deleted = await classesRepository.softDeleteClass(gymId, classId);
  if (!deleted) throw new AppError(404, 'Class not found.');
  return deleted;
};

const getWeeklySchedule = (gymId) => classesRepository.getWeeklySchedule(gymId);

const getBookingsList = (gymId, classId, sessionId) =>
  classesRepository.listBookingsForClassOrSession(gymId, classId, sessionId);

const bookSession = async (gymId, classId, sessionId, memberId) => {
  try {
    return await classesRepository.bookClassSession(gymId, classId, sessionId, memberId);
  } catch (err) {
    if (err.message === 'NO_ACTIVE_MEMBERSHIP') {
      throw new AppError(403, 'No active class membership found for this class.');
    }
    if (err.message === 'CLASS_NOT_INCLUDED_IN_PLAN') {
      throw new AppError(403, 'This class is not included in your current class plan.');
    }
    if (err.message === 'MEMBERSHIP_EXPIRED') {
      throw new AppError(403, 'Your class membership has expired.');
    }
    if (err.message === 'NO_SESSIONS_REMAINING') {
      throw new AppError(400, 'No sessions remaining in your class membership.');
    }
    if (err.message === 'ALREADY_BOOKED' || err.code === '23505') {
      throw new AppError(409, 'You have already booked this class session.');
    }
    if (err.message === 'CLASS_FULL') {
      throw new AppError(400, 'Class session is full. No available seats remaining.');
    }
    if (err.message === 'SESSION_NOT_FOUND' || err.message === 'CLASS_NOT_FOUND' || err.code === '22P02') {
      throw new AppError(404, 'Class or session not found.');
    }
    throw err;
  }
};

const updateBooking = async (gymId, bookingId, status) => {
  const updated = await classesRepository.updateBookingStatus(gymId, bookingId, status);
  if (!updated) throw new AppError(404, 'Booking not found.');
  return updated;
};

const markAttendance = async (gymId, classId, sessionId, memberId, status) => {
  return await classesRepository.markAttendance(gymId, classId, sessionId, memberId, status);
};

const classMembershipsRepo = require('../repositories/class-memberships.repository');

const getMemberAvailableClasses = async (gymId, memberId) => {
  const classes = await classesRepository.listClasses(gymId);
  const activeBookings = await classesRepository.listMemberBookings(gymId, memberId);
  const activeMemberships = await classMembershipsRepo.listClassMemberships(gymId, memberId);

  const bookedClassIds = new Set(
    activeBookings.filter((b) => b.bookingStatus === 'Booked').map((b) => b.classId)
  );

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return classes
    .filter((c) => c.isActive)
    .map((c) => {
      const match = activeMemberships.find((m) => {
        const allowedIds = m.allowedClassIds || [];
        const allowedCats = m.allowedCategories || [];

        const matchesClassId = allowedIds.length === 0 || allowedIds.includes(c.id);
        const matchesCategory = allowedCats.length === 0 || allowedCats.includes(c.category);

        return matchesClassId && matchesCategory;
      });

      let accessStatus = 'NO_MEMBERSHIP';
      let sessionsRemaining = null;
      let planName = null;

      if (match) {
        planName = match.planName;
        const expiry = new Date(match.expiryDate);

        if (expiry < now) {
          accessStatus = 'EXPIRED';
        } else {
          const allowed = match.sessionsAllowed;
          const used = match.sessionsUsed;

          if (allowed !== null) {
            const rem = Math.max(0, allowed - used);
            sessionsRemaining = rem;
            accessStatus = rem > 0 ? 'INCLUDED' : 'NO_SESSIONS';
          } else {
            sessionsRemaining = 'Unlimited';
            accessStatus = 'INCLUDED';
          }
        }
      }

      return {
        ...c,
        isBookedByMember: bookedClassIds.has(c.id),
        availableSeats: Math.max(0, c.capacity - c.bookedCount),
        isFull: c.bookedCount >= c.capacity,
        memberAccessStatus: accessStatus,
        sessionsRemaining,
        membershipPlanName: planName
      };
    });
};

const getMemberMyBookings = async (gymId, memberId) => {
  const bookings = await classesRepository.listMemberBookings(gymId, memberId);
  return {
    upcoming: bookings.filter((b) => b.bookingStatus === 'Booked'),
    completed: bookings.filter((b) => b.bookingStatus === 'Attended'),
    cancelled: bookings.filter((b) => b.bookingStatus === 'Cancelled' || b.bookingStatus === 'No Show')
  };
};

const cancelMemberBooking = async (gymId, bookingId, memberId) => {
  const updated = await classesRepository.updateBookingStatus(gymId, bookingId, 'Cancelled');
  if (!updated || updated.member_id !== memberId) {
    throw new AppError(404, 'Booking not found or not authorized.');
  }
  return updated;
};

const memberScanClassQR = async (gymId, memberId, payload) => {
  let targetClassId = payload.classId;
  let targetSessionId = payload.sessionId;

  if (payload.qrPayload) {
    try {
      const parsed = typeof payload.qrPayload === 'string' ? JSON.parse(payload.qrPayload) : payload.qrPayload;
      if (parsed.classId) targetClassId = parsed.classId;
      if (parsed.sessionId) targetSessionId = parsed.sessionId;
    } catch (_err) {
      // payload wasn't JSON
    }
  }

  if (!targetClassId || !targetSessionId) {
    throw new AppError(400, 'Invalid class QR code. Missing class or session identity.');
  }

  // 1. Check if already checked in
  const history = await classesRepository.getMemberClassAttendanceHistory(gymId, memberId);
  const alreadyAttended = history.history.some(
    (h) => h.sessionId === targetSessionId && h.status === 'Attended'
  );
  if (alreadyAttended) {
    throw new AppError(400, 'You are already checked in for this session.');
  }

  // 2. Check if member has booked session, if not try to book (validates plan, quota & capacity)
  const userBookings = await classesRepository.listMemberBookings(gymId, memberId);
  const existingBooking = userBookings.find(
    (b) => b.sessionId === targetSessionId && b.bookingStatus === 'Booked'
  );

  if (!existingBooking) {
    // Will throw proper entitlement error if member lacks active plan / sessions / wrong class
    await classesRepository.bookClassSession(gymId, targetClassId, targetSessionId, memberId);
  }

  // 3. Mark attendance
  return await classesRepository.markAttendance(gymId, targetClassId, targetSessionId, memberId, 'Attended');
};

const getSessionQR = async (gymId, sessionId) => {
  const data = await classesRepository.getSessionQRData(gymId, sessionId);
  if (!data) throw new AppError(404, 'Class session not found.');
  return data;
};

const getClassAnalytics = async (gymId, classId, category) => {
  return await classesRepository.getClassAttendanceAnalytics(gymId, classId, category);
};

const getMemberAttendanceHistory = async (gymId, memberId) => {
  return await classesRepository.getMemberClassAttendanceHistory(gymId, memberId);
};

const memberCheckoutClass = async (gymId, memberId, sessionId) => {
  if (!sessionId) throw new AppError(400, 'Session ID is required for class check-out.');
  const record = await classesRepository.checkoutAttendance(gymId, sessionId, memberId);
  if (!record) throw new AppError(404, 'No active attended session found to check out.');
  return record;
};

module.exports = {
  bookSession,
  cancelMemberBooking,
  createNewClass,
  deleteExistingClass,
  getBookingsList,
  getClassAnalytics,
  getClassById,
  getClassesList,
  getDashboardKPIs,
  getMemberAttendanceHistory,
  getMemberAvailableClasses,
  getMemberMyBookings,
  getSessionQR,
  getWeeklySchedule,
  markAttendance,
  memberCheckoutClass,
  memberScanClassQR,
  updateBooking,
  updateExistingClass
};
