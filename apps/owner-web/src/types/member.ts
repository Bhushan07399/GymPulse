export type Member = {
  id: string;
  memberId: string;
  gymId: string;
  membershipPlanId: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  dateOfBirth: string;
  phone: string;
  email: string;
  emergencyContact: string;
  address: string;
  joinDate: string;
  expiryDate: string;
  qrCode: string;
  profilePhotoUrl: string | null;
  medicalNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemberInput = {
  membershipPlanId: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  dateOfBirth?: string;
  phone: string;
  email?: string;
  emergencyContact?: string;
  address?: string;
  joinDate: string;
  expiryDate?: string;
  qrCode?: string;
  profilePhotoUrl?: string;
  medicalNotes?: string;
  isActive?: boolean;
  paymentStatus?: "Paid" | "Partial" | "Unpaid";
  amountPaid?: number;
  paymentMethod?: "Cash" | "UPI" | "Card" | "Bank Transfer";
};

export type MembershipPlan = {
  id: string;
  gymId: string;
  planName: string;
  durationInDays: number;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MembershipPlanInput = {
  planName: string;
  durationInDays: number;
  price: number;
  description?: string;
  isActive: boolean;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};


