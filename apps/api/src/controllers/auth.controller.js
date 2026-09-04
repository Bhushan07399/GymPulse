const {
  loginOwner,
  registerOwner,
  registerGymAccount,
  getMyGymLocations,
  switchGymLocation,
  createNewGymLocation
} = require('../services/auth.service');

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

const getMyGyms = async (request, response) => {
  const locations = await getMyGymLocations(request.user?.email);
  const currentGymId = request.user?.gymId;

  const data = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    city: loc.city,
    address: loc.address,
    subscriptionPlan: loc.subscription_plan,
    subscriptionStatus: loc.subscription_status,
    isMultiGym: Boolean(loc.is_multi_gym),
    maxLocations: Number(loc.max_locations || 1),
    billingCycle: loc.billing_cycle || 'monthly',
    createdAt: loc.created_at,
    isCurrent: loc.id === currentGymId
  }));

  response.status(200).json({
    success: true,
    data
  });
};

const switchGym = async (request, response) => {
  const { targetGymId } = request.body;
  const result = await switchGymLocation({
    ownerEmail: request.user?.email,
    targetGymId
  });

  response.status(200).json({
    success: true,
    message: `Switched location to ${result.gym.name}`,
    data: result
  });
};

const createLocation = async (request, response) => {
  const { name, address, city, state, country, pincode, phone } = request.body;
  const result = await createNewGymLocation({
    ownerEmail: request.user?.email,
    gymName: name,
    address,
    city,
    state,
    country,
    pincode,
    phone
  });

  response.status(201).json({
    success: true,
    message: 'New gym location created successfully.',
    data: result
  });
};

module.exports = {
  login,
  logout,
  register,
  createGymAccount,
  getMyGyms,
  switchGym,
  createLocation
};
