import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/stt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please send an audio recording." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The recording was empty. Try again." },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    const mimeType = file.type || "audio/webm";

    const text = await transcribeAudio(audio, {
      mimeType,
      filename: file.name || undefined,
      language: "en",
    });

    if (!text) {
      return NextResponse.json(
        { error: "I couldn't hear anything. Please try speaking again." },
        { status: 422 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("POST /api/transcribe", error);
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "Speech recognition isn't set up yet. Add STT_API_KEY to your environment."
        : "Couldn't transcribe that recording. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
