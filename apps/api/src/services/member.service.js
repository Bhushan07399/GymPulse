const memberRepository = require('../repositories/member.repository');
const gymRepository = require('../repositories/gym.repository');
const whatsappService = require('./whatsapp.service');
const { AppError } = require('../utils/app-error');

const validateDateRelationships = ({ dateOfBirth, joinDate, expiryDate }) => {
  if (expiryDate && joinDate && expiryDate < joinDate) {
    throw new AppError(400, 'Member expiry date must be on or after join date.');
  }
};

const assertMembershipPlan = async (gymId, membershipPlanId) => {
  const plan = await memberRepository.findMembershipPlanForGym(gymId, membershipPlanId);

  if (!plan) {
    throw new AppError(404, 'Membership plan not found for this gym.');
  }
  return plan;
};

const handleMemberWriteError = (error) => {
  if (error.code === '23505') {
    throw new AppError(409, `Conflict constraint [${error.constraint}]: ${error.detail || error.message}`);
  }

  if (error.code === '23514' || error.code === '22007') {
    throw new AppError(400, `Database constraint violation [${error.constraint}]: ${error.detail || error.message}`);
  }

  throw error;
};

const createMember = async (gymId, member) => {
  const plan = await assertMembershipPlan(gymId, member.membershipPlanId);

  // Server-side automatic calculation of expiry date based on plan duration_in_days
  const joinDateObj = new Date(member.joinDate);
  const expiryDateObj = new Date(joinDateObj);
  expiryDateObj.setDate(expiryDateObj.getDate() + Number(plan.duration_in_days));
  const calculatedExpiryDate = expiryDateObj.toISOString().slice(0, 10);

  const memberPayload = {
    ...member,
    expiryDate: calculatedExpiryDate
  };

  try {
    const createdMember = await memberRepository.createMemberWithPayment({
      gymId,
      staffId: null,
      member: memberPayload,
      plan,
      paymentInfo: {
        paymentStatus: member.paymentStatus || 'Paid',
        amountPaid: member.amountPaid,
        paymentMethod: member.paymentMethod || 'Cash'
      }
    });

    // Trigger event-driven WhatsApp automations asynchronously
    gymRepository.findProfileById(gymId).then(async (gym) => {
      if (gym?.subscription_plan === 'Pro' || gym?.subscription_plan === 'PRO' || gym?.subscription_plan === 'Growth' || gym?.subscription_plan === 'Basic') {
        await whatsappService.sendWelcomeMessage(gymId, createdMember).catch(() => {});
        await whatsappService.sendMembershipCreatedWhatsApp(gymId, createdMember, plan).catch(() => {});
        if (createdMember.payment) {
          await whatsappService.sendPaymentConfirmation(gymId, createdMember.payment, createdMember, plan.plan_name).catch(() => {});
        }
      }
    }).catch(() => {});

    return createdMember;
  } catch (error) {
    handleMemberWriteError(error);
  }
};

const listMembers = (gymId, query) => memberRepository.listMembers(gymId, query);

const getMember = async (gymId, memberId) => {
  const member = await memberRepository.findMemberById(gymId, memberId);

  if (!member) {
    throw new AppError(404, 'Member not found.');
  }

  return member;
};

const updateMember = async (gymId, memberId, changes) => {
  const existing = await memberRepository.findMemberById(gymId, memberId);

  if (!existing) {
    throw new AppError(404, 'Member not found.');
  }

  let calculatedExpiryDate = changes.expiryDate;
  if (changes.membershipPlanId || changes.joinDate) {
    const planId = changes.membershipPlanId || existing.membership_plan_id;
    const plan = await assertMembershipPlan(gymId, planId);
    const joinDateStr = changes.joinDate || existing.join_date;
    const joinDateObj = new Date(joinDateStr);
    const expiryDateObj = new Date(joinDateObj);
    expiryDateObj.setDate(expiryDateObj.getDate() + Number(plan.duration_in_days));
    calculatedExpiryDate = expiryDateObj.toISOString().slice(0, 10);
  }

  const cleanChanges = {
    ...changes,
    ...(calculatedExpiryDate ? { expiryDate: calculatedExpiryDate } : {})
  };

  // Remove empty email so database constraint chk_members_email_format is preserved
  if (cleanChanges.email !== undefined && !String(cleanChanges.email).trim()) {
    delete cleanChanges.email;
  }

  // Remove empty optional string fields if they are blank
  if (cleanChanges.emergencyContact !== undefined && !String(cleanChanges.emergencyContact).trim()) {
    delete cleanChanges.emergencyContact;
  }
  if (cleanChanges.address !== undefined && !String(cleanChanges.address).trim()) {
    delete cleanChanges.address;
  }
  if (cleanChanges.dateOfBirth !== undefined && !String(cleanChanges.dateOfBirth).trim()) {
    delete cleanChanges.dateOfBirth;
  }

  try {
    return await memberRepository.updateMemberById(gymId, existing.id, cleanChanges);
  } catch (error) {
    handleMemberWriteError(error);
  }
};

const deleteMember = async (gymId, memberId) => {
  const member = await memberRepository.findMemberById(gymId, memberId);
  const deleted = member && (await memberRepository.softDeleteMember(gymId, member.id));

  if (!deleted) {
    throw new AppError(404, 'Member not found.');
  }

  return deleted;
};

module.exports = { createMember, deleteMember, getMember, listMembers, updateMember };
