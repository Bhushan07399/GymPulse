const memberAppService = require('../services/member-app.service');

const login = async (request, response) => {
  const result = await memberAppService.loginMember(request.validated.body);

  response.status(200).json({
    success: true,
    message: 'Member login successful.',
    data: result
  });
};

const validateId = async (request, response) => {
  const result = await memberAppService.validateMemberId(request.body.identifier);

  response.status(200).json({
    success: true,
    data: result
  });
};

const getDashboard = async (request, response) => {
  const dashboard = await memberAppService.getMemberDashboard(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: dashboard
  });
};

const getProfile = async (request, response) => {
  const dashboard = await memberAppService.getMemberDashboard(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: {
      profile: dashboard.profile
    }
  });
};

const updateProfile = async (request, response) => {
  const updated = await memberAppService.updateMemberProfileDetails(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { profile: updated }
  });
};

const getMembership = async (request, response) => {
  const membership = await memberAppService.getMemberMembership(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: membership
  });
};

const getPlansForRenewal = async (request, response) => {
  const plans = await memberAppService.getGymPlansForRenewal(request.user.gymId);

  response.status(200).json({
    success: true,
    data: { plans }
  });
};

const renewMembership = async (request, response) => {
  const result = await memberAppService.createMemberRenewal(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(201).json({
    success: true,
    message: 'Renewal request created successfully.',
    data: result
  });
};

const getPayments = async (request, response) => {
  const payments = await memberAppService.getMemberPaymentsList(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: { payments }
  });
};

const getReceipt = async (request, response) => {
  const receipt = await memberAppService.getMemberReceiptDetails(
    request.user.gymId,
    request.user.id,
    request.validated.params.id
  );

  response.status(200).json({
    success: true,
    data: { receipt }
  });
};

const getDigitalCard = async (request, response) => {
  const card = await memberAppService.getDigitalMemberCard(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: { card }
  });
};

const scanAttendanceQr = async (request, response) => {
  const result = await memberAppService.scanMemberAttendanceQR(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
};

const getAttendance = async (request, response) => {
  const attendance = await memberAppService.getMemberAttendanceDetails(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: attendance
  });
};

const getCrowd = async (request, response) => {
  const crowd = await memberAppService.getGymCrowdAnalyticsDetails(
    request.user.gymId
  );

  response.status(200).json({
    success: true,
    data: crowd
  });
};

const getGymQrCode = async (request, response) => {
  const gymId = request.user.gymId;
  const qrString = `GYMPULSE-GYM:${gymId}`;

  response.status(200).json({
    success: true,
    data: {
      gymId,
      gymQrString: qrString,
      instructions: 'Display this Gym QR Code at reception for member mobile check-in scanning.'
    }
  });
};

const getMeasurements = async (request, response) => {
  const data = await memberAppService.getMemberBodyMeasurementsDetails(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data
  });
};

const addMeasurement = async (request, response) => {
  const record = await memberAppService.addMemberBodyMeasurementRecord(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(201).json({
    success: true,
    message: 'Body measurement recorded successfully.',
    data: record
  });
};

const getProgress = async (request, response) => {
  const progress = await memberAppService.getMemberProgressDashboardDetails(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: progress
  });
};

const getGoals = async (request, response) => {
  const goals = await memberAppService.getMemberFitnessGoalsDetails(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: goals
  });
};

const addGoal = async (request, response) => {
  const goal = await memberAppService.addMemberFitnessGoalRecord(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(201).json({
    success: true,
    message: 'Fitness goal created successfully.',
    data: goal
  });
};

const updateGoalStatus = async (request, response) => {
  const updated = await memberAppService.updateMemberGoalStatusAction(
    request.user.gymId,
    request.user.id,
    request.validated.params.id,
    request.validated.body.status
  );

  response.status(200).json({
    success: true,
    message: 'Goal status updated.',
    data: updated
  });
};

const deleteGoal = async (request, response) => {
  await memberAppService.deleteMemberGoalAction(
    request.user.gymId,
    request.user.id,
    request.validated.params.id
  );

  response.status(200).json({
    success: true,
    message: 'Goal deleted successfully.'
  });
};

// Phase 5 Controllers
const getNotifications = async (request, response) => {
  const result = await memberAppService.getMemberNotificationsList(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    data: result
  });
};

const markNotificationRead = async (request, response) => {
  const updated = await memberAppService.markMemberNotificationRead(
    request.user.gymId,
    request.user.id,
    request.validated.params.id
  );

  response.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    data: updated
  });
};

const markAllNotificationsRead = async (request, response) => {
  await memberAppService.markAllMemberNotificationsRead(
    request.user.gymId,
    request.user.id
  );

  response.status(200).json({
    success: true,
    message: 'All notifications marked as read.'
  });
};

const changePassword = async (request, response) => {
  await memberAppService.changePasswordAction(
    request.user.gymId,
    request.user.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Password changed successfully.'
  });
};

module.exports = {
  login,
  validateId,
  getDashboard,
  getProfile,
  updateProfile,
  getMembership,
  getPlansForRenewal,
  renewMembership,
  getPayments,
  getReceipt,
  getDigitalCard,
  scanAttendanceQr,
  getAttendance,
  getCrowd,
  getGymQrCode,
  getMeasurements,
  addMeasurement,
  getProgress,
  getGoals,
  addGoal,
  updateGoalStatus,
  deleteGoal,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  changePassword
};
