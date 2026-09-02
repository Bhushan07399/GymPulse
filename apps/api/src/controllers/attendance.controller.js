const attendanceService = require('../services/attendance.service');
const { buildPagination } = require('../utils/pagination');

const formatAttendance = (attendance) => ({
  id: attendance.id,
  gymId: attendance.gym_id,
  memberId: attendance.member_member_id ?? attendance.memberPublicId,
  memberUuid: attendance.member_id,
  checkInTime: attendance.check_in_time,
  checkOutTime: attendance.check_out_time,
  attendanceDate: attendance.attendance_date,
  attendanceMethod: attendance.attendance_method,
  markedByStaffId: attendance.marked_by_staff_id,
  notes: attendance.notes,
  createdAt: attendance.created_at,
  updatedAt: attendance.updated_at
});

const create = async (request, response) => {
  const attendance = await attendanceService.createAttendance(
    request.user.gymId,
    request.validated.body
  );

  response.status(201).json({
    success: true,
    message: 'Attendance created successfully.',
    data: { attendance: formatAttendance(attendance) }
  });
};

const list = async (request, response) => {
  const result = await attendanceService.listAttendance(
    request.user.gymId,
    request.validated.query
  );

  response.status(200).json({
    success: true,
    data: { attendance: result.items.map(formatAttendance) },
    pagination: buildPagination({ ...request.validated.query, total: result.total })
  });
};

const get = async (request, response) => {
  const attendance = await attendanceService.getAttendance(
    request.user.gymId,
    request.validated.params.id
  );

  response.status(200).json({
    success: true,
    data: { attendance: formatAttendance(attendance) }
  });
};

const update = async (request, response) => {
  const attendance = await attendanceService.updateAttendance(
    request.user.gymId,
    request.validated.params.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Attendance updated successfully.',
    data: { attendance: formatAttendance(attendance) }
  });
};

const remove = async (request, response) => {
  await attendanceService.deleteAttendance(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    message: 'Attendance deleted successfully.'
  });
};

module.exports = { create, get, list, remove, update };
