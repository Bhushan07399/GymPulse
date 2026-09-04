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
    { gymId: owner.gym_id, role: owner.role, email: owner.email },
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
    { gymId: gym.id, role: owner.role, email: owner.email },
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

const getMyGymLocations = async (ownerEmail) => {
  if (!ownerEmail) {
    throw new AppError(401, 'Unauthorized: Owner context missing');
  }
  return await authRepository.getOwnerLocations(ownerEmail);
};

const switchGymLocation = async ({ ownerEmail, targetGymId }) => {
  if (!ownerEmail || !targetGymId) {
    throw new AppError(400, 'Target gymId is required.');
  }

  const staffOwner = await authRepository.findOwnerStaffForGym(ownerEmail, targetGymId);
  if (!staffOwner) {
    throw new AppError(403, 'Unauthorized: You do not have owner access to this gym location.');
  }

  const newToken = jwt.sign(
    { gymId: staffOwner.gym_id, role: staffOwner.role, email: staffOwner.email },
    env.jwtSecret,
    { subject: staffOwner.id, expiresIn: '7d' }
  );

  return {
    token: newToken,
    owner: {
      id: staffOwner.id,
      gymId: staffOwner.gym_id,
      firstName: staffOwner.first_name,
      lastName: staffOwner.last_name,
      email: staffOwner.email,
      role: staffOwner.role
    },
    gym: {
      id: staffOwner.gym_id,
      name: staffOwner.gym_name,
      subscriptionPlan: staffOwner.subscription_plan,
      subscriptionStatus: staffOwner.subscription_status,
      isMultiGym: Boolean(staffOwner.is_multi_gym),
      maxLocations: Number(staffOwner.max_locations || 1),
      billingCycle: staffOwner.billing_cycle || 'monthly'
    }
  };
};

const createNewGymLocation = async ({ ownerEmail, gymName, address, city, state, country, pincode, phone }) => {
  if (!ownerEmail) {
    throw new AppError(401, 'Unauthorized: Owner context missing');
  }

  if (!gymName || !gymName.trim()) {
    throw new AppError(400, 'Gym location name is required.');
  }

  const locations = await authRepository.getOwnerLocations(ownerEmail);
  const totalLocations = locations.length;

  // Primary gym holds the active subscription configuration
  const primaryGym = locations.find((loc) => loc.subscription_status === 'ACTIVE' && loc.is_multi_gym) || locations[0];
  const isSubActive = primaryGym?.subscription_status === 'ACTIVE';
  const isMultiGym = Boolean(isSubActive && (primaryGym?.is_multi_gym || String(primaryGym?.subscription_plan).toLowerCase().includes('multi')));
  const maxAllowed = isMultiGym ? Number(primaryGym?.max_locations || 5) : 1;

  if (!isMultiGym || maxAllowed <= 1) {
    throw new AppError(
      403,
      'Multi-Gym subscription required to manage multiple gym locations.'
    );
  }

  if (totalLocations >= maxAllowed) {
    throw new AppError(
      403,
      `Maximum location limit (${maxAllowed} locations) reached for your Multi-Gym plan.`
    );
  }

  const { gym, owner } = await authRepository.addGymLocationWithOwner({
    ownerEmail,
    gymName,
    address,
    city,
    state,
    country,
    pincode,
    phone
  });

  const newToken = jwt.sign(
    { gymId: gym.id, role: owner.role, email: owner.email },
    env.jwtSecret,
    { subject: owner.id, expiresIn: '7d' }
  );

  return {
    token: newToken,
    gym,
    owner
  };
};

module.exports = {
  loginOwner,
  registerOwner,
  registerGymAccount,
  getMyGymLocations,
  switchGymLocation,
  createNewGymLocation
};
