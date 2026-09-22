import { NextResponse } from "next/server";
import { translateToEnglish } from "@/lib/translate";

export const runtime = "nodejs";
export const maxDuration = 30;

type TranslateRequestBody = {
  text?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Nothing to translate." }, { status: 400 });
    }

    const translation = await translateToEnglish(text.slice(0, 1000));
    return NextResponse.json({ translation });
  } catch (error) {
    console.error("POST /api/translate", error);
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? "Translation isn't set up yet. Add LLM_API_KEY to your environment."
        : "Couldn't translate that just now. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
