const paymentService = require('../services/payment.service');
const { buildPagination } = require('../utils/pagination');

const formatDateOnly = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (str.includes('T')) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return str.slice(0, 10);
};

const formatPayment = (payment) => ({
  id: payment.id,
  gymId: payment.gym_id ?? payment.gymId,
  memberId: payment.member_member_id ?? payment.memberPublicId ?? payment.member_id ?? payment.memberId,
  memberUuid: payment.member_id ?? payment.memberUuid,
  memberName: payment.member_first_name
    ? `${payment.member_first_name} ${payment.member_last_name || ''}`.trim()
    : payment.memberName,
  memberPhone: payment.member_phone ?? payment.memberPhone,
  membershipPlanId: payment.membership_plan_id ?? payment.membershipPlanId,
  membershipPlanName: payment.membership_plan_name ?? payment.membershipPlanName,
  paymentAmount: payment.payment_amount ?? payment.paymentAmount,
  discountAmount: payment.discount_amount ?? payment.discountAmount ?? 0,
  taxAmount: payment.tax_amount ?? payment.taxAmount ?? 0,
  totalAmount: payment.total_amount ?? payment.totalAmount,
  paidAmount: payment.paid_amount ?? payment.paidAmount ?? payment.total_amount ?? payment.totalAmount,
  remainingAmount: payment.remaining_amount ?? payment.remainingAmount ?? 0,
  paymentMethod: payment.payment_method ?? payment.paymentMethod,
  paymentStatus: payment.payment_status ?? payment.paymentStatus,
  transactionReference: payment.transaction_reference ?? payment.transactionReference,
  paymentDate: formatDateOnly(payment.payment_date ?? payment.paymentDate) || formatDateOnly(payment.created_at ?? payment.createdAt) || formatDateOnly(new Date()),
  nextDueDate: formatDateOnly(payment.next_due_date ?? payment.nextDueDate),
  collectedByStaffId: payment.collected_by_staff_id ?? payment.collectedByStaffId,
  notes: payment.notes,
  createdAt: payment.created_at ?? payment.createdAt,
  updatedAt: payment.updated_at ?? payment.updatedAt
});

const create = async (request, response) => {
  const payment = await paymentService.createPayment(request.user.gymId, request.validated.body);

  response.status(201).json({
    success: true,
    message: 'Payment created successfully.',
    data: { payment: formatPayment(payment) }
  });
};

const list = async (request, response) => {
  const result = await paymentService.listPayments(request.user.gymId, request.validated.query);

  response.status(200).json({
    success: true,
    data: {
      payments: result.items.map(formatPayment),
      summary: result.summary
    },
    pagination: buildPagination({ ...request.validated.query, total: result.total })
  });
};

const get = async (request, response) => {
  const payment = await paymentService.getPayment(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    data: { payment: formatPayment(payment) }
  });
};

const update = async (request, response) => {
  const payment = await paymentService.updatePayment(
    request.user.gymId,
    request.validated.params.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Payment updated successfully.',
    data: { payment: formatPayment(payment) }
  });
};

const remove = async (request, response) => {
  await paymentService.deletePayment(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    message: 'Payment deleted successfully.'
  });
};

const getOutstanding = async (request, response) => {
  const data = await paymentService.getOutstandingPayments(request.user.gymId);

  response.status(200).json({
    success: true,
    data
  });
};

module.exports = { create, get, getOutstanding, list, remove, update };
