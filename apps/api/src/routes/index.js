const { Router } = require('express');
const { authRouter } = require('./auth.routes');
const { attendanceRouter } = require('./attendance.routes');
const { dashboardRouter } = require('./dashboard.routes');
const { gymRouter } = require('./gym.routes');
const { healthRouter } = require('./health.routes');
const { membershipPlanRouter } = require('./membership-plan.routes');
const { memberRouter } = require('./member.routes');
const { paymentRouter } = require('./payment.routes');
const { reportRouter } = require('./report.routes');
const { staffRouter } = require('./staff.routes');
const { whatsappRouter } = require('./whatsapp.routes');
const { classesRouter } = require('./classes.routes');
const { classPlansRouter } = require('./class-plans.routes');
const { bmiRouter } = require('./bmi.routes');

const { memberAppRouter } = require('./member-app.routes');

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/api/v1/auth', authRouter);
apiRouter.use('/api/v1/gyms', gymRouter);
apiRouter.use('/api/v1/membership-plans', membershipPlanRouter);
apiRouter.use('/api/v1/members', memberRouter);
apiRouter.use('/api/v1/attendance', attendanceRouter);
apiRouter.use('/api/v1/payments', paymentRouter);
apiRouter.use('/api/v1/dashboard', dashboardRouter);
apiRouter.use('/api/v1/reports', reportRouter);
apiRouter.use('/api/v1/staff', staffRouter);
apiRouter.use('/api/v1/whatsapp', whatsappRouter);
apiRouter.use('/api/v1/classes', classesRouter);
apiRouter.use('/api/v1/class-plans', classPlansRouter);
apiRouter.use('/api/v1/bmi', bmiRouter);
apiRouter.use('/api/v1/member', memberAppRouter);

module.exports = { apiRouter };
