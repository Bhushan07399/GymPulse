/**
 * Frontend subscription adapter.
 * Replace these placeholders with the subscription response once billing APIs are available.
 */
export const isDevelopmentMode = true;
// DEVELOPMENT ONLY
// Remove this bypass before production launch.
export const hasActiveSubscription = false;
export const hasExpiredTrial = false;
export const AUTH_ROLE_KEY = "gympulse.auth-role";

export type FoundingMemberOffer = {
  claimedSlots: number;
  totalSlots: number;
};

// Placeholder subscription data; replace this object with the billing API response.
// Set it to null, or return claimedSlots >= totalSlots, to hide the offer automatically.
export const foundingMemberOffer: FoundingMemberOffer | null = {
  claimedSlots: 2,
  totalSlots: 5,
};

export function isSuperAdmin(role: string | null) {
  return role === "Super Admin";
}

export function canAccessDashboard(role: string | null) {
  // TESTING PHASE BYPASS: Allow all authenticated roles to access dashboard features during testing
  return true; // Original check: hasActiveSubscription || isSuperAdmin(role);
}
