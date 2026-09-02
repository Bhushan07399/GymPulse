export interface MembershipPlan {
  id: string;
  gymId: string;
  planName: string;
  durationInDays: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  memberId: string;
  gymId: string;
  membershipPlanId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  phone: string;
  email?: string;
  emergencyContact?: string;
  address?: string;
  joinDate: string;
  expiryDate: string;
  qrCode?: string;
  profilePhotoUrl?: string | null;
  medicalNotes?: string | null;
  isActive: boolean;
  membershipPlan?: MembershipPlan;
  createdAt: string;
  updatedAt: string;
}

export interface MemberInput {
  membershipPlanId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string;
  phone: string;
  email?: string;
  emergencyContact?: string;
  address?: string;
  joinDate: string;
  expiryDate?: string;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid';
  amountPaid?: number;
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
