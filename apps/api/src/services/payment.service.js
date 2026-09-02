const paymentRepository = require('../repositories/payment.repository');
const { AppError } = require('../utils/app-error');

const toCents = (value) => Math.round(value * 100);

const assertMember = async (gymId, memberId) => {
  const member = await paymentRepository.findMemberForGym(gymId, memberId);

  if (!member) throw new AppError(404, 'Member not found for this gym.');
  return member;
};

const assertMembershipPlan = async (gymId, membershipPlanId) => {
  const plan = await paymentRepository.findMembershipPlanForGym(gymId, membershipPlanId);

  if (!plan) throw new AppError(404, 'Membership plan not found for this gym.');
};

const assertStaff = async (gymId, staffId) => {
  const staff = await paymentRepository.findStaffForGym(gymId, staffId);

  if (!staff) throw new AppError(404, 'Staff member not found for this gym.');
};

const validatePayment = ({
  paymentAmount,
  discountAmount,
  taxAmount,
  totalAmount,
  paymentDate,
  nextDueDate
}) => {
  if (toCents(totalAmount) !== toCents(paymentAmount - discountAmount + taxAmount)) {
    throw new AppError(400, 'Total amount must equal payment amount minus discount plus tax.');
  }

  if (nextDueDate < paymentDate) {
    throw new AppError(400, 'Next due date must be on or after the payment date.');
  }
};

const handlePaymentWriteError = (error) => {
  if (error.code === '23505') {
    throw new AppError(409, 'Transaction reference already exists for this gym.');
  }

  if (error.code === '23514' || error.code === '22007') {
    throw new AppError(400, 'Payment data violates a database constraint.');
  }

  throw error;
};

const createPayment = async (gymId, payment) => {
  const member = await assertMember(gymId, payment.memberId);
  await assertMembershipPlan(gymId, payment.membershipPlanId);
  await assertStaff(gymId, payment.collectedByStaffId);
  validatePayment(payment);

  try {
    const createdPayment = await paymentRepository.createPayment({ gymId, ...payment, memberId: member.id, memberPublicId: member.member_id });
    
    // Trigger WhatsApp receipt and FitBhuz intro asynchronously
    const whatsappService = require('./whatsapp.service');
    whatsappService.sendPaymentConfirmation(gymId, createdPayment, member).catch(() => {});

    return createdPayment;
  } catch (error) {
    handlePaymentWriteError(error);
  }
};

const listPayments = (gymId, query) => paymentRepository.listPayments(gymId, query);

const getPayment = async (gymId, paymentId) => {
  const payment = await paymentRepository.findPaymentById(gymId, paymentId);

  if (!payment) throw new AppError(404, 'Payment not found.');

  return payment;
};

const updatePayment = async (gymId, paymentId, changes) => {
  const existing = await paymentRepository.findPaymentById(gymId, paymentId);

  if (!existing) throw new AppError(404, 'Payment not found.');
  if (changes.memberId) {
    const member = await assertMember(gymId, changes.memberId);
    changes = { ...changes, memberId: member.id, memberPublicId: member.member_id };
  }
  if (changes.membershipPlanId) await assertMembershipPlan(gymId, changes.membershipPlanId);
  if (changes.collectedByStaffId) await assertStaff(gymId, changes.collectedByStaffId);

  validatePayment({
    paymentAmount: changes.paymentAmount ?? Number(existing.payment_amount),
    discountAmount: changes.discountAmount ?? Number(existing.discount_amount),
    taxAmount: changes.taxAmount ?? Number(existing.tax_amount),
    totalAmount: changes.totalAmount ?? Number(existing.total_amount),
    paymentDate: changes.paymentDate ?? existing.payment_date,
    nextDueDate: changes.nextDueDate ?? existing.next_due_date
  });

  try {
    const payment = await paymentRepository.updatePaymentById(gymId, paymentId, changes);
    return {
      ...payment,
      member_member_id: changes.memberPublicId ?? existing.member_member_id
    };
  } catch (error) {
    handlePaymentWriteError(error);
  }
};

const deletePayment = async (gymId, paymentId) => {
  const deleted = await paymentRepository.softDeletePayment(gymId, paymentId);

  if (!deleted) throw new AppError(404, 'Payment not found.');

  return deleted;
};

const getOutstandingPayments = (gymId) => paymentRepository.getOutstandingPayments(gymId);

module.exports = { createPayment, deletePayment, getOutstandingPayments, getPayment, listPayments, updatePayment };
