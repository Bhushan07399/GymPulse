const whatsappRepository = require('../repositories/whatsapp.repository');
const { logger } = require('../config/logger');

// Normalizes raw phone input to WhatsApp E.164 standard (e.g. "9876543210" -> "919876543210")
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`; // Default India prefix
  }
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }
  return null;
};

const DEFAULT_TEMPLATES = {
  MEMBER_CREATED: `Welcome to {{gym_name}}, {{member_name}}! 🎉
We are excited to have you join us on your fitness journey.

📍 Address: {{gym_address}}
📞 Contact: {{gym_contact}}
📷 Instagram: {{gym_instagram}}
📋 Terms: {{terms_and_conditions}}
👤 Management: {{management_contact}}`,

  MEMBERSHIP_CREATED: `Hi {{member_name}}, your membership details for {{gym_name}}:
Plan: {{membership_plan}}
Member ID: {{member_id}}
Start Date: {{start_date}}
Expiry Date: {{expiry_date}}
Duration: {{duration}} days
Status: Active
Contact: {{gym_contact}}`,

  PAYMENT_CONFIRMATION: `Hi {{member_name}}, payment received at {{gym_name}}!
Amount: ₹{{amount}}
Method: {{payment_method}}
Receipt #: {{receipt_number}}
Plan: {{membership_plan}}
Thank you for your payment!
Contact: {{gym_contact}}`,

  PAYMENT_RECEIPT: `🧾 *OFFICIAL PAYMENT RECEIPT*
*{{gym_name}}*
Receipt #: {{receipt_number}}
Date: {{payment_date}}

Member: {{member_name}} (ID: {{member_id}})
Plan: {{membership_plan}}
Total Amount: ₹{{total_amount}}
Paid Amount: ₹{{paid_amount}}
Remaining Dues: ₹{{remaining_amount}}
Payment Method: {{payment_method}}
Payment Status: {{payment_status}}
Validity: {{start_date}} to {{expiry_date}}
Contact: {{gym_contact}}`,

  DUE_REMINDER: `⚠️ *Payment Due Reminder - {{gym_name}}*
Hi {{member_name}}, you have pending dues of ₹{{due_amount}} for {{membership_plan}}.
Please clear your dues at reception or contact {{gym_contact}}.`,

  FITBHUZ_INTRO: `🚀 *Get the obo Member App*
obo is your gym's digital member app for managing your membership, classes, attendance, payments and more.

📲 Android: {{fitbhuz_playstore}}
📱 iOS: {{fitbhuz_ios}}

🔑 *How to Login:*
1. Download obo App
2. Login using Member ID: *{{member_id}}*
3. Enjoy your digital gym pass!`,

  ATTENDANCE_CONFIRMATION: `💪 *Attendance Marked - {{gym_name}}*
Hi {{member_name}}, your check-in has been recorded at {{check_in_time}}.
Have a great workout today! 🔥`,

  CLASS_ASSIGNED: `🧘 *Class Subscription Assigned*
Hi {{member_name}}, you are enrolled in *{{class_name}}* at {{gym_name}}!

Plan: {{class_plan}}
Assigned Schedule: {{class_schedule}}
Sessions Allowed: {{sessions_remaining}}
Validity: {{expiry_date}}
Instructor: {{instructor_name}}
Contact: {{gym_contact}}`,

  CLASS_BOOKING_CONFIRMATION: `🎉 *Class Spot Confirmed - {{gym_name}}*
Hi {{member_name}}, your spot for *{{class_name}}* has been confirmed!
📅 Schedule: {{class_schedule}}
👨‍🏫 Instructor: {{instructor_name}}
See you at the session!`,

  CLASS_REMINDER: `⏰ *Class Reminder - {{gym_name}}*
Hi {{member_name}}, your *{{class_name}}* session is scheduled for:
📅 Schedule: {{class_schedule}}
👨‍🏫 Instructor: {{instructor_name}}
See you at the studio!`,

  CLASS_ATTENDANCE_CONFIRMATION: `✅ *Class Attendance Recorded - {{gym_name}}*
Hi {{member_name}}, your attendance for *{{class_name}}* has been recorded at {{check_in_time}}.
Great job showing up today! 🧘‍♂️`,

  CLASS_SCHEDULE_CHANGED: `📢 *Class Schedule Update - {{gym_name}}*
Hi {{member_name}}, please note that your *{{class_name}}* schedule has been updated to:
📅 New Schedule: {{class_schedule}}
Instructor: {{instructor_name}}`,

  BIRTHDAY_WISHES: `🎂 *Happy Birthday {{member_name}}!* 🎁
Team {{gym_name}} wishes you a fantastic birthday filled with health, strength, and happiness!
Contact: {{gym_contact}}`,

  RENEWAL_7D: `⏳ *Membership Expiring Soon*
Hi {{member_name}}, your {{membership_plan}} at {{gym_name}} expires in 7 days on {{expiry_date}}.
Renew now at reception or call {{gym_contact}}!`,

  RENEWAL_3D: `⚠️ *3 Days Left on Membership*
Hi {{member_name}}, your {{membership_plan}} at {{gym_name}} expires on {{expiry_date}}.
Please renew to avoid interruption. Contact: {{gym_contact}}`,

  RENEWAL_1D: `🚨 *Membership Expires Tomorrow*
Hi {{member_name}}, your {{membership_plan}} at {{gym_name}} expires tomorrow ({{expiry_date}}).
Renew today! Contact: {{gym_contact}}`,

  MEMBERSHIP_EXPIRED: `🔴 *Membership Expired*
Hi {{member_name}}, your {{membership_plan}} at {{gym_name}} has expired on {{expiry_date}}.
Please visit reception to renew your membership. Contact: {{gym_contact}}`,

  BMI_APPOINTMENT: `🩺 *BMI Assessment Appointment*
Hi {{member_name}}, your BMI assessment at {{gym_name}} is scheduled for:
📅 Date: {{bmi_date}}
⏰ Time: {{bmi_time}}
Type: {{bmi_price}}
Contact: {{gym_contact}}`,

  BMI_COMPLETED: `✅ *BMI Assessment Completed*
Hi {{member_name}}, your BMI assessment at {{gym_name}} has been completed!
Score: {{bmi_score}}
Report: {{report_url}}
Keep up the great work!`,

  MANUAL_BROADCAST: `📢 *Notice from {{gym_name}}*
{{broadcast_message}}

Contact: {{gym_contact}}`
};

const renderTemplate = (template, vars = {}) => {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : '';
  });
};

const sendTemplateMessage = async ({
  gymId,
  memberId = null,
  automationType,
  eventType,
  phoneNumber,
  phone,
  templateName,
  parameters = [],
  customText = null,
  idempotencyKey = null
}) => {
  const resolvedType = automationType || eventType || 'GENERIC_AUTOMATION';
  const resolvedTemplate = templateName || eventType || resolvedType || 'DEFAULT';
  const resolvedPhone = phoneNumber || phone;
  const normalizedPhone = normalizePhoneNumber(resolvedPhone);

  if (!normalizedPhone) {
    await whatsappRepository.logWhatsAppDelivery({
      gymId,
      memberId,
      automationType: resolvedType,
      phoneNumber: resolvedPhone || 'INVALID',
      templateName: resolvedTemplate,
      status: 'FAILED',
      errorMessage: 'Invalid or missing recipient phone number.',
      idempotencyKey
    });
    return { success: false, status: 'FAILED', error: 'Invalid or missing recipient phone number.', reason: 'INVALID_PHONE' };
  }

  // Idempotency check: if an idempotency key was supplied, check if already dispatched
  if (idempotencyKey) {
    const isAlreadyDispatched = await whatsappRepository.hasIdempotentEventDispatched(gymId, idempotencyKey);
    if (isAlreadyDispatched) {
      logger.info({ gymId, memberId, automationType: resolvedType, idempotencyKey }, 'WhatsApp message skipped (idempotent event already dispatched)');
      return { success: false, duplicate: true, skipped: true, reason: 'IDEMPOTENT_SKIPPED' };
    }
  } else if (
    resolvedType !== 'PAYMENT_RECEIPT' &&
    resolvedType !== 'PAYMENT_CONFIRMATION' &&
    resolvedType !== 'MANUAL_BROADCAST' &&
    resolvedType !== 'IMPORTANT_NOTICE'
  ) {
    // Duplicate Check for daily items
    const isDuplicate = await whatsappRepository.hasDuplicateWhatsAppSentToday(gymId, memberId, resolvedType);
    if (isDuplicate) {
      logger.info({ gymId, memberId, automationType: resolvedType }, 'WhatsApp message skipped (duplicate sent today)');
      return { success: false, duplicate: true, skipped: true, reason: 'DUPLICATE_SKIPPED' };
    }
  }

  const settings = await whatsappRepository.getWhatsAppSettings(gymId);
  const phoneNumberId = settings.phone_number_id || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;

  // If Official WhatsApp Cloud API Credentials exist in process.env or settings
  if (phoneNumberId && accessToken) {
    try {
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const payload = customText
        ? {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'text',
            text: { body: customText }
          }
        : {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'template',
            template: {
              name: resolvedTemplate,
              language: { code: 'en_US' },
              components: parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters: parameters.map((val) => ({ type: 'text', text: String(val) }))
                }
              ] : []
            }
          };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error?.message || `HTTP error ${response.status}`);
      }

      const messageId = responseData?.messages?.[0]?.id || 'WAMID_SUCCESS';

      await whatsappRepository.logWhatsAppDelivery({
        gymId,
        memberId,
        automationType: resolvedType,
        phoneNumber: normalizedPhone,
        templateName: resolvedTemplate,
        providerMessageId: messageId,
        status: 'SENT',
        idempotencyKey
      });

      return { success: true, messageId, providerMessageId: messageId, status: 'SENT' };
    } catch (apiErr) {
      const errorMsg = apiErr.message || 'WhatsApp Cloud API Error';
      logger.error({ gymId, memberId, errorMsg }, 'WhatsApp Cloud API Delivery Failed');

      await whatsappRepository.logWhatsAppDelivery({
        gymId,
        memberId,
        automationType: resolvedType,
        phoneNumber: normalizedPhone,
        templateName: resolvedTemplate,
        status: 'FAILED',
        errorMessage: errorMsg,
        idempotencyKey
      });

      return { success: false, error: errorMsg, status: 'FAILED' };
    }
  }

  // Safe fallback when Meta API credentials are not yet configured in env
  await whatsappRepository.logWhatsAppDelivery({
    gymId,
    memberId,
    automationType: resolvedType,
    phoneNumber: normalizedPhone,
    templateName: resolvedTemplate,
    status: 'NOT_CONFIGURED',
    errorMessage: 'Meta WhatsApp Cloud API credentials unconfigured in environment.',
    idempotencyKey
  });

  return { success: false, simulated: true, status: 'NOT_CONFIGURED', logged: true };
};

// 1. Member Created (Welcome + Gym Branding)
const sendWelcomeMessage = async (gymId, member) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'MEMBER_CREATED');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.MEMBER_CREATED;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      member_id: member.member_id || 'MEMBER',
      gym_address: branding.address || 'Gym Premises',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Contact Reception',
      gym_instagram: branding.instagram_url || '@obo.fit',
      terms_and_conditions: branding.terms_and_conditions || 'Standard Gym Rules Apply',
      management_contact: branding.management_contact || 'Gym Management'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'MEMBER_CREATED',
      phoneNumber: member.phone,
      templateName: 'gympulse_welcome_member',
      parameters: [member.first_name, branding.gym_name, member.member_id || 'MEMBER'],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending welcome WhatsApp message');
  }
};

// 2. Membership Created
const sendMembershipCreatedWhatsApp = async (gymId, member, plan) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'MEMBERSHIP_CREATED');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.MEMBERSHIP_CREATED;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      member_id: member.member_id || 'MEMBER',
      membership_plan: plan.plan_name || plan.planName || 'Membership Plan',
      start_date: member.join_date || member.joinDate || 'Today',
      expiry_date: member.expiry_date || member.expiryDate || 'N/A',
      duration: plan.duration_in_days || plan.durationInDays || 30,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'MEMBERSHIP_CREATED',
      phoneNumber: member.phone,
      templateName: 'gympulse_membership_created',
      parameters: [member.first_name, plan.plan_name || 'Plan', member.expiry_date || 'Expiry'],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending membership created WhatsApp message');
  }
};

// 3. Payment Receipt
const sendPaymentConfirmation = async (gymId, payment, member, planName = 'Membership') => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'PAYMENT_RECEIPT');

    if (customSetting && !customSetting.is_enabled) return;

    const paid = Number(payment.paid_amount || payment.amountPaid || payment.total_amount || 0);
    const total = Number(payment.total_amount || payment.totalAmount || paid);
    const remaining = Math.max(0, total - paid);
    const status = remaining === 0 ? 'Paid in Full' : paid > 0 ? 'Partial Payment' : 'Pending';

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.PAYMENT_RECEIPT;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      receipt_number: payment.receipt_number || payment.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      payment_date: payment.payment_date || payment.paymentDate || new Date().toISOString().slice(0, 10),
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      member_id: member.member_id || 'MEMBER',
      membership_plan: planName,
      total_amount: total,
      paid_amount: paid,
      remaining_amount: remaining,
      payment_method: payment.payment_method || payment.paymentMethod || 'Cash',
      payment_status: status,
      start_date: member.join_date || member.joinDate || 'Today',
      expiry_date: member.expiry_date || member.expiryDate || 'N/A',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    const res = await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'PAYMENT_RECEIPT',
      phoneNumber: member.phone,
      templateName: 'gympulse_payment_receipt',
      parameters: [member.first_name, `₹${paid}`, payment.payment_method || 'Cash', branding.gym_name],
      customText: messageBody,
      idempotencyKey: payment.id ? `payment:${payment.id}` : null
    });

    // Check & Trigger FitBhuz Special Message AFTER Payment Receipt IF not sent already
    if (!member.fitbhuz_intro_sent) {
      await sendFitBhuzIntroWhatsApp(gymId, member);
    }

    return res;
  } catch (err) {
    logger.error({ gymId, paymentId: payment?.id, err }, 'Failed sending payment WhatsApp message');
  }
};

// 4. FitBhuz Special Message
const sendFitBhuzIntroWhatsApp = async (gymId, member) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'FITBHUZ_INTRO');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.FITBHUZ_INTRO;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_id: member.member_id || 'MEMBER',
      fitbhuz_playstore: branding.fitbhuz_playstore_url || 'https://play.google.com/store/apps/details?id=com.fitbhuz.member',
      fitbhuz_ios: branding.fitbhuz_ios_url || 'https://apps.apple.com/app/fitbhuz/id123456789'
    });

    const res = await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'FITBHUZ_INTRO',
      phoneNumber: member.phone,
      templateName: 'gympulse_fitbhuz_intro',
      parameters: [member.member_id || 'MEMBER'],
      customText: messageBody
    });

    // Set fitbhuz_intro_sent = TRUE in database so it is never sent again
    const { pool } = require('../db/pool');
    await pool.query('UPDATE members SET fitbhuz_intro_sent = TRUE WHERE gym_id = $1 AND id = $2', [gymId, member.id]);

    return res;
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending FitBhuz intro WhatsApp message');
  }
};

// 5. Class Assigned WhatsApp
const sendClassAssignedWhatsApp = async (gymId, member, classObj, classPlan, scheduleText = 'All Scheduled Days') => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'CLASS_ASSIGNED');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.CLASS_ASSIGNED;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      class_name: classObj.name || 'Group Class',
      class_plan: classPlan?.name || 'Class Plan',
      class_schedule: scheduleText,
      sessions_remaining: classPlan?.is_unlimited ? 'Unlimited' : (classPlan?.session_limit || 'Standard'),
      expiry_date: member.expiry_date || member.expiryDate || 'N/A',
      instructor_name: classObj.instructor_name || 'Coach',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'CLASS_ASSIGNED',
      phoneNumber: member.phone,
      templateName: 'gympulse_class_assigned',
      parameters: [member.first_name, classObj.name, scheduleText],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending class assigned WhatsApp message');
  }
};

// 6. Class Reminder WhatsApp (Only to assigned/booked members)
const sendClassReminderWhatsApp = async (gymId, member, classObj, scheduleText = 'Today') => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'CLASS_REMINDER');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.CLASS_REMINDER;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      class_name: classObj.name,
      class_schedule: scheduleText,
      instructor_name: classObj.instructor_name || 'Coach'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'CLASS_REMINDER',
      phoneNumber: member.phone,
      templateName: 'gympulse_class_reminder',
      parameters: [member.first_name, classObj.name, scheduleText],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending class reminder WhatsApp message');
  }
};

// 7. Class Schedule Changed WhatsApp (Only to affected members)
const sendClassScheduleChangedWhatsApp = async (gymId, affectedMembers = [], classObj, newScheduleText) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'CLASS_SCHEDULE_CHANGED');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.CLASS_SCHEDULE_CHANGED;

    for (const m of affectedMembers) {
      const messageBody = renderTemplate(templateText, {
        gym_name: branding.gym_name || 'Gym',
        member_name: `${m.first_name} ${m.last_name || ''}`.trim(),
        class_name: classObj.name,
        class_schedule: newScheduleText,
        instructor_name: classObj.instructor_name || 'Coach'
      });

      await sendTemplateMessage({
        gymId,
        memberId: m.id,
        automationType: 'CLASS_SCHEDULE_CHANGED',
        phoneNumber: m.phone,
        templateName: 'gympulse_class_schedule_changed',
        parameters: [m.first_name, classObj.name, newScheduleText],
        customText: messageBody
      });
    }
  } catch (err) {
    logger.error({ gymId, err }, 'Failed sending class schedule change WhatsApp messages');
  }
};

// 8. Renewal Reminder
const sendRenewalReminder = async (gymId, member, daysOffset, gymName = 'Gym') => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const eventType = daysOffset === 7 ? 'RENEWAL_7D' : daysOffset === 3 ? 'RENEWAL_3D' : daysOffset === 1 ? 'RENEWAL_1D' : 'MEMBERSHIP_EXPIRED';
    const customSetting = settingsList.find((s) => s.event_type === eventType);

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES[eventType];
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || gymName,
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      membership_plan: member.plan_name || 'Membership Plan',
      expiry_date: member.expiry_date || 'Soon',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: `REMINDER_${daysOffset}`,
      phoneNumber: member.phone,
      templateName: daysOffset < 0 ? 'gympulse_membership_expired' : 'gympulse_renewal_reminder',
      parameters: [member.first_name, member.expiry_date || 'Soon', branding.gym_name],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending renewal reminder WhatsApp message');
  }
};

// 9. BMI Appointment WhatsApp
const sendBmiAppointmentWhatsApp = async (gymId, assessment, member) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'BMI_APPOINTMENT');

    if (customSetting && !customSetting.is_enabled) return;

    const priceText = assessment.assessment_type === 'FREE' ? 'FREE Assessment' : `PAID Assessment (₹${assessment.price})`;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.BMI_APPOINTMENT;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      bmi_date: assessment.appointment_date,
      bmi_time: assessment.appointment_time || 'Scheduled Time',
      bmi_price: priceText,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'BMI_APPOINTMENT',
      phoneNumber: member.phone,
      templateName: 'gympulse_bmi_appointment',
      parameters: [member.first_name, assessment.appointment_date, priceText],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, assessmentId: assessment?.id, err }, 'Failed sending BMI appointment WhatsApp message');
  }
};

// 10. BMI Completed WhatsApp
const sendBmiCompletedWhatsApp = async (gymId, assessment, member) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'BMI_COMPLETED');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.BMI_COMPLETED;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      bmi_score: assessment.bmi_score || 'Recorded',
      report_url: assessment.report_url || 'Available in obo App',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'BMI_COMPLETED',
      phoneNumber: member.phone,
      templateName: 'gympulse_bmi_completed',
      parameters: [member.first_name, String(assessment.bmi_score || 'N/A')],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, assessmentId: assessment?.id, err }, 'Failed sending BMI completed WhatsApp message');
  }
};

// 11. Manual Management Broadcast
const sendManualBroadcastWhatsApp = async (gymId, broadcast, recipients = []) => {
  try {
    const branding = await whatsappRepository.getGymBranding(gymId);
    const templateText = DEFAULT_TEMPLATES.MANUAL_BROADCAST;

    for (const member of recipients) {
      const messageBody = renderTemplate(templateText, {
        gym_name: branding.gym_name || 'Gym',
        member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
        broadcast_message: broadcast.message_body,
        gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
      });

      await sendTemplateMessage({
        gymId,
        memberId: member.id,
        automationType: 'MANUAL_BROADCAST',
        phoneNumber: member.phone,
        templateName: 'gympulse_manual_notice',
        parameters: [member.first_name, broadcast.title],
        customText: messageBody
      });
    }
  } catch (err) {
    logger.error({ gymId, broadcastId: broadcast?.id, err }, 'Failed processing manual broadcast WhatsApp messages');
  }
};

// 12. Attendance Confirmation
const sendAttendanceConfirmation = async (gymId, member, checkInTime = null, gymName = null) => {
  try {
    if (!member || !member.phone) return;
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'ATTENDANCE_CONFIRMATION');

    if (customSetting && !customSetting.is_enabled) return;

    const timeStr = checkInTime
      ? new Date(checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.ATTENDANCE_CONFIRMATION;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || gymName || 'Gym',
      member_name: `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim(),
      check_in_time: timeStr,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    const dateKey = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `attendance:${gymId}:${member.id}:${dateKey}`;

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'ATTENDANCE_CONFIRMATION',
      phoneNumber: member.phone,
      templateName: 'gympulse_attendance_confirmation',
      parameters: [member.first_name || member.firstName || 'Member', timeStr, branding.gym_name || 'Gym'],
      customText: messageBody,
      idempotencyKey
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending attendance confirmation WhatsApp message');
  }
};

// 13. Class Booking Confirmation
const sendClassBookingConfirmation = async (gymId, member, classObj, scheduleText = 'Scheduled Session') => {
  try {
    if (!member || !member.phone || !classObj) return;
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'CLASS_BOOKING_CONFIRMATION');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.CLASS_BOOKING_CONFIRMATION;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim(),
      class_name: classObj.name || 'Class',
      class_schedule: scheduleText,
      instructor_name: classObj.instructor_name || 'Coach',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'CLASS_BOOKING_CONFIRMATION',
      phoneNumber: member.phone,
      templateName: 'gympulse_class_booking_confirmed',
      parameters: [member.first_name || member.firstName || 'Member', classObj.name || 'Class', scheduleText],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending class booking confirmation WhatsApp message');
  }
};

// 14. Class Attendance Confirmation
const sendClassAttendanceConfirmation = async (gymId, member, classObj, checkInTime = null) => {
  try {
    if (!member || !member.phone || !classObj) return;
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'CLASS_ATTENDANCE_CONFIRMATION');

    if (customSetting && !customSetting.is_enabled) return;

    const timeStr = checkInTime
      ? new Date(checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.CLASS_ATTENDANCE_CONFIRMATION;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim(),
      class_name: classObj.name || 'Class',
      check_in_time: timeStr,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    const dateKey = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `class_attendance:${gymId}:${member.id}:${classObj.id || classObj.name}:${dateKey}`;

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'CLASS_ATTENDANCE_CONFIRMATION',
      phoneNumber: member.phone,
      templateName: 'gympulse_class_attendance_confirmed',
      parameters: [member.first_name || member.firstName || 'Member', classObj.name || 'Class', timeStr],
      customText: messageBody,
      idempotencyKey
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending class attendance confirmation WhatsApp message');
  }
};

// 15. Due / Outstanding Reminder
const sendDueReminder = async (gymId, member, dueAmount, planName = 'Membership') => {
  try {
    if (!member || !member.phone) return;
    const branding = await whatsappRepository.getGymBranding(gymId);
    const settingsList = await whatsappRepository.getAutomationSettings(gymId);
    const customSetting = settingsList.find((s) => s.event_type === 'DUE_REMINDER');

    if (customSetting && !customSetting.is_enabled) return;

    const templateText = customSetting?.template_body || DEFAULT_TEMPLATES.DUE_REMINDER;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim(),
      due_amount: dueAmount,
      membership_plan: planName,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'DUE_REMINDER',
      phoneNumber: member.phone,
      templateName: 'gympulse_due_reminder',
      parameters: [member.first_name || member.firstName || 'Member', `₹${dueAmount}`, branding.gym_name || 'Gym'],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending due reminder WhatsApp message');
  }
};

// 16. Important Notice / Account Notification
const sendImportantNotice = async (gymId, member, title, noticeBody) => {
  try {
    if (!member || !member.phone) return;
    const branding = await whatsappRepository.getGymBranding(gymId);
    const templateText = DEFAULT_TEMPLATES.MANUAL_BROADCAST;
    const messageBody = renderTemplate(templateText, {
      gym_name: branding.gym_name || 'Gym',
      member_name: `${member.first_name || member.firstName || ''} ${member.last_name || member.lastName || ''}`.trim(),
      broadcast_message: noticeBody,
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Reception'
    });

    return await sendTemplateMessage({
      gymId,
      memberId: member.id,
      automationType: 'IMPORTANT_NOTICE',
      phoneNumber: member.phone,
      templateName: 'gympulse_manual_notice',
      parameters: [member.first_name || member.firstName || 'Member', title],
      customText: messageBody
    });
  } catch (err) {
    logger.error({ gymId, memberId: member?.id, err }, 'Failed sending important notice WhatsApp message');
  }
};

module.exports = {
  normalizePhoneNumber,
  DEFAULT_TEMPLATES,
  renderTemplate,
  sendTemplateMessage,
  sendWelcomeMessage,
  sendMembershipCreatedWhatsApp,
  sendPaymentConfirmation,
  sendAttendanceConfirmation,
  sendClassBookingConfirmation,
  sendClassAttendanceConfirmation,
  sendDueReminder,
  sendImportantNotice,
  sendFitBhuzIntroWhatsApp,
  sendClassAssignedWhatsApp,
  sendClassReminderWhatsApp,
  sendClassScheduleChangedWhatsApp,
  sendRenewalReminder,
  sendBmiAppointmentWhatsApp,
  sendBmiCompletedWhatsApp,
  sendManualBroadcastWhatsApp
};
