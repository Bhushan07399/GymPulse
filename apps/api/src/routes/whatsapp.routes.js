const { Router } = require('express');
const whatsappController = require('../controllers/whatsapp.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');

const whatsappRouter = Router();

whatsappRouter.use(authenticate, authorize('Owner', 'Staff'), authorizePlanFeature('WHATSAPP_AUTOMATION'));

whatsappRouter.get('/settings', asyncHandler(whatsappController.getSettings));
whatsappRouter.put('/settings', asyncHandler(whatsappController.updateSettings));

whatsappRouter.get('/branding', asyncHandler(whatsappController.getBranding));
whatsappRouter.put('/branding', asyncHandler(whatsappController.updateBranding));

whatsappRouter.get('/templates', asyncHandler(whatsappController.getAutomationTemplates));
whatsappRouter.put('/templates', asyncHandler(whatsappController.saveAutomationTemplate));

whatsappRouter.get('/logs', asyncHandler(whatsappController.getLogs));
whatsappRouter.get('/stats', asyncHandler(whatsappController.getStats));
whatsappRouter.post('/test', asyncHandler(whatsappController.sendTestMessage));

whatsappRouter.post('/broadcast/preview', asyncHandler(whatsappController.previewBroadcast));
whatsappRouter.post('/broadcast/send', asyncHandler(whatsappController.sendBroadcast));
whatsappRouter.get('/broadcast/history', asyncHandler(whatsappController.getBroadcastHistory));

whatsappRouter.post('/schedules/assign', asyncHandler(whatsappController.assignMemberClassSchedules));
whatsappRouter.get('/schedules/members/:memberId', asyncHandler(whatsappController.getMemberClassSchedules));

module.exports = { whatsappRouter };
