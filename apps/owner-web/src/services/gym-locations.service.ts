import { apiClient } from '@/src/lib/api-client';

export interface GymLocation {
  id: string;
  name: string;
  city: string;
  address?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isMultiGym?: boolean;
  maxLocations?: number;
  billingCycle?: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface ConsolidatedSummary {
  totalLocations: number;
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  todaysAttendance: number;
  totalOutstanding: number;
  locations: {
    id: string;
    name: string;
    city: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
    isMultiGym?: boolean;
    maxLocations?: number;
    billingCycle?: string;
    totalMembers: number;
    activeMembers: number;
    totalRevenue: number;
    todaysAttendance: number;
    totalOutstanding: number;
  }[];
}

export async function getMyGymLocations(): Promise<GymLocation[]> {
  const response = await apiClient.get('/auth/my-gyms');
  return response.data?.data || [];
}

export async function switchGymLocation(targetGymId: string): Promise<{ token: string; gym: any; owner: any }> {
  const response = await apiClient.post('/auth/switch-gym', { targetGymId });
  const { token } = response.data.data;
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('gympulse_token', token);
  }
  return response.data.data;
}

export async function createGymLocation(payload: {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}): Promise<{ token: string; gym: any; owner: any }> {
  const response = await apiClient.post('/gyms/create-location', payload);
  const { token } = response.data.data;
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('gympulse_token', token);
  }
  return response.data.data;
}

export async function updateGymSubscription(payload: {
  plan: 'Growth' | 'Pro' | 'Gym + Classes';
  isMultiGym: boolean;
  maxLocations: number;
  billingCycle: 'monthly' | 'yearly';
}): Promise<{ success: boolean; message: string; data: any }> {
  const response = await apiClient.post('/gyms/subscription', payload);
  return response.data;
}

export async function getConsolidatedSummary(): Promise<ConsolidatedSummary> {
  const response = await apiClient.get('/dashboard/consolidated');
  return response.data?.data;
}
