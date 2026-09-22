/**
 * Client-side progress helpers (anonymous user id + display formatting).
 * Persistence lives in Firestore via /api/progress.
 */

import { getIdToken } from "@/lib/authClient";
import {
  USER_ID_STORAGE_KEY,
  createUserId,
  getOrCreateUserId,
} from "@/lib/anonymousUser";

export { USER_ID_STORAGE_KEY, createUserId, getOrCreateUserId };

export type ProgressResponse = {
  userId: string;
  date: string;
  secondsToday: number;
  dailyGoalMinutes: number;
  goalHit: boolean;
};

export type CalendarDay = {
  date: string;
  seconds: number;
  minutes: number;
  goalHit: boolean;
};

export type CalendarResponse = {
  userId: string;
  year: number;
  month: number;
  dailyGoalMinutes: number;
  days: CalendarDay[];
  practicedDays: number;
  goalHitDays: number;
  currentStreak: number;
};

export function goalReached(seconds: number, dailyGoalMinutes: number): boolean {
  return seconds >= dailyGoalMinutes * 60;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProgress(userId: string): Promise<ProgressResponse> {
  const headers = await authHeaders();
  const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as ProgressResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't load progress");
  }
  return json;
}

export async function fetchCalendarMonth(
  userId: string,
  year: number,
  month: number,
): Promise<CalendarResponse> {
  const headers = await authHeaders();
  const params = new URLSearchParams({
    userId,
    year: String(year),
    month: String(month),
  });
  const res = await fetch(`/api/progress?${params.toString()}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as CalendarResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't load calendar");
  }
  return json;
}

export async function postProgress(body: {
  userId: string;
  addSeconds?: number;
  dailyGoalMinutes?: number;
}): Promise<ProgressResponse> {
  const headers = await authHeaders();
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as ProgressResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't update progress");
  }
  return json;
}
