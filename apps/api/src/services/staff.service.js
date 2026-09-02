const bcrypt = require('bcrypt');
const staffRepository = require('../repositories/staff.repository');
const { AppError } = require('../utils/app-error');

const PASSWORD_SALT_ROUNDS = 12;

const getStaffList = async (gymId, filters) => {
  return staffRepository.listStaff(gymId, filters);
};

const getStaffById = async (gymId, staffId) => {
  const staff = await staffRepository.findStaffById(gymId, staffId);
  if (!staff) {
    throw new AppError(404, 'Staff member not found or access denied.');
  }
  return staff;
};

const createStaff = async (gymId, { firstName, lastName, email, phone, password, role }) => {
  if (role && role !== 'Receptionist') {
    throw new AppError(400, 'Invalid staff role. Only Receptionist accounts can be created.');
  }

  const existing = await staffRepository.findStaffByEmail(email);
  if (existing) {
    throw new AppError(409, 'An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  return staffRepository.createStaffRecord({
    gymId,
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role: 'Receptionist'
  });
};

const updateStaff = async (gymId, staffId, { firstName, lastName, email, phone, role }) => {
  const existing = await staffRepository.findStaffById(gymId, staffId);
  if (!existing) {
    throw new AppError(404, 'Staff member not found or access denied.');
  }

  if (role && role !== 'Receptionist' && existing.role !== 'Owner') {
    throw new AppError(400, 'Staff role cannot be changed to Owner.');
  }

  if (email && email.toLowerCase() !== existing.email.toLowerCase()) {
    const emailConflict = await staffRepository.findStaffByEmail(email);
    if (emailConflict) {
      throw new AppError(409, 'An account with this email address already exists.');
    }
  }

  return staffRepository.updateStaffRecord(gymId, staffId, {
    firstName,
    lastName,
    email,
    phone,
    role: existing.role === 'Owner' ? 'Owner' : 'Receptionist'
  });
};

const updateStaffStatus = async (gymId, ownerStaffId, staffId, isActive) => {
  if (String(ownerStaffId) === String(staffId)) {
    throw new AppError(400, 'You cannot deactivate your own Owner account.');
  }

  const updated = await staffRepository.updateStaffStatusRecord(gymId, staffId, isActive);
  if (!updated) {
    throw new AppError(404, 'Staff member not found or access denied.');
  }
  return updated;
};

const deleteStaff = async (gymId, ownerStaffId, staffId) => {
  if (String(ownerStaffId) === String(staffId)) {
    throw new AppError(400, 'You cannot delete your own Owner account.');
  }

  const deleted = await staffRepository.softDeleteStaffRecord(gymId, staffId);
  if (!deleted) {
    throw new AppError(404, 'Staff member not found or access denied.');
  }
  return deleted;
};

const resetStaffPassword = async (gymId, staffId, newPassword) => {
  const existing = await staffRepository.findStaffById(gymId, staffId);
  if (!existing) {
    throw new AppError(404, 'Staff member not found or access denied.');
  }

  const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await staffRepository.updateStaffPasswordRecord(gymId, staffId, passwordHash);
};

module.exports = {
  getStaffList,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  resetStaffPassword
};
