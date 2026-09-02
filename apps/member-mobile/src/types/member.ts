export interface MemberDashboardSummary {
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    phone: string;
    gymName: string;
    gymId: string;
  };
  membership: {
    planName: string;
    status: 'Active' | 'Expiring Soon' | 'Expired' | 'Inactive';
    expiryDate: string;
    daysRemaining: number;
    startDate?: string;
  };
  attendance: {
    totalCheckIns: number;
    lastCheckInDate: string | null;
  };
  hasClassFeature?: boolean;
  hasClassEntitlement?: boolean;
}

export interface DigitalCardData {
  memberId: string;
  name: string;
  gymName: string;
  gymId: string;
  qrToken: string; // Payload: GYMPULSE-MEMBER:<id>:<gymId>
  status: string;
  expiryDate: string;
  profilePhotoUrl?: string | null;
}
