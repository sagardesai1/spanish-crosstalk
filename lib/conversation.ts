/**
 * Client helpers for today's persisted Crosstalk conversation.
 */

import { getIdToken } from "@/lib/authClient";
import type { StoredChatMessage } from "@/lib/types";

export type ConversationResponse = {
  userId: string;
  date: string;
  messages: StoredChatMessage[];
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTodayConversation(userId: string): Promise<ConversationResponse> {
  const headers = await authHeaders();
  const res = await fetch(`/api/conversation?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as ConversationResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't load conversation");
  }
  return json;
}

export async function saveTodayConversationClient(
  userId: string,
  messages: StoredChatMessage[],
): Promise<ConversationResponse> {
  const headers = await authHeaders();
  const res = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ userId, messages }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as ConversationResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't save conversation");
  }
  return json;
}

export async function clearTodayConversationClient(
  userId: string,
): Promise<ConversationResponse> {
  const headers = await authHeaders();
  const res = await fetch("/api/conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ userId, clear: true }),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as ConversationResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't clear conversation");
  }
  return json;
}
