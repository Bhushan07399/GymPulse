export type MemberLoginCredentials = {
  identifier: string;
  password: string;
};

export type MemberUser = {
  id: string;
  memberId: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "Member";
};

export type MemberLoginResponse = {
  token: string;
  member: MemberUser;
};

export type MemberProfileData = {
  id: string;
  memberId: string;
  gymId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  emergencyContact: string;
  address: string;
  joinDate: string;
  expiryDate: string;
  daysRemaining: number;
  isMembershipActive: boolean;
  qrCode: string;
  profilePhotoUrl: string | null;
  gymName: string;
  gymLogoUrl: string | null;
  planName: string;
  planPrice: number;
};

export type MemberAttendanceData = {
  todayStatus: {
    checkedIn: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    method?: string;
  };
  totalCheckins: number;
  monthCheckins: number;
  streakDays: number;
};

export type MemberPaymentData = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  planName: string;
  nextDueDate: string;
} | null;

export type MemberCrowdData = {
  currentOccupancy: number;
  maxCapacity: number;
  occupancyPercentage: number;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
};

export type MemberDashboardData = {
  profile: MemberProfileData;
  attendance: MemberAttendanceData;
  payment: MemberPaymentData;
  crowd: MemberCrowdData;
};
