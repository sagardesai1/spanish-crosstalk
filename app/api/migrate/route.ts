import { NextResponse } from "next/server";
import { resolveRequestUser, isValidUserId } from "@/lib/authServer";
import { migrateAnonymousData } from "@/lib/firestore";

export const runtime = "nodejs";
export const maxDuration = 60;

function friendlyDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
    message.includes("GOOGLE_CLOUD_PROJECT_ID") ||
    message.includes("not configured")
  ) {
    return "Firestore isn't set up yet. Add Google Cloud credentials to your environment.";
  }
  return "Couldn't migrate practice history. Please try again.";
}

type MigrateBody = {
  anonymousUserId?: string;
};

export async function POST(request: Request) {
  try {
    const resolved = await resolveRequestUser(request);
    if (resolved instanceof NextResponse) return resolved;
    if (!resolved.authenticated) {
      return NextResponse.json({ error: "Sign in to migrate progress." }, { status: 401 });
    }

    const body = (await request.json()) as MigrateBody;
    if (!isValidUserId(body.anonymousUserId)) {
      return NextResponse.json({ error: "Missing or invalid anonymous user id." }, { status: 400 });
    }

    const result = await migrateAnonymousData(body.anonymousUserId, resolved.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/migrate", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}
