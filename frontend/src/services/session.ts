const ACTIVE_SESSION_STORAGE_KEY = "arcadeiq.activeSessionUserId";
const KNOWN_SESSIONS_STORAGE_KEY = "arcadeiq.knownSessionUserIds";

export function getActiveSessionUserId(): string {
  const storedUserId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
  if (storedUserId) {
    rememberSessionUserId(storedUserId);
    return storedUserId;
  }

  const userId = createSessionUserId();
  setActiveSessionUserId(userId);
  return userId;
}

export function getKnownSessionUserIds(): string[] {
  try {
    const rawValue = window.localStorage.getItem(KNOWN_SESSIONS_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0) : [];
  } catch {
    return [];
  }
}

export function setActiveSessionUserId(userId: string) {
  const normalizedUserId = normalizeSessionUserId(userId);
  window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, normalizedUserId);
  rememberSessionUserId(normalizedUserId);
}

export function createSessionUserId(): string {
  const randomPart = window.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10);
  return `guest-${randomPart}`;
}

function rememberSessionUserId(userId: string) {
  const knownUserIds = getKnownSessionUserIds();
  if (knownUserIds.includes(userId)) return;
  window.localStorage.setItem(KNOWN_SESSIONS_STORAGE_KEY, JSON.stringify([userId, ...knownUserIds].slice(0, 6)));
}

function normalizeSessionUserId(userId: string) {
  const normalizedUserId = userId.trim();
  return normalizedUserId || createSessionUserId();
}
