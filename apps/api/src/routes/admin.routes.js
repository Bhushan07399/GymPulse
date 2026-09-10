const { Router } = require('express');
const { asyncHandler } = require('../middleware/async-handler');
const { authenticateAdmin } = require('../middleware/authenticate-admin');
const adminController = require('../controllers/admin.controller');

const adminRouter = Router();

// =============================================================================
// PUBLIC ADMIN ROUTES (LOGIN)
// =============================================================================
adminRouter.post('/auth/login', asyncHandler(adminController.login));

// =============================================================================
// PROTECTED SUPER ADMIN ROUTES (REQUIRE AUTHENTICATE_ADMIN)
// =============================================================================
adminRouter.use(authenticateAdmin);

// Auth session
adminRouter.get('/auth/me', asyncHandler(adminController.getMe));
adminRouter.post('/auth/logout', asyncHandler(adminController.logout));

// Dashboard overview
adminRouter.get('/dashboard', asyncHandler(adminController.getDashboard));

// Gyms management & sensitive actions
adminRouter.get('/gyms', asyncHandler(adminController.getGyms));
adminRouter.get('/gyms/:id', asyncHandler(adminController.getGymDetail));
adminRouter.post('/gyms/:id/suspend', asyncHandler(adminController.suspendGym));
adminRouter.post('/gyms/:id/reactivate', asyncHandler(adminController.reactivateGym));
adminRouter.post('/gyms/:id/extend-trial', asyncHandler(adminController.extendTrial));
adminRouter.post('/gyms/:id/change-subscription', asyncHandler(adminController.changeSubscription));
adminRouter.post('/gyms/:id/adjust-locations', asyncHandler(adminController.adjustLocationLimit));

// Subscriptions & History
adminRouter.get('/subscriptions', asyncHandler(adminController.getSubscriptions));
adminRouter.get('/subscriptions/history', asyncHandler(adminController.getSubscriptionHistory));

// Revenue analytics
adminRouter.get('/revenue', asyncHandler(adminController.getRevenueAnalytics));

// Usage & Operating Costs
adminRouter.get('/usage-costs', asyncHandler(adminController.getUsageAndCosts));
adminRouter.get('/usage-costs/operating-costs', asyncHandler(adminController.getOperatingCosts));
adminRouter.post('/usage-costs/operating-costs', asyncHandler(adminController.addOperatingCost));
adminRouter.delete('/usage-costs/operating-costs/:id', asyncHandler(adminController.removeOperatingCost));
adminRouter.get('/settings/whatsapp-cost-rules', asyncHandler(adminController.getWhatsAppCostRules));
adminRouter.post('/settings/whatsapp-cost-rules', asyncHandler(adminController.saveWhatsAppCostRule));

// WhatsApp Operations
adminRouter.get('/whatsapp/operations', asyncHandler(adminController.getWhatsAppOperations));
adminRouter.get('/whatsapp/logs', asyncHandler(adminController.getWhatsAppLogs));

// Users directory
adminRouter.get('/users', asyncHandler(adminController.getUsers));

// Platform Alerts
adminRouter.get('/alerts', asyncHandler(adminController.getAlerts));
adminRouter.post('/alerts/:id/acknowledge', asyncHandler(adminController.acknowledgeAlert));
adminRouter.post('/alerts/:id/resolve', asyncHandler(adminController.resolveAlert));

// Audit Logs
adminRouter.get('/audit-logs', asyncHandler(adminController.getAuditLogs));

// System Health
adminRouter.get('/system-health', asyncHandler(adminController.getSystemHealth));

// Platform Settings & Admin Users
adminRouter.get('/settings', asyncHandler(adminController.getSettings));
adminRouter.post('/settings', asyncHandler(adminController.saveSetting));
adminRouter.post('/settings/admin-users', asyncHandler(adminController.createAdminUser));
adminRouter.patch('/settings/admin-users/:id/status', asyncHandler(adminController.toggleAdminStatus));

module.exports = { adminRouter };