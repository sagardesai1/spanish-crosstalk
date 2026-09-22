import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import {
  clearTodayConversation,
  getTodayConversation,
  saveTodayConversation,
} from "@/lib/firestore";
import type { StoredChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

function friendlyDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
    message.includes("GOOGLE_CLOUD_PROJECT_ID") ||
    message.includes("not configured")
  ) {
    return "Firestore isn't set up yet. Add Google Cloud credentials to your environment.";
  }
  if (message.toLowerCase().includes("not found") || message.includes("5 NOT_FOUND")) {
    return "Create a Firestore database in your Firebase/GCP project, then try again.";
  }
  return "Couldn't reach conversation storage. Please try again.";
}

function isValidMessages(raw: unknown): raw is StoredChatMessage[] {
  if (!Array.isArray(raw) || raw.length > 100) return false;
  return raw.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string" &&
      (item.speakerName === undefined || typeof item.speakerName === "string"),
  );
}

export async function GET(request: Request) {
  try {
    const userIdParam = new URL(request.url).searchParams.get("userId");
    const resolved = await resolveRequestUser(request, userIdParam);
    if (resolved instanceof NextResponse) return resolved;

    const snapshot = await getTodayConversation(resolved.userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/conversation", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}

type ConversationBody = {
  userId?: string;
  messages?: StoredChatMessage[];
  clear?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConversationBody;
    const resolved = await resolveRequestUser(request, body.userId);
    if (resolved instanceof NextResponse) return resolved;
    const { userId } = resolved;

    if (body.clear) {
      const snapshot = await clearTodayConversation(userId);
      return NextResponse.json(snapshot);
    }

    if (!isValidMessages(body.messages)) {
      return NextResponse.json({ error: "Invalid conversation messages." }, { status: 400 });
    }

    const snapshot = await saveTodayConversation(userId, body.messages);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("POST /api/conversation", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}
