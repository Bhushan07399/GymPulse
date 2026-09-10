const adminService = require('../services/admin.service');

// Auth
const login = async (req, res) => {
  const { email, password } = req.body;
  const data = await adminService.loginSuperAdmin({ email, password });
  res.status(200).json({ success: true, message: 'Super Admin login successful.', data });
};

const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { admin: req.admin } });
};

const logout = async (_req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// Dashboard
const getDashboard = async (_req, res) => {
  const data = await adminService.getDashboardOverview();
  res.status(200).json({ success: true, data });
};

// Gyms
const getGyms = async (req, res) => {
  const data = await adminService.getGyms(req.query);
  res.status(200).json({ success: true, data });
};

const getGymDetail = async (req, res) => {
  const data = await adminService.getGymDetail(req.params.id);
  res.status(200).json({ success: true, data });
};

const suspendGym = async (req, res) => {
  const data = await adminService.suspendGym(req.params.id, req.body.reason, req.admin);
  res.status(200).json({ success: true, message: 'Gym suspended successfully.', data });
};

const reactivateGym = async (req, res) => {
  const data = await adminService.reactivateGym(req.params.id, req.body.reason, req.admin);
  res.status(200).json({ success: true, message: 'Gym reactivated successfully.', data });
};

const extendTrial = async (req, res) => {
  const data = await adminService.extendGymTrial(req.params.id, req.body.days, req.body.reason, req.admin);
  res.status(200).json({ success: true, message: 'Gym trial extended successfully.', data });
};

const changeSubscription = async (req, res) => {
  const data = await adminService.changeGymSubscription(req.params.id, req.body, req.body.reason, req.admin);
  res.status(200).json({ success: true, message: 'Subscription updated successfully.', data });
};

const adjustLocationLimit = async (req, res) => {
  const data = await adminService.adjustGymLocationLimit(req.params.id, req.body.maxLocations, req.body.reason, req.admin);
  res.status(200).json({ success: true, message: 'Location limit adjusted successfully.', data });
};

// Subscriptions
const getSubscriptions = async (req, res) => {
  const data = await adminService.getSubscriptions(req.query);
  res.status(200).json({ success: true, data });
};

const getSubscriptionHistory = async (req, res) => {
  const data = await adminService.getSubscriptionHistory(req.query.gymId, req.query.limit);
  res.status(200).json({ success: true, data: { history: data } });
};

// Revenue
const getRevenueAnalytics = async (_req, res) => {
  const data = await adminService.getRevenueAnalytics();
  res.status(200).json({ success: true, data });
};

// Usage & Costs
const getUsageAndCosts = async (req, res) => {
  const data = await adminService.getUsageAndCosts(req.query.month);
  res.status(200).json({ success: true, data });
};

const getOperatingCosts = async (req, res) => {
  const data = await adminService.getOperatingCosts(req.query.month);
  res.status(200).json({ success: true, data: { costs: data } });
};

const addOperatingCost = async (req, res) => {
  const data = await adminService.addOperatingCost(req.body, req.admin);
  res.status(201).json({ success: true, message: 'Operating cost added successfully.', data });
};

const removeOperatingCost = async (req, res) => {
  const data = await adminService.deleteOperatingCost(req.params.id, req.admin);
  res.status(200).json({ success: true, message: 'Operating cost removed successfully.', data });
};

const getWhatsAppCostRules = async (_req, res) => {
  const data = await adminService.getWhatsAppCostRules();
  res.status(200).json({ success: true, data: { rules: data } });
};

const saveWhatsAppCostRule = async (req, res) => {
  const data = await adminService.saveWhatsAppCostRule(req.body, req.admin);
  res.status(200).json({ success: true, message: 'Cost rule saved successfully.', data });
};

// WhatsApp Operations
const getWhatsAppOperations = async (req, res) => {
  const data = await adminService.getWhatsAppOperations(req.query.days);
  res.status(200).json({ success: true, data });
};

const getWhatsAppLogs = async (req, res) => {
  const data = await adminService.getWhatsAppLogs(req.query);
  res.status(200).json({ success: true, data });
};

// Users
const getUsers = async (req, res) => {
  const data = await adminService.getUsers(req.query);
  res.status(200).json({ success: true, data });
};

// Alerts
const getAlerts = async (req, res) => {
  const data = await adminService.getAlerts(req.query);
  res.status(200).json({ success: true, data: { alerts: data } });
};

const acknowledgeAlert = async (req, res) => {
  const data = await adminService.acknowledgeAlert(req.params.id, req.admin);
  res.status(200).json({ success: true, message: 'Alert acknowledged.', data });
};

const resolveAlert = async (req, res) => {
  const data = await adminService.resolveAlert(req.params.id, req.admin);
  res.status(200).json({ success: true, message: 'Alert resolved.', data });
};

// Audit Logs
const getAuditLogs = async (req, res) => {
  const data = await adminService.getAuditLogs(req.query);
  res.status(200).json({ success: true, data });
};

// System Health
const getSystemHealth = async (_req, res) => {
  const data = await adminService.getSystemHealth();
  res.status(200).json({ success: true, data });
};

// Settings
const getSettings = async (_req, res) => {
  const data = await adminService.getSettings();
  res.status(200).json({ success: true, data });
};

const saveSetting = async (req, res) => {
  const { key, value, description } = req.body;
  const data = await adminService.saveSetting(key, value, description, req.admin);
  res.status(200).json({ success: true, message: 'Setting saved.', data });
};

const createAdminUser = async (req, res) => {
  const data = await adminService.createAdminUser(req.body, req.admin);
  res.status(201).json({ success: true, message: 'Admin user created successfully.', data });
};

const toggleAdminStatus = async (req, res) => {
  const data = await adminService.toggleAdminStatus(req.params.id, req.body.isActive, req.admin);
  res.status(200).json({ success: true, message: 'Admin status updated successfully.', data });
};

module.exports = {
  login,
  getMe,
  logout,
  getDashboard,
  getGyms,
  getGymDetail,
  suspendGym,
  reactivateGym,
  extendTrial,
  changeSubscription,
  adjustLocationLimit,
  getSubscriptions,
  getSubscriptionHistory,
  getRevenueAnalytics,
  getUsageAndCosts,
  getOperatingCosts,
  addOperatingCost,
  removeOperatingCost,
  getWhatsAppCostRules,
  saveWhatsAppCostRule,
  getWhatsAppOperations,
  getWhatsAppLogs,
  getUsers,
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAuditLogs,
  getSystemHealth,
  getSettings,
  saveSetting,
  createAdminUser,
  toggleAdminStatus
};