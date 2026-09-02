const classesService = require('../services/classes.service');

const getDashboardKPIs = async (req, res) => {
  const data = await classesService.getDashboardKPIs(req.user.gymId);
  res.status(200).json({ success: true, data });
};

const listClasses = async (req, res) => {
  const classes = await classesService.getClassesList(req.user.gymId);
  res.status(200).json({ success: true, data: { classes } });
};

const getClassById = async (req, res) => {
  const classItem = await classesService.getClassById(req.user.gymId, req.params.id);
  res.status(200).json({ success: true, data: { class: classItem } });
};

const createClass = async (req, res) => {
  const classItem = await classesService.createNewClass(req.user.gymId, req.body);
  res.status(201).json({ success: true, message: 'Class created successfully.', data: { class: classItem } });
};

const updateClass = async (req, res) => {
  const classItem = await classesService.updateExistingClass(req.user.gymId, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Class updated successfully.', data: { class: classItem } });
};

const removeClass = async (req, res) => {
  await classesService.deleteExistingClass(req.user.gymId, req.params.id);
  res.status(200).json({ success: true, message: 'Class deleted successfully.' });
};

const getWeeklySchedule = async (req, res) => {
  const schedule = await classesService.getWeeklySchedule(req.user.gymId);
  res.status(200).json({ success: true, data: { schedule } });
};

const listBookings = async (req, res) => {
  const { classId, sessionId } = req.query;
  const bookings = await classesService.getBookingsList(req.user.gymId, classId, sessionId);
  res.status(200).json({ success: true, data: { bookings } });
};

const updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const booking = await classesService.updateBooking(req.user.gymId, bookingId, status);
  res.status(200).json({ success: true, message: 'Booking status updated.', data: { booking } });
};

const markAttendance = async (req, res) => {
  const { classId, sessionId, memberId, status } = req.body;
  const attendance = await classesService.markAttendance(req.user.gymId, classId, sessionId, memberId, status);
  res.status(200).json({ success: true, message: 'Class attendance marked.', data: { attendance } });
};

const getSessionQR = async (req, res) => {
  const data = await classesService.getSessionQR(req.user.gymId, req.params.sessionId);
  res.status(200).json({ success: true, data });
};

const getClassAnalytics = async (req, res) => {
  const { classId, category } = req.query;
  const analytics = await classesService.getClassAnalytics(req.user.gymId, classId, category);
  res.status(200).json({ success: true, data: { analytics } });
};

// Member controllers
const getMemberClasses = async (req, res) => {
  const classes = await classesService.getMemberAvailableClasses(req.user.gymId, req.user.sub);
  res.status(200).json({ success: true, data: { classes } });
};

const getMemberBookings = async (req, res) => {
  const bookings = await classesService.getMemberMyBookings(req.user.gymId, req.user.sub);
  res.status(200).json({ success: true, data: { bookings } });
};

const getMemberAttendance = async (req, res) => {
  const attendance = await classesService.getMemberAttendanceHistory(req.user.gymId, req.user.sub);
  res.status(200).json({ success: true, data: attendance });
};

const memberBookClass = async (req, res) => {
  const { classId, sessionId } = req.body;
  const booking = await classesService.bookSession(req.user.gymId, classId, sessionId, req.user.sub);
  res.status(201).json({ success: true, message: 'Class booking confirmed!', data: { booking } });
};

const memberCancelBooking = async (req, res) => {
  const { id } = req.params;
  await classesService.cancelMemberBooking(req.user.gymId, id, req.user.sub);
  res.status(200).json({ success: true, message: 'Class booking cancelled.' });
};

const memberScanClassQR = async (req, res) => {
  const attendance = await classesService.memberScanClassQR(req.user.gymId, req.user.sub, req.body);
  res.status(200).json({ success: true, message: 'Class session attendance recorded!', data: { attendance } });
};

const memberCheckoutClass = async (req, res) => {
  const { sessionId } = req.body;
  const record = await classesService.memberCheckoutClass(req.user.gymId, req.user.sub, sessionId);
  res.status(200).json({ success: true, message: 'Class check-out recorded.', data: { record } });
};

module.exports = {
  createClass,
  getClassAnalytics,
  getClassById,
  getDashboardKPIs,
  getMemberAttendance,
  getMemberBookings,
  getMemberClasses,
  getSessionQR,
  getWeeklySchedule,
  listBookings,
  listClasses,
  markAttendance,
  memberBookClass,
  memberCancelBooking,
  memberCheckoutClass,
  memberScanClassQR,
  removeClass,
  updateBookingStatus,
  updateClass
};
