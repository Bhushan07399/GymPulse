const staffService = require('../services/staff.service');

const list = async (request, response) => {
  const staffMembers = await staffService.getStaffList(request.user.gymId, request.query);

  response.status(200).json({
    success: true,
    data: { staff: staffMembers }
  });
};

const get = async (request, response) => {
  const staff = await staffService.getStaffById(request.user.gymId, request.params.id);

  response.status(200).json({
    success: true,
    data: { staff }
  });
};

const create = async (request, response) => {
  const staff = await staffService.createStaff(request.user.gymId, request.body);

  response.status(201).json({
    success: true,
    message: 'Staff member created successfully.',
    data: { staff }
  });
};

const update = async (request, response) => {
  const staff = await staffService.updateStaff(
    request.user.gymId,
    request.params.id,
    request.body
  );

  response.status(200).json({
    success: true,
    message: 'Staff details updated successfully.',
    data: { staff }
  });
};

const updateStatus = async (request, response) => {
  const staff = await staffService.updateStaffStatus(
    request.user.gymId,
    request.user.id,
    request.params.id,
    request.body.isActive
  );

  response.status(200).json({
    success: true,
    message: 'Staff status updated successfully.',
    data: { staff }
  });
};

const remove = async (request, response) => {
  await staffService.deleteStaff(request.user.gymId, request.user.id, request.params.id);

  response.status(200).json({
    success: true,
    message: 'Staff member deleted successfully.'
  });
};

const resetPassword = async (request, response) => {
  await staffService.resetStaffPassword(
    request.user.gymId,
    request.params.id,
    request.body.newPassword
  );

  response.status(200).json({
    success: true,
    message: 'Staff password reset successfully.'
  });
};

module.exports = {
  list,
  get,
  create,
  update,
  updateStatus,
  remove,
  resetPassword
};
