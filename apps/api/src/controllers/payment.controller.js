const paymentService = require('../services/payment.service');
const { buildPagination } = require('../utils/pagination');

const formatPayment = (payment) => ({
  id: payment.id,
  gymId: payment.gym_id,
  memberId: payment.member_member_id ?? payment.memberPublicId,
  memberUuid: payment.member_id,
  membershipPlanId: payment.membership_plan_id,
  paymentAmount: payment.payment_amount,
  discountAmount: payment.discount_amount,
  taxAmount: payment.tax_amount,
  totalAmount: payment.total_amount,
  paymentMethod: payment.payment_method,
  paymentStatus: payment.payment_status,
  transactionReference: payment.transaction_reference,
  paymentDate: payment.payment_date,
  nextDueDate: payment.next_due_date,
  collectedByStaffId: payment.collected_by_staff_id,
  notes: payment.notes,
  createdAt: payment.created_at,
  updatedAt: payment.updated_at
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
