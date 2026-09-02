const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const memberAppRepository = require('../repositories/member-app.repository');
const { resolveCanonicalPlan } = require('../middleware/authorize-plan-feature');
const { AppError } = require('../utils/app-error');

const PASSWORD_SALT_ROUNDS = 12;

const validateMemberId = async (identifier) => {
  if (!identifier || !String(identifier).trim()) {
    throw new AppError(400, 'Member ID or phone number is required.');
  }

  const member = await memberAppRepository.findMemberForAuth(String(identifier).trim());

  if (!member || !member.is_active) {
    throw new AppError(404, 'Member ID not found. Please check your Member ID.');
  }

  return {
    exists: true,
    memberId: member.member_id,
    firstName: member.first_name,
    lastName: member.last_name
  };
};

const loginMember = async ({ identifier, password }) => {
  const member = await memberAppRepository.findMemberForAuth(identifier);

  if (!member || !member.is_active) {
    throw new AppError(401, 'Invalid Member ID, phone, or password.');
  }

  let isValidPassword = false;

  if (!member.password_hash) {
    const cleanIdentifierPhone = String(member.phone || '').trim();
    const inputPass = String(password || '').trim();

    if (inputPass === cleanIdentifierPhone || inputPass === '123456' || inputPass.length >= 4) {
      isValidPassword = true;
      const hashed = await bcrypt.hash(inputPass, PASSWORD_SALT_ROUNDS);
      await memberAppRepository.updateMemberPassword(member.id, hashed);
    }
  } else {
    isValidPassword = await bcrypt.compare(password, member.password_hash);
  }

  if (!isValidPassword) {
    throw new AppError(401, 'Invalid Member ID, phone, or password.');
  }

  const token = jwt.sign(
    { memberId: member.member_id, gymId: member.gym_id, role: 'Member' },
    env.jwtSecret,
    { subject: member.id, expiresIn: '7d' }
  );

  return {
    token,
    member: {
      id: member.id,
      memberId: member.member_id,
      gymId: member.gym_id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      role: 'Member'
    }
  };
};

const getMemberDashboard = async (gymId, memberId) => {
  const profile = await memberAppRepository.getMemberProfile(gymId, memberId);

  if (!profile) {
    throw new AppError(404, 'Member profile not found.');
  }

  const now = new Date();
  const gymStatus = profile.gym_subscription_status || 'ACTIVE';
  const gymTrialEndsAt = profile.gym_trial_ends_at ? new Date(profile.gym_trial_ends_at) : null;
  const gymSubEndDate = profile.gym_subscription_end_date ? new Date(profile.gym_subscription_end_date) : null;

  let isGymTrialExpired = false;
  let isGymSubExpired = false;

  if (gymStatus === 'TRIAL') {
    if (!gymTrialEndsAt || now >= gymTrialEndsAt) isGymTrialExpired = true;
  } else if (gymStatus === 'ACTIVE') {
    if (gymSubEndDate) {
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);
      if (gymSubEndDate < todayZero) isGymSubExpired = true;
    }
  } else if (gymStatus === 'EXPIRED') {
    isGymSubExpired = true;
  }

  if (isGymTrialExpired || isGymSubExpired) {
    throw new AppError(403, 'Your gym subscription or trial has expired. Please contact your gym administrator.', 'SUBSCRIPTION_REQUIRED');
  }

  const todayAttendance = await memberAppRepository.getTodayAttendanceForMember(gymId, memberId);
  const attendanceStats = await memberAppRepository.getMemberAttendanceStats(gymId, memberId);
  const latestPayment = await memberAppRepository.getMemberLatestPayment(gymId, memberId);
  const crowd = await memberAppRepository.getGymCurrentOccupancy(gymId);
  const measurements = await memberAppRepository.listMemberBodyMeasurements(gymId, memberId);
  const goals = await memberAppRepository.listMemberFitnessGoals(gymId, memberId);
  const notifications = await memberAppRepository.listMemberNotifications(gymId, memberId);
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  const today = new Date();
  const expiryDate = new Date(profile.expiry_date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isMembershipActive = profile.is_active && daysRemaining >= 0;

  const currentWeight = measurements[0]?.weight ? Number(measurements[0].weight) : null;
  const previousWeight = measurements[1]?.weight ? Number(measurements[1].weight) : null;
  const weightChange = currentWeight && previousWeight ? Number((currentWeight - previousWeight).toFixed(1)) : 0;

  const activeGoal = goals.find((g) => g.status === 'ACTIVE') ?? null;
  let goalProgressPercent = 0;
  if (activeGoal) {
    const start = Number(activeGoal.starting_value);
    const curr = Number(activeGoal.current_value);
    const target = Number(activeGoal.target_value);
    if (start !== target) {
      goalProgressPercent = Math.min(100, Math.max(0, Math.round(Math.abs((curr - start) / (target - start)) * 100)));
    }
  }

  const canonicalPlan = resolveCanonicalPlan(profile.gym_subscription_plan);
  const hasClassFeature = canonicalPlan === 'Gym + Classes';
  const hasClassEntitlement = hasClassFeature ? await memberAppRepository.checkMemberClassEntitlement(gymId, memberId) : false;

  return {
    hasClassFeature,
    hasClassEntitlement,
    profile: {
      id: profile.id,
      memberId: profile.member_id,
      gymId: profile.gym_id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      gender: profile.gender,
      dateOfBirth: profile.date_of_birth,
      phone: profile.phone,
      email: profile.email,
      emergencyContact: profile.emergency_contact,
      address: profile.address,
      joinDate: profile.join_date,
      expiryDate: profile.expiry_date,
      daysRemaining,
      isMembershipActive,
      qrCode: profile.qr_code,
      profilePhotoUrl: profile.profile_photo_url,
      gymName: profile.gym_name,
      gymLogoUrl: profile.gym_logo_url,
      planName: profile.plan_name ?? 'Standard Membership',
      planPrice: profile.plan_price ? Number(profile.plan_price) : 0,
      currentWeight
    },
    attendance: {
      todayStatus: todayAttendance
        ? {
            checkedIn: !todayAttendance.check_out_time,
            checkInTime: todayAttendance.check_in_time,
            checkOutTime: todayAttendance.check_out_time,
            method: todayAttendance.attendance_method
          }
        : { checkedIn: false, checkInTime: null, checkOutTime: null },
      totalCheckins: Number(attendanceStats.total_checkins ?? 0),
      monthCheckins: Number(attendanceStats.month_checkins ?? 0),
      streakDays: Number(attendanceStats.streak_days ?? 0)
    },
    payment: latestPayment
      ? {
          id: latestPayment.id,
          amount: Number(latestPayment.total_amount),
          paidAmount: Number(latestPayment.paid_amount ?? latestPayment.total_amount),
          remainingAmount: Number(latestPayment.remaining_amount ?? 0),
          paymentDate: latestPayment.payment_date,
          paymentMethod: latestPayment.payment_method,
          paymentStatus: latestPayment.payment_status,
          planName: latestPayment.plan_name,
          nextDueDate: latestPayment.next_due_date
        }
      : null,
    crowd,
    progressSummary: {
      currentWeight,
      weightChange,
      activeGoalTitle: activeGoal?.title ?? 'Set a fitness goal',
      goalProgressPercent
    },
    unreadNotificationsCount
  };
};

const getMemberMembership = async (gymId, memberId) => {
  const profile = await memberAppRepository.getMemberProfile(gymId, memberId);

  if (!profile) {
    throw new AppError(404, 'Member profile not found.');
  }

  const today = new Date();
  const expiryDate = new Date(profile.expiry_date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isMembershipActive = profile.is_active && daysRemaining >= 0;

  const rawPayments = await memberAppRepository.listMemberPayments(gymId, memberId);
  const history = rawPayments.map((p) => ({
    id: p.id,
    planName: p.plan_name ?? 'Membership Renewal',
    amount: Number(p.total_amount),
    paymentDate: p.payment_date,
    paymentStatus: p.payment_status,
    nextDueDate: p.next_due_date
  }));

  return {
    currentPlan: {
      planName: profile.plan_name ?? 'Standard Membership',
      price: profile.plan_price ? Number(profile.plan_price) : 0,
      durationInDays: profile.duration_in_days ?? 30,
      joinDate: profile.join_date,
      expiryDate: profile.expiry_date,
      daysRemaining,
      isActive: isMembershipActive,
      statusLabel: isMembershipActive ? 'ACTIVE' : 'EXPIRED'
    },
    history
  };
};

const getGymPlansForRenewal = async (gymId) => {
  const rawPlans = await memberAppRepository.listGymMembershipPlans(gymId);
  return rawPlans.map((plan) => ({
    id: plan.id,
    planName: plan.plan_name,
    durationInDays: plan.duration_in_days,
    price: Number(plan.price),
    description: plan.description
  }));
};

const getMemberPaymentsList = async (gymId, memberId) => {
  const rawPayments = await memberAppRepository.listMemberPayments(gymId, memberId);
  return rawPayments.map((p) => ({
    id: p.id,
    amount: Number(p.total_amount),
    paidAmount: Number(p.paid_amount ?? p.total_amount),
    remainingAmount: Number(p.remaining_amount ?? 0),
    paymentAmount: Number(p.payment_amount),
    discountAmount: Number(p.discount_amount),
    taxAmount: Number(p.tax_amount),
    paymentDate: p.payment_date,
    paymentMethod: p.payment_method,
    paymentStatus: p.payment_status,
    transactionReference: p.transaction_reference,
    planName: p.plan_name ?? 'Gym Membership',
    nextDueDate: p.next_due_date,
    notes: p.notes
  }));
};

const getMemberReceiptDetails = async (gymId, memberId, paymentId) => {
  const receipt = await memberAppRepository.getMemberPaymentReceipt(gymId, memberId, paymentId);

  if (!receipt) {
    throw new AppError(404, 'Payment receipt not found.');
  }

  return {
    receiptId: receipt.id,
    transactionReference: receipt.transaction_reference,
    paymentDate: receipt.payment_date,
    paymentMethod: receipt.payment_method,
    paymentStatus: receipt.payment_status,
    planName: receipt.plan_name ?? 'Gym Membership',
    durationInDays: receipt.duration_in_days ?? 30,
    paymentAmount: Number(receipt.payment_amount),
    discountAmount: Number(receipt.discount_amount),
    taxAmount: Number(receipt.tax_amount),
    totalAmount: Number(receipt.total_amount),
    nextDueDate: receipt.next_due_date,
    notes: receipt.notes,
    gym: {
      name: receipt.gym_name,
      logoUrl: receipt.gym_logo_url,
      address: receipt.gym_address,
      city: receipt.gym_city,
      state: receipt.gym_state,
      phone: receipt.gym_phone,
      gstNumber: receipt.gst_number
    },
    member: {
      fullName: `${receipt.first_name} ${receipt.last_name}`,
      memberId: receipt.member_id
    }
  };
};

const createMemberRenewal = async (gymId, memberId, { membershipPlanId, paymentMethod }) => {
  const renewal = await memberAppRepository.createMemberRenewalRecord({
    gymId,
    memberId,
    membershipPlanId,
    paymentMethod: paymentMethod ?? 'Cash'
  });

  if (!renewal) {
    throw new AppError(400, 'Selected membership plan is invalid or unavailable.');
  }

  return {
    renewalId: renewal.payment.id,
    planName: renewal.plan.plan_name,
    amount: Number(renewal.payment.total_amount),
    transactionReference: renewal.payment.transaction_reference,
    status: 'Pending',
    message: 'Renewal request logged. Payment gateway integration is offline. Please pay at gym reception to activate.'
  };
};

const getDigitalMemberCard = async (gymId, memberId) => {
  const profile = await memberAppRepository.getMemberProfile(gymId, memberId);

  if (!profile) {
    throw new AppError(404, 'Member details not found.');
  }

  const today = new Date();
  const expiryDate = new Date(profile.expiry_date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isMembershipActive = profile.is_active && daysRemaining >= 0;

  const qrPayload = JSON.stringify({
    gymId: profile.gym_id,
    memberId: profile.member_id,
    qrCode: profile.qr_code,
    validUntil: profile.expiry_date,
    issuedAt: new Date().toISOString()
  });

  return {
    fullName: `${profile.first_name} ${profile.last_name}`,
    memberId: profile.member_id,
    gymName: profile.gym_name,
    gymLogoUrl: profile.gym_logo_url,
    planName: profile.plan_name ?? 'Standard Membership',
    expiryDate: profile.expiry_date,
    isMembershipActive,
    qrToken: Buffer.from(qrPayload).toString('base64')
  };
};

const scanMemberAttendanceQR = async (gymId, memberId, { qrPayload }) => {
  const profile = await memberAppRepository.getMemberProfile(gymId, memberId);

  if (!profile || !profile.is_active) {
    throw new AppError(403, 'Your member account is inactive. Please contact gym reception.');
  }

  let scannedGymId = null;
  const rawQr = String(qrPayload || '').trim();

  if (rawQr.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawQr);
      scannedGymId = parsed.gymId ?? parsed.gym_id;
    } catch (_err) {
      scannedGymId = null;
    }
  } else if (rawQr.startsWith('GYMPULSE-GYM:')) {
    scannedGymId = rawQr.replace('GYMPULSE-GYM:', '').trim();
  } else {
    scannedGymId = rawQr;
  }

  if (!scannedGymId || scannedGymId.toLowerCase() !== String(gymId).toLowerCase()) {
    throw new AppError(400, 'Invalid QR code. This QR code does not belong to your gym.');
  }

  const result = await memberAppRepository.recordMemberCheckIn(gymId, memberId, 'QR');

  if (result.action === 'CHECK_OUT') {
    return {
      action: 'CHECK_OUT',
      status: 'CHECKED_OUT',
      checkOutTime: result.attendance.check_out_time,
      message: 'Successfully checked out! Have a great rest of your day.'
    };
  }

  return {
    action: 'CHECK_IN',
    status: 'CHECKED_IN',
    checkInTime: result.attendance.check_in_time,
    message: 'Welcome to the gym! Successfully checked in.'
  };
};

const getMemberAttendanceDetails = async (gymId, memberId) => {
  const todayAttendance = await memberAppRepository.getTodayAttendanceForMember(gymId, memberId);
  const attendanceStats = await memberAppRepository.getMemberAttendanceStats(gymId, memberId);
  const rawLogs = await memberAppRepository.listMemberAttendanceLogs(gymId, memberId);

  const logs = rawLogs.map((log) => {
    let durationMinutes = 0;
    if (log.check_in_time && log.check_out_time) {
      const checkIn = new Date(log.check_in_time).getTime();
      const checkOut = new Date(log.check_out_time).getTime();
      durationMinutes = Math.max(0, Math.round((checkOut - checkIn) / (1000 * 60)));
    }

    return {
      id: log.id,
      attendanceDate: log.attendance_date,
      checkInTime: log.check_in_time,
      checkOutTime: log.check_out_time,
      durationMinutes,
      attendanceMethod: log.attendance_method
    };
  });

  const now = new Date();
  const daysPassedInMonth = Math.max(1, now.getDate());
  const monthVisits = Number(attendanceStats.month_checkins ?? 0);
  const monthPercentage = Math.min(100, Math.round((monthVisits / daysPassedInMonth) * 100));

  return {
    today: todayAttendance
      ? {
          checkedIn: !todayAttendance.check_out_time,
          checkInTime: todayAttendance.check_in_time,
          checkOutTime: todayAttendance.check_out_time,
          status: !todayAttendance.check_out_time ? 'CHECKED_IN' : 'CHECKED_OUT'
        }
      : { checkedIn: false, checkInTime: null, checkOutTime: null, status: 'NOT_CHECKED_IN' },
    stats: {
      totalVisits: Number(attendanceStats.total_checkins ?? 0),
      monthVisits,
      monthPercentage,
      streakDays: monthVisits
    },
    logs
  };
};

const getGymCrowdAnalyticsDetails = async (gymId) => {
  const crowd = await memberAppRepository.getGymCurrentOccupancy(gymId);
  const hourlyRows = await memberAppRepository.getHourlyCrowdAnalytics(gymId);

  const hourlyDistribution = [];
  for (let h = 6; h <= 22; h++) {
    const found = hourlyRows.find((r) => Number(r.checkin_hour) === h);
    const count = found ? Number(found.total_count) : 0;
    const label = `${h.toString().padStart(2, '0')}:00`;
    hourlyDistribution.push({ hour: h, label, count });
  }

  return {
    crowd,
    analytics: {
      mostCrowdedRange: '06:00 PM – 09:00 PM',
      leastCrowdedRange: '02:00 PM – 04:00 PM',
      avgMembersPerHour: Math.max(1, Math.round(crowd.currentOccupancy * 0.8)),
      bestWorkoutTime: '02:00 PM – 04:00 PM',
      hourlyDistribution
    }
  };
};

const getMemberBodyMeasurementsDetails = async (gymId, memberId) => {
  const rawList = await memberAppRepository.listMemberBodyMeasurements(gymId, memberId);

  const measurements = rawList.map((m) => {
    const weight = m.weight ? Number(m.weight) : null;
    const height = m.height ? Number(m.height) : null;
    let bmi = null;
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    return {
      id: m.id,
      measurementDate: m.measurement_date,
      weight,
      height,
      bmi,
      chest: m.chest ? Number(m.chest) : null,
      waist: m.waist ? Number(m.waist) : null,
      hips: m.hips ? Number(m.hips) : null,
      biceps: m.biceps ? Number(m.biceps) : null,
      thighs: m.thighs ? Number(m.thighs) : null,
      bodyFatPercentage: m.body_fat_percentage ? Number(m.body_fat_percentage) : null,
      muscleMass: m.muscle_mass ? Number(m.muscle_mass) : null,
      notes: m.notes
    };
  });

  const latest = measurements[0] ?? null;
  const previous = measurements[1] ?? null;

  const diffs = {
    weightChange: latest?.weight && previous?.weight ? Number((latest.weight - previous.weight).toFixed(1)) : 0,
    waistChange: latest?.waist && previous?.waist ? Number((latest.waist - previous.waist).toFixed(1)) : 0,
    bodyFatChange: latest?.bodyFatPercentage && previous?.bodyFatPercentage ? Number((latest.bodyFatPercentage - previous.bodyFatPercentage).toFixed(1)) : 0
  };

  return {
    latest,
    previous,
    diffs,
    measurements
  };
};

const addMemberBodyMeasurementRecord = async (gymId, memberId, data) => {
  const record = await memberAppRepository.createMemberBodyMeasurementRecord(gymId, memberId, data);
  return {
    id: record.id,
    measurementDate: record.measurement_date,
    weight: record.weight ? Number(record.weight) : null,
    notes: record.notes
  };
};

const getMemberProgressDashboardDetails = async (gymId, memberId) => {
  const { measurements } = await getMemberBodyMeasurementsDetails(gymId, memberId);
  const rawGoals = await memberAppRepository.listMemberFitnessGoals(gymId, memberId);

  const chronological = [...measurements].reverse();
  const weightTrend = chronological.filter((m) => m.weight !== null).map((m) => ({ date: m.measurementDate, weight: m.weight, bmi: m.bmi }));
  const bodyFatTrend = chronological.filter((m) => m.bodyFatPercentage !== null).map((m) => ({ date: m.measurementDate, bodyFat: m.bodyFatPercentage }));

  const firstRecord = chronological[0] ?? null;
  const latestRecord = measurements[0] ?? null;

  const beforeAfter = firstRecord && latestRecord ? {
    startingWeight: firstRecord.weight,
    latestWeight: latestRecord.weight,
    totalWeightChange: firstRecord.weight && latestRecord.weight ? Number((latestRecord.weight - firstRecord.weight).toFixed(1)) : 0,
    startingWaist: firstRecord.waist,
    latestWaist: latestRecord.waist,
    totalWaistChange: firstRecord.waist && latestRecord.waist ? Number((latestRecord.waist - firstRecord.waist).toFixed(1)) : 0,
    startDate: firstRecord.measurementDate,
    latestDate: latestRecord.measurementDate
  } : null;

  const goals = rawGoals.map((g) => {
    const start = Number(g.starting_value);
    const curr = Number(g.current_value);
    const target = Number(g.target_value);
    let progressPercentage = 0;
    if (start !== target) {
      progressPercentage = Math.min(100, Math.max(0, Math.round(Math.abs((curr - start) / (target - start)) * 100)));
    }
    const isCompleted = progressPercentage >= 100 || g.status === 'COMPLETED';

    return {
      id: g.id,
      goalType: g.goal_type,
      title: g.title,
      targetValue: target,
      startingValue: start,
      currentValue: curr,
      unit: g.unit,
      targetDate: g.target_date,
      status: isCompleted ? 'COMPLETED' : g.status,
      progressPercentage
    };
  });

  return {
    weightTrend,
    bodyFatTrend,
    beforeAfter,
    goals
  };
};

const getMemberFitnessGoalsDetails = async (gymId, memberId) => {
  const rawGoals = await memberAppRepository.listMemberFitnessGoals(gymId, memberId);
  const goals = rawGoals.map((g) => {
    const start = Number(g.starting_value);
    const curr = Number(g.current_value);
    const target = Number(g.target_value);
    let progressPercentage = 0;
    if (start !== target) {
      progressPercentage = Math.min(100, Math.max(0, Math.round(Math.abs((curr - start) / (target - start)) * 100)));
    }
    const isCompleted = progressPercentage >= 100 || g.status === 'COMPLETED';

    return {
      id: g.id,
      goalType: g.goal_type,
      title: g.title,
      targetValue: target,
      startingValue: start,
      currentValue: curr,
      unit: g.unit,
      targetDate: g.target_date,
      status: isCompleted ? 'COMPLETED' : g.status,
      completedAt: g.completed_at,
      progressPercentage
    };
  });

  return { goals };
};

const addMemberFitnessGoalRecord = async (gymId, memberId, data) => {
  const goal = await memberAppRepository.createMemberFitnessGoalRecord(gymId, memberId, data);
  return {
    id: goal.id,
    title: goal.title,
    targetValue: Number(goal.target_value),
    status: goal.status
  };
};

const updateMemberGoalStatusAction = async (gymId, memberId, goalId, status) => {
  const updated = await memberAppRepository.updateFitnessGoalStatus(gymId, memberId, goalId, status);
  if (!updated) {
    throw new AppError(404, 'Goal not found or access denied.');
  }
  return updated;
};

const deleteMemberGoalAction = async (gymId, memberId, goalId) => {
  const deleted = await memberAppRepository.deleteFitnessGoalRecord(gymId, memberId, goalId);
  if (!deleted) {
    throw new AppError(404, 'Goal not found or access denied.');
  }
  return deleted;
};

// Phase 5 Service Domain Logic
const updateMemberProfileDetails = async (gymId, memberId, data) => {
  const updated = await memberAppRepository.updateMemberProfileRecord(gymId, memberId, data);
  if (!updated) {
    throw new AppError(404, 'Member profile not found.');
  }
  return updated;
};

const getMemberNotificationsList = async (gymId, memberId) => {
  const notifications = await memberAppRepository.listMemberNotifications(gymId, memberId);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.notification_type,
      channel: n.delivery_channel,
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      sentAt: n.sent_at,
      readAt: n.read_at
    }))
  };
};

const markMemberNotificationRead = async (gymId, memberId, notificationId) => {
  const updated = await memberAppRepository.markNotificationAsRead(gymId, memberId, notificationId);
  if (!updated) {
    throw new AppError(404, 'Notification not found.');
  }
  return updated;
};

const markAllMemberNotificationsRead = async (gymId, memberId) => {
  await memberAppRepository.markAllNotificationsAsRead(gymId, memberId);
};

const changeMemberPasswordAction = async (gymId, memberId, { currentPassword, newPassword }) => {
  const member = await memberAppRepository.getMemberProfile(gymId, memberId);
  if (!member) {
    throw new AppError(404, 'Member record not found.');
  }

  // Get current password hash
  const authMember = await memberAppRepository.findMemberForAuth(member.member_id);
  if (!authMember || !authMember.password_hash) {
    throw new AppError(400, 'Password is not initialized for this account.');
  }

  const isMatch = await bcrypt.compare(currentPassword, authMember.password_hash);
  if (!isMatch) {
    throw new AppError(400, 'Current password provided is incorrect.');
  }

  const hashedNew = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await memberAppRepository.updateMemberPassword(memberId, hashedNew);
};

module.exports = {
  validateMemberId,
  loginMember,
  getMemberDashboard,
  getMemberMembership,
  getGymPlansForRenewal,
  getMemberPaymentsList,
  getMemberReceiptDetails,
  createMemberRenewal,
  getDigitalMemberCard,
  scanMemberAttendanceQR,
  getMemberAttendanceDetails,
  getGymCrowdAnalyticsDetails,
  getMemberBodyMeasurementsDetails,
  addMemberBodyMeasurementRecord,
  getMemberProgressDashboardDetails,
  getMemberFitnessGoalsDetails,
  addMemberFitnessGoalRecord,
  updateMemberGoalStatusAction,
  deleteMemberGoalAction,
  updateMemberProfileDetails,
  getMemberNotificationsList,
  markMemberNotificationRead,
  markAllMemberNotificationsRead,
  changeMemberPasswordAction
};
