const bmiService = require('../services/bmi.service');

const createAppointment = async (request, response) => {
  const assessment = await bmiService.createBmiAppointment(request.user.gymId, request.body);
  response.status(201).json({
    success: true,
    message: 'BMI appointment scheduled successfully.',
    data: { assessment }
  });
};

const updateAppointment = async (request, response) => {
  const assessment = await bmiService.updateBmiAppointment(request.user.gymId, request.params.id, request.body);
  response.status(200).json({
    success: true,
    message: 'BMI assessment updated successfully.',
    data: { assessment }
  });
};

const getAppointment = async (request, response) => {
  const assessment = await bmiService.getBmiAppointment(request.user.gymId, request.params.id);
  response.status(200).json({
    success: true,
    data: { assessment }
  });
};

const listAppointmentsByMember = async (request, response) => {
  const assessments = await bmiService.listBmiAppointmentsByMember(request.user.gymId, request.params.memberId);
  response.status(200).json({
    success: true,
    data: { assessments }
  });
};

const listAppointments = async (request, response) => {
  const assessments = await bmiService.listBmiAppointments(request.user.gymId, request.query);
  response.status(200).json({
    success: true,
    data: { assessments }
  });
};

const deleteAppointment = async (request, response) => {
  await bmiService.deleteBmiAppointment(request.user.gymId, request.params.id);
  response.status(200).json({
    success: true,
    message: 'BMI appointment deleted successfully.'
  });
};

module.exports = {
  createAppointment,
  updateAppointment,
  getAppointment,
  listAppointmentsByMember,
  listAppointments,
  deleteAppointment
};
