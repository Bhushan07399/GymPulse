/**
 * obo Unified Mobile App — Role Types
 * Single source of truth for role definitions across Owner, Staff, and Member.
 * Server is the sole authorization authority.
 */

export type UserRole = 'Owner' | 'Staff' | 'Member';

export const USER_ROLES: readonly UserRole[] = ['Owner', 'Staff', 'Member'] as const;

export const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && (value === 'Owner' || value === 'Staff' || value === 'Member');
};
