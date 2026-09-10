import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const AUTH_TOKEN_KEY = "gympulse.auth-token";
const MEMBER_TOKEN_KEY = "gympulse.member-token";
const ADMIN_TOKEN_KEY = "obo.admin-token";

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
  const isAdminRoute = url.startsWith("/admin") || url.startsWith("admin");
  const isMemberAppRoute = url.startsWith("/member/") || url.startsWith("/member-app/");
  
  let token = null;
  if (isAdminRoute) {
    token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } else if (isMemberAppRoute) {
    token = window.localStorage.getItem(MEMBER_TOKEN_KEY) || window.localStorage.getItem(AUTH_TOKEN_KEY);
  } else {
    token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { AUTH_TOKEN_KEY, MEMBER_TOKEN_KEY, ADMIN_TOKEN_KEY };
