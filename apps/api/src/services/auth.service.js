const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const authRepository = require('../repositories/auth.repository');
const { AppError } = require('../utils/app-error');

const PASSWORD_SALT_ROUNDS = 12;

const loginOwner = async ({ email, password }) => {
  const owner = await authRepository.findOwnerByEmail(email);

  if (!owner || !(await bcrypt.compare(password, owner.password_hash))) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const token = jwt.sign(
    { gymId: owner.gym_id, role: owner.role },
    env.jwtSecret,
    { subject: owner.id, expiresIn: '7d' }
  );

  return { owner, token };
};

const registerOwner = async ({ gymId, firstName, lastName, email, phone, password }) => {
  const existingStaff = await authRepository.findStaffByEmail(email);

  if (existingStaff) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const gym = await authRepository.findGymById(gymId);

  if (!gym) {
    throw new AppError(404, 'Gym not found.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  try {
    return await authRepository.createOwner({
      gymId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'An account with this email already exists.');
    }

    throw error;
  }
};

const registerGymAccount = async ({
  gymName,
  firstName,
  lastName,
  email,
  phone,
  address,
  city,
  state,
  country,
  pincode,
  subscriptionPlan,
  password
}) => {
  const existingStaff = await authRepository.findStaffByEmail(email);
  if (existingStaff) {
    throw new AppError(409, 'An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const { gym, owner } = await authRepository.createGymWithOwner({
    gymName,
    ownerFirstName: firstName,
    ownerLastName: lastName,
    email,
    phone,
    address,
    city,
    state,
    country,
    pincode,
    subscriptionPlan: subscriptionPlan || 'Growth',
    passwordHash
  });

  const token = jwt.sign(
    { gymId: gym.id, role: owner.role },
    env.jwtSecret,
    { subject: owner.id, expiresIn: '7d' }
  );

  return {
    token,
    gym,
    owner: {
      id: owner.id,
      gymId: owner.gym_id,
      firstName: owner.first_name,
      lastName: owner.last_name,
      email: owner.email,
      role: owner.role
    }
  };
};

module.exports = { loginOwner, registerOwner, registerGymAccount };
