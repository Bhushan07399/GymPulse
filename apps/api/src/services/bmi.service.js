const bmiRepository = require('../repositories/bmi.repository');
const memberRepository = require('../repositories/member.repository');
const whatsappService = require('./whatsapp.service');
const { AppError } = require('../utils/app-error');

const createBmiAppointment = async (gymId, data) => {
  const member = await memberRepository.findMemberById(gymId, data.memberId || data.member_id);
  if (!member) {
    throw new AppError(404, 'Member not found.');
  }

  const assessment = await bmiRepository.createBmiAssessment(gymId, data);

  // Trigger WhatsApp appointment notification asynchronously
  whatsappService.sendBmiAppointmentWhatsApp(gymId, assessment, member).catch(() => {});

  return assessment;
};

const updateBmiAppointment = async (gymId, id, data) => {
  const existing = await bmiRepository.getBmiAssessmentById(gymId, id);
  if (!existing) {
    throw new AppError(404, 'BMI assessment appointment not found.');
  }

  const updated = await bmiRepository.updateBmiAssessment(gymId, id, data);

  // If status is marked Completed, trigger WhatsApp completed notification
  if (data.status === 'Completed' || updated.status === 'Completed') {
    const member = await memberRepository.findMemberById(gymId, updated.member_id);
    if (member) {
      whatsappService.sendBmiCompletedWhatsApp(gymId, updated, member).catch(() => {});
    }
  }

  return updated;
};

const getBmiAppointment = async (gymId, id) => {
  const assessment = await bmiRepository.getBmiAssessmentById(gymId, id);
  if (!assessment) {
    throw new AppError(404, 'BMI assessment appointment not found.');
  }
  return assessment;
};

const listBmiAppointmentsByMember = async (gymId, memberId) => {
  return bmiRepository.listBmiAssessmentsByMember(gymId, memberId);
};

const listBmiAppointments = async (gymId, query) => {
  return bmiRepository.listBmiAssessments(gymId, query);
};

const deleteBmiAppointment = async (gymId, id) => {
  const existing = await bmiRepository.getBmiAssessmentById(gymId, id);
  if (!existing) {
    throw new AppError(404, 'BMI assessment appointment not found.');
  }
  return bmiRepository.deleteBmiAssessment(gymId, id);
};

module.exports = {
  createBmiAppointment,
  updateBmiAppointment,
  getBmiAppointment,
  listBmiAppointmentsByMember,
  listBmiAppointments,
  deleteBmiAppointment
};
