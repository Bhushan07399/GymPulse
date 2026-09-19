/**
 * obo Unified Mobile App — Session & Authentication Models
 * Strongly-typed session models supporting Owner, Staff, and Member roles.
 */

import { UserRole } from './role';

export interface UserProfile {
  id: string;
  gymId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  memberId?: string; // Present for Member role
}

export interface GymLocation {
  id: string;
  name: string;
  city?: string;
  address?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  isMultiGym?: boolean;
  maxLocations?: number;
  billingCycle?: string;
  isCurrent?: boolean;
}

export interface AuthenticatedSession {
  userId: string;
  role: UserRole;
  gymId: string;
  token: string;
  profile: UserProfile;
  activeGym?: GymLocation;
  availableGyms?: GymLocation[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthenticatedSession | null;
}
