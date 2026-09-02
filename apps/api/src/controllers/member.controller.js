const memberService = require('../services/member.service');
const { buildPagination } = require('../utils/pagination');

const formatMember = (member) => ({
  id: member.id,
  memberId: member.member_id,
  gymId: member.gym_id,
  membershipPlanId: member.membership_plan_id,
  firstName: member.first_name,
  lastName: member.last_name,
  gender: member.gender,
  dateOfBirth: member.date_of_birth,
  phone: member.phone,
  email: member.email,
  emergencyContact: member.emergency_contact,
  address: member.address,
  joinDate: member.join_date,
  expiryDate: member.expiry_date,
  qrCode: member.qr_code,
  profilePhotoUrl: member.profile_photo_url,
  medicalNotes: member.medical_notes,
  isActive: member.is_active,
  createdAt: member.created_at,
  updatedAt: member.updated_at
});

const create = async (request, response) => {
  const member = await memberService.createMember(request.user.gymId, request.validated.body);

  response.status(201).json({
    success: true,
    message: 'Member created successfully.',
    data: { member: formatMember(member) }
  });
};

const list = async (request, response) => {
  const result = await memberService.listMembers(request.user.gymId, request.validated.query);

  response.status(200).json({
    success: true,
    data: { members: result.items.map(formatMember) },
    pagination: buildPagination({ ...request.validated.query, total: result.total })
  });
};

const get = async (request, response) => {
  const member = await memberService.getMember(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    data: { member: formatMember(member) }
  });
};

const update = async (request, response) => {
  const member = await memberService.updateMember(
    request.user.gymId,
    request.validated.params.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Member updated successfully.',
    data: { member: formatMember(member) }
  });
};

const remove = async (request, response) => {
  await memberService.deleteMember(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    message: 'Member deleted successfully.'
  });
};

module.exports = { create, get, list, remove, update };
