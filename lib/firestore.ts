/**
 * Firestore access via Firebase Admin (server-side only).
 * Reuses the same GCP service account as Text-to-Speech.
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebaseAdmin";
import { DEFAULT_SETTINGS } from "./settings";
import type { StoredChatMessage } from "./types";

export type { StoredChatMessage };

export type ProgressSnapshot = {
  userId: string;
  date: string;
  secondsToday: number;
  dailyGoalMinutes: number;
  goalHit: boolean;
};

export type DayProgress = {
  date: string;
  seconds: number;
  minutes: number;
  goalHit: boolean;
};

export type CalendarMonthSnapshot = {
  userId: string;
  year: number;
  month: number;
  dailyGoalMinutes: number;
  days: DayProgress[];
  practicedDays: number;
  goalHitDays: number;
  currentStreak: number;
};

export type ConversationSnapshot = {
  userId: string;
  date: string;
  messages: StoredChatMessage[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDb(): Firestore {
  return getAdminFirestore();
}

function userRef(userId: string) {
  return getDb().collection("users").doc(userId);
}

function dayRef(userId: string, date: string) {
  return userRef(userId).collection("dailyProgress").doc(date);
}

export async function getProgressSnapshot(userId: string): Promise<ProgressSnapshot> {
  const date = localDateKey();
  const [userSnap, daySnap] = await Promise.all([
    userRef(userId).get(),
    dayRef(userId, date).get(),
  ]);

  const dailyGoalMinutes =
    typeof userSnap.data()?.dailyGoalMinutes === "number"
      ? (userSnap.data()?.dailyGoalMinutes as number)
      : DEFAULT_SETTINGS.dailyGoalMinutes;

  const secondsToday =
    typeof daySnap.data()?.seconds === "number"
      ? Math.max(0, Math.floor(daySnap.data()?.seconds as number))
      : 0;

  return {
    userId,
    date,
    secondsToday,
    dailyGoalMinutes,
    goalHit: secondsToday >= dailyGoalMinutes * 60,
  };
}

export async function addPracticeSeconds(
  userId: string,
  seconds: number,
): Promise<ProgressSnapshot> {
  const amount = Math.max(0, Math.floor(seconds));
  const date = localDateKey();
  const ref = dayRef(userId, date);

  if (amount > 0) {
    await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current =
        typeof snap.data()?.seconds === "number"
          ? Math.floor(snap.data()?.seconds as number)
          : 0;
      tx.set(
        ref,
        {
          seconds: current + amount,
          date,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    await userRef(userId).set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        lastPracticedDate: date,
      },
      { merge: true },
    );
  }

  return getProgressSnapshot(userId);
}

export async function setDailyGoalMinutes(
  userId: string,
  dailyGoalMinutes: number,
): Promise<ProgressSnapshot> {
  await userRef(userId).set(
    {
      dailyGoalMinutes,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return getProgressSnapshot(userId);
}

async function getDailyGoalMinutes(userId: string): Promise<number> {
  const userSnap = await userRef(userId).get();
  return typeof userSnap.data()?.dailyGoalMinutes === "number"
    ? (userSnap.data()?.dailyGoalMinutes as number)
    : DEFAULT_SETTINGS.dailyGoalMinutes;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return localDateKey(date);
}

function computeStreak(daySeconds: Map<string, number>): number {
  let streak = 0;
  let cursor = localDateKey();

  // If nothing today yet, start from yesterday so an empty today doesn't break the streak.
  const todaySeconds = daySeconds.get(cursor) ?? 0;
  if (todaySeconds <= 0) {
    cursor = shiftDateKey(cursor, -1);
  }

  while (streak < 400) {
    const seconds = daySeconds.get(cursor) ?? 0;
    if (seconds <= 0) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

export async function getCalendarMonth(
  userId: string,
  year: number,
  month: number,
): Promise<CalendarMonthSnapshot> {
  if (month < 1 || month > 12 || year < 2020 || year > 2100) {
    throw new Error("Invalid month");
  }

  const dailyGoalMinutes = await getDailyGoalMinutes(userId);
  const start = `${year}-${pad(month)}-01`;
  const end = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`;

  // Also pull a lookback window so streaks can span month boundaries.
  const lookbackStart = shiftDateKey(start, -60);

  const snap = await userRef(userId)
    .collection("dailyProgress")
    .where("date", ">=", lookbackStart)
    .where("date", "<=", end)
    .get();

  const daySeconds = new Map<string, number>();
  for (const doc of snap.docs) {
    const data = doc.data();
    const date = typeof data.date === "string" ? data.date : doc.id;
    const seconds =
      typeof data.seconds === "number" ? Math.max(0, Math.floor(data.seconds)) : 0;
    daySeconds.set(date, seconds);
  }

  const days: DayProgress[] = [];
  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    const seconds = daySeconds.get(date) ?? 0;
    days.push({
      date,
      seconds,
      minutes: Math.floor(seconds / 60),
      goalHit: seconds >= dailyGoalMinutes * 60,
    });
  }

  const practicedDays = days.filter((day) => day.seconds > 0).length;
  const goalHitDays = days.filter((day) => day.goalHit).length;

  return {
    userId,
    year,
    month,
    dailyGoalMinutes,
    days,
    practicedDays,
    goalHitDays,
    currentStreak: computeStreak(daySeconds),
  };
}

function conversationRef(userId: string, date = localDateKey()) {
  return userRef(userId).collection("conversations").doc(date);
}

export async function getTodayConversation(userId: string): Promise<ConversationSnapshot> {
  const date = localDateKey();
  const snap = await conversationRef(userId, date).get();
  const raw = snap.data()?.messages;
  const messages: StoredChatMessage[] = Array.isArray(raw)
    ? raw
        .filter(
          (item): item is StoredChatMessage =>
            !!item &&
            typeof item === "object" &&
            typeof item.id === "string" &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string",
        )
        .map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
          speakerName:
            typeof item.speakerName === "string" ? item.speakerName : undefined,
        }))
        .slice(-100)
    : [];

  return { userId, date, messages };
}

export async function saveTodayConversation(
  userId: string,
  messages: StoredChatMessage[],
): Promise<ConversationSnapshot> {
  const date = localDateKey();
  const clipped = messages.slice(-100).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content.slice(0, 4000),
    ...(message.speakerName ? { speakerName: message.speakerName } : {}),
  }));

  await conversationRef(userId, date).set(
    {
      date,
      messages: clipped,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { userId, date, messages: clipped };
}

export async function clearTodayConversation(userId: string): Promise<ConversationSnapshot> {
  const date = localDateKey();
  await conversationRef(userId, date).set(
    {
      date,
      messages: [],
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return { userId, date, messages: [] };
}

export type UserProfileInput = {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  providerIds?: string[];
};

export type UserProfileSnapshot = {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerIds: string[];
};

/**
 * Upsert identifiable profile fields on users/{uid} so Firestore console
 * rows are readable (email / name), not just opaque UIDs.
 */
export async function upsertUserProfile(
  userId: string,
  profile: UserProfileInput,
): Promise<UserProfileSnapshot> {
  const email = typeof profile.email === "string" && profile.email.trim()
    ? profile.email.trim().slice(0, 320)
    : null;
  const displayName =
    typeof profile.displayName === "string" && profile.displayName.trim()
      ? profile.displayName.trim().slice(0, 120)
      : null;
  const photoURL =
    typeof profile.photoURL === "string" && profile.photoURL.trim()
      ? profile.photoURL.trim().slice(0, 500)
      : null;
  const providerIds = Array.isArray(profile.providerIds)
    ? profile.providerIds.filter((id) => typeof id === "string").slice(0, 8)
    : [];

  await userRef(userId).set(
    {
      email,
      displayName,
      photoURL,
      providerIds,
      updatedAt: FieldValue.serverTimestamp(),
      lastSignInAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { userId, email, displayName, photoURL, providerIds };
}

export type MigrateResult = {
  fromUserId: string;
  toUserId: string;
  migratedDays: number;
  migratedConversations: number;
  skipped: boolean;
};

/**
 * Copy anonymous guest progress + conversations onto a signed-in Firebase UID.
 * Merges practice seconds per day; keeps the longer conversation transcript.
 */
export async function migrateAnonymousData(
  fromUserId: string,
  toUserId: string,
): Promise<MigrateResult> {
  if (fromUserId === toUserId) {
    return {
      fromUserId,
      toUserId,
      migratedDays: 0,
      migratedConversations: 0,
      skipped: true,
    };
  }

  const fromUser = userRef(fromUserId);
  const toUser = userRef(toUserId);

  const [fromSnap, toSnap, fromDays, fromConvos] = await Promise.all([
    fromUser.get(),
    toUser.get(),
    fromUser.collection("dailyProgress").get(),
    fromUser.collection("conversations").get(),
  ]);

  const batchWrites: Array<() => Promise<unknown>> = [];
  let migratedDays = 0;
  let migratedConversations = 0;

  // Prefer an existing goal on the signed-in account; otherwise take the guest's.
  const toGoal = toSnap.data()?.dailyGoalMinutes;
  const fromGoal = fromSnap.data()?.dailyGoalMinutes;
  if (typeof toGoal !== "number" && typeof fromGoal === "number") {
    batchWrites.push(() =>
      toUser.set(
        {
          dailyGoalMinutes: fromGoal,
          updatedAt: FieldValue.serverTimestamp(),
          migratedFrom: fromUserId,
        },
        { merge: true },
      ),
    );
  } else {
    batchWrites.push(() =>
      toUser.set(
        {
          updatedAt: FieldValue.serverTimestamp(),
          migratedFrom: fromUserId,
        },
        { merge: true },
      ),
    );
  }

  for (const doc of fromDays.docs) {
    const data = doc.data();
    const date = typeof data.date === "string" ? data.date : doc.id;
    const fromSeconds =
      typeof data.seconds === "number" ? Math.max(0, Math.floor(data.seconds)) : 0;
    if (fromSeconds <= 0) continue;

    const target = dayRef(toUserId, date);
    const targetSnap = await target.get();
    const toSeconds =
      typeof targetSnap.data()?.seconds === "number"
        ? Math.max(0, Math.floor(targetSnap.data()?.seconds as number))
        : 0;
    const merged = toSeconds + fromSeconds;
    batchWrites.push(() =>
      target.set(
        {
          date,
          seconds: merged,
          updatedAt: FieldValue.serverTimestamp(),
          migratedFrom: fromUserId,
        },
        { merge: true },
      ),
    );
    migratedDays += 1;
  }

  for (const doc of fromConvos.docs) {
    const data = doc.data();
    const date = typeof data.date === "string" ? data.date : doc.id;
    const fromMessages = Array.isArray(data.messages) ? data.messages : [];
    if (fromMessages.length === 0) continue;

    const target = conversationRef(toUserId, date);
    const targetSnap = await target.get();
    const toMessages = Array.isArray(targetSnap.data()?.messages)
      ? (targetSnap.data()?.messages as unknown[])
      : [];

    // Keep whichever thread is longer so we don't wipe a signed-in chat.
    const messages = toMessages.length >= fromMessages.length ? toMessages : fromMessages;
    batchWrites.push(() =>
      target.set(
        {
          date,
          messages: messages.slice(-100),
          updatedAt: FieldValue.serverTimestamp(),
          migratedFrom: fromUserId,
        },
        { merge: true },
      ),
    );
    migratedConversations += 1;
  }

  // Run writes in chunks to avoid bursting too many parallel commits.
  const chunkSize = 40;
  for (let i = 0; i < batchWrites.length; i += chunkSize) {
    const chunk = batchWrites.slice(i, i + chunkSize);
    await Promise.all(chunk.map((write) => write()));
  }

  return {
    fromUserId,
    toUserId,
    migratedDays,
    migratedConversations,
    skipped: false,
  };
}
