import type { AuthSession, UserProfile, UserRole } from "../types";
import { ApiError, requestApi } from "./http";
import { API_BASE_URL, DATA_MODE } from "./runtime";

const AUTH_TOKEN_STORAGE_KEY = `arcadeiq.api.${encodeURIComponent(API_BASE_URL)}.authToken`;

export async function getUsers(): Promise<UserProfile[]> {
  if (DATA_MODE === "demo") return [];
  return requestApi<UserProfile[]>("/users", { headers: requireAuthHeaders() });
}

export async function loginUser(userId: string, password: string): Promise<AuthSession> {
  requireApiMode();
  return requestApi<AuthSession>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, password }),
  });
}

export async function registerUser(email: string, displayName: string, password: string): Promise<AuthSession> {
  requireApiMode();
  return requestApi<AuthSession>("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, displayName, password }),
  });
}

export async function getAuthenticatedUser(token: string): Promise<UserProfile> {
  requireApiMode();
  if (!token) throw new ApiError(401, "Sign in to access your account.");
  return requestApi<UserProfile>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getStoredAuthToken(): string | null {
  return DATA_MODE === "api" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
}

export function setStoredAuthToken(token: string) {
  if (DATA_MODE !== "api") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
  if (DATA_MODE !== "api") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function requireAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAuthToken();
  if (!token) throw new ApiError(401, "Sign in to access your collections.");
  return { ...headers, Authorization: `Bearer ${token}` };
}

function requireApiMode() {
  if (DATA_MODE !== "api") {
    throw new ApiError(400, "Account sign-in is available in API mode. Demo mode uses local samples.");
  }
}

export function formatRoleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "developer") return "Developer";
  if (role === "player") return "Player";
  return "Guest";
}
