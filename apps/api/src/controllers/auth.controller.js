const { loginOwner, registerOwner, registerGymAccount } = require('../services/auth.service');

const login = async (request, response) => {
  const { owner, token } = await loginOwner(request.validated.body);

  response.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      owner: {
        id: owner.id,
        gymId: owner.gym_id,
        firstName: owner.first_name,
        lastName: owner.last_name,
        email: owner.email,
        role: owner.role
      }
    }
  });
};

const logout = (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

const register = async (request, response) => {
  const owner = await registerOwner(request.validated.body);

  response.status(201).json({
    success: true,
    message: 'Owner registered successfully.',
    data: {
      owner: {
        id: owner.id,
        gymId: owner.gym_id,
        firstName: owner.first_name,
        lastName: owner.last_name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
        createdAt: owner.created_at
      }
    }
  });
};

const createGymAccount = async (request, response) => {
  const result = await registerGymAccount(request.body);

  response.status(201).json({
    success: true,
    message: 'Gym account created successfully.',
    data: result
  });
};

module.exports = { login, logout, register, createGymAccount };
