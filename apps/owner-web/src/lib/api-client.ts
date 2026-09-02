import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const AUTH_TOKEN_KEY = "gympulse.auth-token";
const MEMBER_TOKEN_KEY = "gympulse.member-token";

export const apiClient = axios.create({
  baseURL: `${API_URL.replace(/\/$/, "")}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const url = config.url ?? "";
  const isMemberAppRoute = url.startsWith("/member/") || url.startsWith("/member-app/");
  
  let token = window.localStorage.getItem(isMemberAppRoute ? MEMBER_TOKEN_KEY : AUTH_TOKEN_KEY);
  if (!token && isMemberAppRoute) {
    token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { AUTH_TOKEN_KEY, MEMBER_TOKEN_KEY };
