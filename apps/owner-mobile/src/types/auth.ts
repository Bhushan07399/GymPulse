export interface User {
  id: string;
  gymId: string;
  role: 'owner' | 'staff' | 'admin';
  firstName: string;
  lastName: string;
  email: string;
}

export interface GymInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  gym?: GymInfo;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  gym: GymInfo | null;
}
