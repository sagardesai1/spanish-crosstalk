import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import { upsertUserProfile } from "@/lib/firestore";

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
  return "Couldn't save your profile. Please try again.";
}

/**
 * Persist the signed-in user's name/email onto users/{uid} for admin readability.
 * Profile fields come from the verified ID token (not client-supplied body).
 */
export async function POST(request: Request) {
  try {
    const resolved = await resolveRequestUser(request);
    if (resolved instanceof NextResponse) return resolved;
    if (!resolved.authenticated || !resolved.token) {
      return NextResponse.json({ error: "Sign in to save your profile." }, { status: 401 });
    }

    const decoded = resolved.token;
    const snapshot = await upsertUserProfile(resolved.userId, {
      email: decoded.email ?? null,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
      photoURL: typeof decoded.picture === "string" ? decoded.picture : null,
      providerIds: decoded.firebase?.sign_in_provider
        ? [String(decoded.firebase.sign_in_provider)]
        : [],
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("POST /api/me", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}
