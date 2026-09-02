const whatsappRepository = require('../repositories/whatsapp.repository');
const whatsappService = require('../services/whatsapp.service');
const { AppError } = require('../utils/app-error');

const getSettings = async (request, response) => {
  const settings = await whatsappRepository.getWhatsAppSettings(request.user.gymId);
  response.status(200).json({
    success: true,
    data: { settings }
  });
};

const updateSettings = async (request, response) => {
  const settings = await whatsappRepository.saveWhatsAppSettings(request.user.gymId, request.body);
  response.status(200).json({
    success: true,
    message: 'WhatsApp automation settings updated successfully.',
    data: { settings }
  });
};

const getLogs = async (request, response) => {
  const logs = await whatsappRepository.listWhatsAppLogs(request.user.gymId, 100);
  response.status(200).json({
    success: true,
    data: { logs }
  });
};

const sendTestMessage = async (request, response) => {
  const { phone } = request.body;
  if (!phone) {
    throw new AppError(400, 'Phone number is required for test message.');
  }

  const result = await whatsappService.sendTemplateMessage({
    gymId: request.user.gymId,
    memberId: null,
    automationType: 'TEST_MESSAGE',
    phoneNumber: phone,
    templateName: 'gympulse_test_template',
    parameters: ['Gym Owner', 'Test Gym']
  });

  response.status(200).json({
    success: true,
    message: 'Test message processed.',
    data: result
  });
};

const getAutomationTemplates = async (request, response) => {
  const customSettings = await whatsappRepository.getAutomationSettings(request.user.gymId);
  const defaults = whatsappService.DEFAULT_TEMPLATES;
  
  const eventTypes = Object.keys(defaults);
  const templates = eventTypes.map((event_type) => {
    const found = customSettings.find((s) => s.event_type === event_type);
    return {
      event_type,
      is_enabled: found ? found.is_enabled : true,
      template_body: found ? found.template_body : defaults[event_type],
      default_body: defaults[event_type],
      is_customized: Boolean(found)
    };
  });

  response.status(200).json({
    success: true,
    data: { templates }
  });
};

const saveAutomationTemplate = async (request, response) => {
  const { eventType, isEnabled, templateBody } = request.body;
  if (!eventType) {
    throw new AppError(400, 'Event type is required.');
  }

  const setting = await whatsappRepository.saveAutomationSetting(
    request.user.gymId,
    eventType,
    isEnabled,
    templateBody || whatsappService.DEFAULT_TEMPLATES[eventType] || ''
  );

  response.status(200).json({
    success: true,
    message: 'Automation template saved successfully.',
    data: { setting }
  });
};

const getBranding = async (request, response) => {
  const branding = await whatsappRepository.getGymBranding(request.user.gymId);
  response.status(200).json({
    success: true,
    data: { branding }
  });
};

const updateBranding = async (request, response) => {
  const branding = await whatsappRepository.updateGymBranding(request.user.gymId, request.body);
  response.status(200).json({
    success: true,
    message: 'Gym branding updated successfully.',
    data: { branding }
  });
};

const previewBroadcast = async (request, response) => {
  const { audienceType, audienceFilter } = request.body;
  if (!audienceType) {
    throw new AppError(400, 'Audience type is required.');
  }

  const members = await whatsappRepository.getAudienceMembers(request.user.gymId, audienceType, audienceFilter);

  response.status(200).json({
    success: true,
    data: {
      recipientCount: members.length,
      members: members.map((m) => ({ id: m.id, member_id: m.member_id, name: `${m.first_name} ${m.last_name || ''}`.trim(), phone: m.phone }))
    }
  });
};

const sendBroadcast = async (request, response) => {
  const { title, messageBody, mediaUrl, audienceType, audienceFilter } = request.body;
  if (!title || !messageBody || !audienceType) {
    throw new AppError(400, 'Title, message body, and audience type are required.');
  }

  const members = await whatsappRepository.getAudienceMembers(request.user.gymId, audienceType, audienceFilter);
  if (members.length === 0) {
    throw new AppError(400, 'No matching recipients found for selected audience filter.');
  }

  const broadcast = await whatsappRepository.createManualBroadcast(request.user.gymId, {
    title,
    messageBody,
    mediaUrl,
    audienceType,
    audienceFilter,
    recipientCount: members.length
  });

  // Execute broadcast in background asynchronously
  whatsappService.sendManualBroadcastWhatsApp(request.user.gymId, broadcast, members).catch(() => {});

  response.status(200).json({
    success: true,
    message: `Manual broadcast initiated for ${members.length} member(s).`,
    data: { broadcast, recipientCount: members.length }
  });
};

const getBroadcastHistory = async (request, response) => {
  const broadcasts = await whatsappRepository.getBroadcastHistory(request.user.gymId, 20);
  response.status(200).json({
    success: true,
    data: { broadcasts }
  });
};

const getStats = async (request, response) => {
  const stats = await whatsappRepository.getAutomationStats(request.user.gymId);
  response.status(200).json({
    success: true,
    data: { stats }
  });
};

const assignMemberClassSchedules = async (request, response) => {
  const { memberId, classId, classMembershipId, scheduleIds } = request.body;
  if (!memberId || !classId) {
    throw new AppError(400, 'memberId and classId are required.');
  }

  const schedules = await whatsappRepository.saveMemberClassSchedules(
    request.user.gymId,
    memberId,
    classId,
    classMembershipId,
    scheduleIds || []
  );

  response.status(200).json({
    success: true,
    message: 'Member class schedule assigned successfully.',
    data: { schedules }
  });
};

const getMemberClassSchedules = async (request, response) => {
  const { memberId } = request.params;
  const { classId } = request.query;

  const schedules = await whatsappRepository.getMemberClassSchedules(
    request.user.gymId,
    memberId,
    classId
  );

  response.status(200).json({
    success: true,
    data: { schedules }
  });
};

module.exports = {
  getSettings,
  updateSettings,
  getLogs,
  sendTestMessage,
  getAutomationTemplates,
  saveAutomationTemplate,
  getBranding,
  updateBranding,
  previewBroadcast,
  sendBroadcast,
  getBroadcastHistory,
  getStats,
  assignMemberClassSchedules,
  getMemberClassSchedules
};
