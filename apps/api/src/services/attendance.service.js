const attendanceRepository = require('../repositories/attendance.repository');
const { AppError } = require('../utils/app-error');

const validateAttendanceTimes = ({ checkInTime, checkOutTime }) => {
  if (checkOutTime && new Date(checkOutTime) < new Date(checkInTime)) {
    throw new AppError(400, 'Check-out time must be on or after check-in time.');
  }
};

const assertMember = async (gymId, memberId) => {
  const member = await attendanceRepository.findMemberForGym(gymId, memberId);

  if (!member) {
    throw new AppError(404, 'Member not found for this gym.');
  }
  return member;
};

const assertStaff = async (gymId, staffId) => {
  if (staffId === null || staffId === undefined) return;

  const staff = await attendanceRepository.findStaffForGym(gymId, staffId);

  if (!staff) {
    throw new AppError(404, 'Staff member not found for this gym.');
  }
};

const handleAttendanceWriteError = (error) => {
  if (error.code === '23505') {
    throw new AppError(409, 'Attendance already exists for this member and date.');
  }

  if (error.code === '23514' || error.code === '22007') {
    throw new AppError(400, 'Attendance data violates a database constraint.');
  }

  throw error;
};

const createAttendance = async (gymId, attendance) => {
  const member = await assertMember(gymId, attendance.memberId);
  await assertStaff(gymId, attendance.markedByStaffId);
  validateAttendanceTimes(attendance);

  try {
    return await attendanceRepository.createAttendance({ gymId, ...attendance, memberId: member.id, memberPublicId: member.member_id });
  } catch (error) {
    handleAttendanceWriteError(error);
  }
};

const listAttendance = (gymId, query) => attendanceRepository.listAttendance(gymId, query);

const getAttendance = async (gymId, attendanceId) => {
  const attendance = await attendanceRepository.findAttendanceById(gymId, attendanceId);

  if (!attendance) {
    throw new AppError(404, 'Attendance record not found.');
  }

  return attendance;
};

const updateAttendance = async (gymId, attendanceId, changes) => {
  const existing = await attendanceRepository.findAttendanceById(gymId, attendanceId);

  if (!existing) {
    throw new AppError(404, 'Attendance record not found.');
  }

  if (changes.memberId) {
    const member = await assertMember(gymId, changes.memberId);
    changes = { ...changes, memberId: member.id, memberPublicId: member.member_id };
  }
  if (Object.prototype.hasOwnProperty.call(changes, 'markedByStaffId')) {
    await assertStaff(gymId, changes.markedByStaffId);
  }

  validateAttendanceTimes({
    checkInTime: changes.checkInTime ?? existing.check_in_time,
    checkOutTime: Object.prototype.hasOwnProperty.call(changes, 'checkOutTime')
      ? changes.checkOutTime
      : existing.check_out_time
  });

  try {
    const attendance = await attendanceRepository.updateAttendanceById(gymId, attendanceId, changes);
    return { ...attendance, member_member_id: changes.memberPublicId ?? existing.member_member_id };
  } catch (error) {
    handleAttendanceWriteError(error);
  }
};

const deleteAttendance = async (gymId, attendanceId) => {
  const deleted = await attendanceRepository.softDeleteAttendance(gymId, attendanceId);

  if (!deleted) {
    throw new AppError(404, 'Attendance record not found.');
  }

  return deleted;
};

module.exports = {
  createAttendance,
  deleteAttendance,
  getAttendance,
  listAttendance,
  updateAttendance
};
