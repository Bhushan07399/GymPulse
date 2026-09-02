export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  error: {
    message: string;
  };
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthenticatedOwner = {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  owner: AuthenticatedOwner;
};
