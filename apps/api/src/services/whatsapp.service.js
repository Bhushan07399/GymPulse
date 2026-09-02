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

  FITBHUZ_INTRO: `🚀 *Get the FitBhuz Member App*
FitBhuz is your gym's digital member app for managing your membership, classes, attendance, payments and more.

📲 Android: {{fitbhuz_playstore}}
📱 iOS: {{fitbhuz_ios}}

🔑 *How to Login:*
1. Download FitBhuz App
2. Login using Member ID: *{{member_id}}*
3. Enjoy your digital gym pass!`,

  CLASS_ASSIGNED: `🧘 *Class Subscription Assigned*
Hi {{member_name}}, you are enrolled in *{{class_name}}* at {{gym_name}}!

Plan: {{class_plan}}
Assigned Schedule: {{class_schedule}}
Sessions Allowed: {{sessions_remaining}}
Validity: {{expiry_date}}
Instructor: {{instructor_name}}
Contact: {{gym_contact}}`,

  CLASS_REMINDER: `⏰ *Class Reminder - {{gym_name}}*
Hi {{member_name}}, your *{{class_name}}* session is scheduled for:
📅 Schedule: {{class_schedule}}
👨‍🏫 Instructor: {{instructor_name}}
See you at the studio!`,

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
  phoneNumber,
  templateName,
  parameters = [],
  customText = null
}) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhone) {
    await whatsappRepository.logWhatsAppDelivery({
      gymId,
      memberId,
      automationType,
      phoneNumber: phoneNumber || 'INVALID',
      templateName,
      status: 'FAILED',
      errorMessage: 'Invalid or missing recipient phone number.'
    });
    return { success: false, reason: 'INVALID_PHONE' };
  }

  // Duplicate Check for daily items
  if (automationType !== 'PAYMENT_RECEIPT' && automationType !== 'MANUAL_BROADCAST') {
    const isDuplicate = await whatsappRepository.hasDuplicateWhatsAppSentToday(gymId, memberId, automationType);
    if (isDuplicate) {
      logger.info({ gymId, memberId, automationType }, 'WhatsApp message skipped (duplicate sent today)');
      return { success: false, reason: 'DUPLICATE_SKIPPED' };
    }
  }

  const settings = await whatsappRepository.getWhatsAppSettings(gymId);
  const phoneNumberId = settings.phone_number_id || process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

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
              name: templateName,
              language: { code: 'en_US' },
              components: parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters: parameters.map((val) => ({ type: 'text', text: String(val) }))
                }
              ] : []
            }
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error?.message || `HTTP error ${response.status}`);
      }

      const messageId = responseData?.messages?.[0]?.id || 'WAMID_SUCCESS';

      await whatsappRepository.logWhatsAppDelivery({
        gymId,
        memberId,
        automationType,
        phoneNumber: normalizedPhone,
        templateName,
        providerMessageId: messageId,
        status: 'SENT'
      });

      return { success: true, messageId };
    } catch (apiErr) {
      const errorMsg = apiErr.message || 'WhatsApp Cloud API Error';
      logger.error({ gymId, memberId, errorMsg }, 'WhatsApp Cloud API Delivery Failed');

      await whatsappRepository.logWhatsAppDelivery({
        gymId,
        memberId,
        automationType,
        phoneNumber: normalizedPhone,
        templateName,
        status: 'FAILED',
        errorMessage: errorMsg
      });

      return { success: false, error: errorMsg };
    }
  }

  // Safe fallback when Meta API credentials are not yet configured in env
  await whatsappRepository.logWhatsAppDelivery({
    gymId,
    memberId,
    automationType,
    phoneNumber: normalizedPhone,
    templateName,
    status: 'SIMULATED_UNCONFIGURED',
    errorMessage: 'Meta WhatsApp Cloud API credentials unconfigured in environment.'
  });

  return { success: true, simulated: true };
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      member_id: member.member_id || 'MEMBER',
      gym_address: branding.address || 'Gym Premises',
      gym_contact: branding.whatsapp_number || branding.gym_phone || 'Contact Reception',
      gym_instagram: branding.instagram_url || '@gympulse',
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
      customText: messageBody
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
        gym_name: branding.gym_name || 'GymPulse Fitness',
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
const sendRenewalReminder = async (gymId, member, daysOffset, gymName = 'GymPulse Fitness') => {
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
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
      gym_name: branding.gym_name || 'GymPulse Fitness',
      member_name: `${member.first_name} ${member.last_name || ''}`.trim(),
      bmi_score: assessment.bmi_score || 'Recorded',
      report_url: assessment.report_url || 'Available in FitBhuz App',
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
        gym_name: branding.gym_name || 'GymPulse Fitness',
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

module.exports = {
  normalizePhoneNumber,
  DEFAULT_TEMPLATES,
  renderTemplate,
  sendTemplateMessage,
  sendWelcomeMessage,
  sendMembershipCreatedWhatsApp,
  sendPaymentConfirmation,
  sendFitBhuzIntroWhatsApp,
  sendClassAssignedWhatsApp,
  sendClassReminderWhatsApp,
  sendClassScheduleChangedWhatsApp,
  sendRenewalReminder,
  sendBmiAppointmentWhatsApp,
  sendBmiCompletedWhatsApp,
  sendManualBroadcastWhatsApp
};
