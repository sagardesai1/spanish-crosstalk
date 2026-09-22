import { NextResponse } from "next/server";
import { parseSettingsFromRequest } from "@/lib/settings";
import { generateSpeech } from "@/lib/tts";

export const runtime = "nodejs";
export const maxDuration = 60;

type SpeechRequestBody = {
  text?: string;
  settings?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SpeechRequestBody;
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Nothing to speak." },
        { status: 400 },
      );
    }

    const settings = parseSettingsFromRequest(body.settings);
    const clipped = text.slice(0, 800);
    const { audio, mimeType } = await generateSpeech(clipped, { settings });

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("POST /api/speech", error);
    const message =
      error instanceof Error &&
      (error.message.includes("not configured") ||
        error.message.includes("GOOGLE_APPLICATION_CREDENTIALS"))
        ? "Speech isn't set up yet. Add Google Cloud TTS credentials to your environment."
        : "Couldn't generate speech just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
