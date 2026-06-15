import type { AuthSession, UserProfile, UserRole } from "../types";
import { isGuestSessionUserId } from "./session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const AUTH_TOKEN_STORAGE_KEY = "arcadeiq.authToken";

export async function getUsers(): Promise<UserProfile[]> {
  const token = getStoredAuthToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`Users API returned ${response.status}`);
    }
    return (await response.json()) as UserProfile[];
  } catch (error) {
    console.warn("Unable to load account directory.", error);
    return [];
  }
}

export async function ensureSessionUser(userId: string): Promise<UserProfile> {
  if (!isGuestSessionUserId(userId)) {
    throw new Error("Authenticated account sessions require sign-in.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, displayName: formatSessionDisplayName(userId) }),
    });

    if (!response.ok) {
      throw new Error(`Session user API returned ${response.status}`);
    }

    return (await response.json()) as UserProfile;
  } catch (error) {
    console.warn("Using local mock session user because the backend API is unavailable.", error);
    return buildGuestProfile(userId);
  }
}

export async function loginUser(userId: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, password }),
  });

  if (!response.ok) {
    throw new Error(`Login API returned ${response.status}`);
  }

  const session = (await response.json()) as AuthSession;
  setStoredAuthToken(session.accessToken);
  return session;
}

export async function registerUser(email: string, displayName: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, displayName, password }),
  });

  if (!response.ok) {
    throw new Error(`Register API returned ${response.status}`);
  }

  const session = (await response.json()) as AuthSession;
  setStoredAuthToken(session.accessToken);
  return session;
}

export async function getAuthenticatedUser(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Auth me API returned ${response.status}`);
  }

  return (await response.json()) as UserProfile;
}

export function getStoredAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function formatRoleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "developer") return "Developer";
  if (role === "player") return "Player";
  return "Guest";
}

function buildGuestProfile(userId: string): UserProfile {
  return {
    id: userId,
    email: null,
    displayName: formatSessionDisplayName(userId),
    role: "guest",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function formatSessionDisplayName(userId: string) {
  const suffix = userId.replace(/^guest-/, "").slice(0, 8);
  return suffix ? `Guest ${suffix}` : "Guest User";
}
