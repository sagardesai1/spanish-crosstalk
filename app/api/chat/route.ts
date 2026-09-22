import { NextResponse } from "next/server";
import { generateReply } from "@/lib/llm";
import { buildOpeningKickoff, buildSystemPrompt } from "@/lib/prompts";
import { getPartnerForSettings, parseSettingsFromRequest } from "@/lib/settings";
import type { ConversationMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRequestBody = {
  message?: string;
  history?: ConversationMessage[];
  /** When true, the partner opens the conversation (no learner message). */
  start?: boolean;
  settings?: unknown;
};

function isValidHistory(history: unknown): history is ConversationMessage[] {
  if (!Array.isArray(history)) return false;
  return history.every(
    (item) =>
      item &&
      typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string",
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const settings = parseSettingsFromRequest(body.settings);
    const partner = getPartnerForSettings(settings);
    const history = isValidHistory(body.history) ? body.history.slice(-20) : [];
    const systemPrompt = buildSystemPrompt(settings);

    if (body.start) {
      const reply = await generateReply({
        systemPrompt,
        history: [],
        userMessage: buildOpeningKickoff(settings),
      });
      return NextResponse.json({ reply, partnerName: partner.name });
    }

    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Say something first, then try again." },
        { status: 400 },
      );
    }

    const reply = await generateReply({
      systemPrompt,
      history,
      userMessage: message,
    });

    return NextResponse.json({ reply, partnerName: partner.name });
  } catch (error) {
    console.error("POST /api/chat", error);
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "The conversation model isn't set up yet. Add LLM_API_KEY to your environment."
        : "Couldn't get a reply just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
