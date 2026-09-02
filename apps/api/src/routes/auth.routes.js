const { Router } = require('express');
const { login, logout, register, createGymAccount } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');
const { asyncHandler } = require('../middleware/async-handler');
const { ownerLoginSchema, ownerRegistrationSchema } = require('../validations/auth.validation');
const { validate } = require('../validations/validate');

const authRouter = Router();

authRouter.post('/login', validate(ownerLoginSchema), asyncHandler(login));
authRouter.post('/logout', authenticate, logout);
authRouter.post('/register', validate(ownerRegistrationSchema), asyncHandler(register));
authRouter.post('/create-gym-account', asyncHandler(createGymAccount));

module.exports = { authRouter };
