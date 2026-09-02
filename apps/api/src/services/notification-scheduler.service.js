const notificationRepository = require('../repositories/notification.repository');
const whatsappService = require('./whatsapp.service');
const { logger } = require('../config/logger');

const REMINDER_OFFSETS = [
  { days: 7, type: 'Membership', title: 'Membership Expiring in 7 Days', template: (m) => `Hi ${m.first_name}, your ${m.plan_name || 'gym'} membership will expire on ${m.expiry_date}. Contact reception to renew!` },
  { days: 3, type: 'Membership', title: 'Membership Expiring in 3 Days', template: (m) => `Hi ${m.first_name}, only 3 days left on your membership (${m.expiry_date}). Renew now to maintain uninterrupted access.` },
  { days: 1, type: 'Membership', title: 'Membership Expires Tomorrow', template: (m) => `Hi ${m.first_name}, your membership expires tomorrow (${m.expiry_date}). Please renew today at reception!` },
  { days: -1, type: 'Membership', title: 'Membership Expired', template: (m) => `Hi ${m.first_name}, your membership has expired. Renew your plan at reception to continue your fitness journey.` }
];

const runAutomatedNotifications = async () => {
  let createdCount = 0;
  let skippedCount = 0;

  try {
    const gyms = await notificationRepository.listActiveGymsWithSettings();

    for (const gym of gyms) {
      if (gym.expiry_reminder || gym.renewal_reminder) {
        for (const config of REMINDER_OFFSETS) {
          try {
            const members = await notificationRepository.findExpiringMembersForGym(gym.gym_id, config.days);

            for (const member of members) {
              try {
                const isDuplicate = await notificationRepository.hasDuplicateNotificationToday(
                  gym.gym_id,
                  member.member_id,
                  config.type,
                  config.title
                );

                if (isDuplicate) {
                  skippedCount++;
                } else {
                  const message = config.template(member);

                  await notificationRepository.createNotificationRecord({
                    gymId: gym.gym_id,
                    memberId: member.member_id,
                    notificationType: config.type,
                    deliveryChannel: 'In-App',
                    title: config.title,
                    message,
                    payload: {
                      expiryDate: member.expiry_date,
                      planName: member.plan_name,
                      daysOffset: config.days
                    }
                  });

                  createdCount++;
                }

                // Trigger WhatsApp notification for Pro Plan gyms asynchronously
                if (gym.subscription_plan === 'Pro' || gym.subscription_plan === 'PRO') {
                  whatsappService
                    .sendRenewalReminder(gym.gym_id, member, config.days, gym.gym_name)
                    .catch((wErr) => logger.error({ memberId: member.member_id, wErr }, 'WhatsApp reminder error'));
                }
              } catch (memberErr) {
                logger.error({ memberId: member.member_id, err: memberErr }, 'Failed processing notification for member');
              }
            }
          } catch (offsetErr) {
            logger.error({ gymId: gym.gym_id, offset: config.days, err: offsetErr }, 'Failed processing reminder offset for gym');
          }
        }
      }

      // Automated Birthday Wishes Check
      try {
        const { pool } = require('../db/pool');
        const birthdayRes = await pool.query(
          `SELECT id, member_id, first_name, last_name, phone
           FROM members
           WHERE gym_id = $1
             AND date_of_birth IS NOT NULL
             AND EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
             AND deleted_at IS NULL`,
          [gym.gym_id]
        );

        for (const bMember of birthdayRes.rows) {
          whatsappService.sendTemplateMessage({
            gymId: gym.gym_id,
            memberId: bMember.id,
            automationType: 'BIRTHDAY_WISHES',
            phoneNumber: bMember.phone,
            templateName: 'gympulse_birthday_wishes',
            parameters: [bMember.first_name, gym.gym_name]
          }).catch(() => {});
        }
      } catch (bErr) {
        logger.error({ gymId: gym.gym_id, bErr }, 'Failed processing birthday wishes for gym');
      }
    }

    logger.info({ createdCount, skippedCount }, 'Automated notification scheduler completed');
    return { createdCount, skippedCount };
  } catch (err) {
    logger.error({ err }, 'Error in automated notification scheduler');
    return { createdCount, skippedCount, error: err.message };
  }
};

let schedulerTimer = null;

const startNotificationScheduler = (intervalMs = 60 * 60 * 1000) => {
  logger.info({ intervalMs }, 'Starting automated notification background scheduler');

  // Trigger initial run asynchronously after 5 seconds
  setTimeout(() => {
    runAutomatedNotifications().catch((err) => logger.error({ err }, 'Initial notification run error'));
  }, 5000);

  // Set recurring timer
  schedulerTimer = setInterval(() => {
    runAutomatedNotifications().catch((err) => logger.error({ err }, 'Recurring notification run error'));
  }, intervalMs);
};

const stopNotificationScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info('Automated notification background scheduler stopped');
  }
};

module.exports = {
  runAutomatedNotifications,
  startNotificationScheduler,
  stopNotificationScheduler
};
