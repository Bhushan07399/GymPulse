const { Router } = require('express');
const bmiController = require('../controllers/bmi.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');

const bmiRouter = Router();

bmiRouter.use(authenticate);

bmiRouter.get('/members/:memberId', asyncHandler(bmiController.listAppointmentsByMember));

// Staff & Owner Routes
bmiRouter.get('/assessments', authorize('Owner', 'Staff'), asyncHandler(bmiController.listAppointments));
bmiRouter.post('/appointments', authorize('Owner', 'Staff'), asyncHandler(bmiController.createAppointment));
bmiRouter.get('/appointments/:id', authorize('Owner', 'Staff'), asyncHandler(bmiController.getAppointment));
bmiRouter.put('/appointments/:id', authorize('Owner', 'Staff'), asyncHandler(bmiController.updateAppointment));
bmiRouter.delete('/appointments/:id', authorize('Owner', 'Staff'), asyncHandler(bmiController.deleteAppointment));

module.exports = { bmiRouter };
