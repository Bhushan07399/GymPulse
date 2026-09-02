const classPlansRepo = require('../repositories/class-plans.repository');
const classMembershipsRepo = require('../repositories/class-memberships.repository');
const revenueAnalyticsService = require('../services/revenue-analytics.service');
const { AppError } = require('../utils/app-error');

const listClassPlans = async (req, res) => {
  const { classId } = req.query;
  const plans = await classPlansRepo.listClassPlans(req.user.gymId, classId);
  res.status(200).json({ success: true, data: { plans } });
};

const getClassPlanById = async (req, res) => {
  const plan = await classPlansRepo.findClassPlanById(req.user.gymId, req.params.id);
  if (!plan) throw new AppError(404, 'Class plan not found.');
  res.status(200).json({ success: true, data: { plan } });
};

const createClassPlan = async (req, res) => {
  const { classId, name, price } = req.body;
  if (!classId || !name || price === undefined) {
    throw new AppError(400, 'classId, name, and price are required.');
  }

  const plan = await classPlansRepo.createClassPlan(req.user.gymId, req.body);
  res.status(201).json({ success: true, message: 'Class plan created successfully.', data: { plan } });
};

const updateClassPlan = async (req, res) => {
  const plan = await classPlansRepo.updateClassPlan(req.user.gymId, req.params.id, req.body);
  if (!plan) throw new AppError(404, 'Class plan not found.');
  res.status(200).json({ success: true, message: 'Class plan updated successfully.', data: { plan } });
};

const deleteClassPlan = async (req, res) => {
  await classPlansRepo.softDeleteClassPlan(req.user.gymId, req.params.id);
  res.status(200).json({ success: true, message: 'Class plan removed.' });
};

// Memberships & Dues
const enrollMember = async (req, res) => {
  const { memberId, classPlanId, paymentData } = req.body;
  if (!memberId || !classPlanId) {
    throw new AppError(400, 'memberId and classPlanId are required.');
  }

  const result = await classMembershipsRepo.enrollClassMembership(req.user.gymId, memberId, classPlanId, paymentData || {});
  res.status(201).json({ success: true, message: 'Member enrolled in class plan.', data: result });
};

const listClassOutstandingDues = async (req, res) => {
  const dues = await classMembershipsRepo.listClassOutstandingDues(req.user.gymId);
  res.status(200).json({ success: true, data: { dues } });
};

const recordClassDuesPayment = async (req, res) => {
  const { paymentId, amountPaid, paymentMethod } = req.body;
  if (!paymentId || !amountPaid) {
    throw new AppError(400, 'paymentId and amountPaid are required.');
  }

  const updated = await classMembershipsRepo.recordClassDuesPayment(req.user.gymId, paymentId, amountPaid, paymentMethod);
  res.status(200).json({ success: true, message: 'Class payment recorded.', data: { payment: updated } });
};

// Business Revenue Overview
const getBusinessRevenueOverview = async (req, res) => {
  const { startDate, endDate } = req.query;
  const overview = await revenueAnalyticsService.getBusinessRevenueOverview(req.user.gymId, startDate, endDate);
  res.status(200).json({ success: true, data: overview });
};

// Member controllers
const getMemberClassPlans = async (req, res) => {
  const plans = await classPlansRepo.listClassPlans(req.user.gymId);
  const activeMemberships = await classMembershipsRepo.listClassMemberships(req.user.gymId, req.user.sub);
  res.status(200).json({ success: true, data: { plans, activeMemberships } });
};

const getMemberClassPayments = async (req, res) => {
  const classPayments = await classMembershipsRepo.listMemberClassPayments(req.user.gymId, req.user.sub);
  res.status(200).json({ success: true, data: { classPayments } });
};

module.exports = {
  createClassPlan,
  deleteClassPlan,
  enrollMember,
  getBusinessRevenueOverview,
  getClassPlanById,
  getMemberClassPayments,
  getMemberClassPlans,
  listClassOutstandingDues,
  listClassPlans,
  recordClassDuesPayment,
  updateClassPlan
};
