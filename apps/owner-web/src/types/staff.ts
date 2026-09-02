export type StaffMember = {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Receptionist' | 'Trainer';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CreateStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: 'Receptionist';
};

export type UpdateStaffInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'Receptionist';
};
