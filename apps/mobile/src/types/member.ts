/**
 * obo Unified Mobile App — Member Types
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Member {
  id: string;
  memberId: string;
  gymId: string;
  membershipPlanId?: string;
  membershipPlanName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: string;
  joinDate?: string;
  expiryDate: string;
  isActive: boolean;
  outstandingAmount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  daysRemaining?: number;
}

export interface MemberInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: string;
  membershipPlanId: string;
  joinDate?: string;
  notes?: string;
  initialPaymentAmount?: number;
  paymentMethod?: string;
}

export interface DigitalCardData {
  memberId: string;
  name: string;
  gymName: string;
  gymId: string;
  qrToken: string;
  status: string;
  expiryDate: string;
  profilePhotoUrl?: string;
}
