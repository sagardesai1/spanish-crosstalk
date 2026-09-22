/**
 * Anonymous guest id stored in localStorage before (or without) Firebase Auth.
 */

export const USER_ID_STORAGE_KEY = "spanish-crosstalk-user-id";

export function createUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;
  const id = createUserId();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, id);
  return id;
}

export function peekAnonymousUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}
