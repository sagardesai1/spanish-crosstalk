import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import { assertCanAddPracticeSeconds } from "@/lib/billing";
import {
  addPracticeSeconds,
  getCalendarMonth,
  getProgressSnapshot,
  setDailyGoalMinutes,
} from "@/lib/firestore";
import { DAILY_GOAL_OPTIONS } from "@/lib/settings";

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
  if (message.includes("FAILED_PRECONDITION") || message.toLowerCase().includes("index")) {
    return "Firestore needs an index for calendar queries. Check the server logs for the create-index link.";
  }
  return "Couldn't reach progress storage. Please try again.";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = await resolveRequestUser(request, searchParams.get("userId"));
    if (resolved instanceof NextResponse) return resolved;
    const { userId } = resolved;

    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    if (yearParam || monthParam) {
      const year = Number(yearParam);
      const month = Number(monthParam);
      if (!Number.isInteger(year) || !Number.isInteger(month)) {
        return NextResponse.json({ error: "Invalid year or month." }, { status: 400 });
      }
      const calendar = await getCalendarMonth(userId, year, month);
      return NextResponse.json(calendar);
    }

    const snapshot = await getProgressSnapshot(userId);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/progress", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}

type ProgressBody = {
  userId?: string;
  addSeconds?: number;
  dailyGoalMinutes?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProgressBody;
    const resolved = await resolveRequestUser(request, body.userId);
    if (resolved instanceof NextResponse) return resolved;
    const { userId } = resolved;

    if (typeof body.dailyGoalMinutes === "number") {
      if (!DAILY_GOAL_OPTIONS.includes(body.dailyGoalMinutes as (typeof DAILY_GOAL_OPTIONS)[number])) {
        return NextResponse.json({ error: "Invalid daily goal." }, { status: 400 });
      }
      const snapshot = await setDailyGoalMinutes(userId, body.dailyGoalMinutes);
      return NextResponse.json(snapshot);
    }

    const addSeconds =
      typeof body.addSeconds === "number" && Number.isFinite(body.addSeconds)
        ? Math.max(0, Math.floor(body.addSeconds))
        : 0;

    if (addSeconds <= 0) {
      const snapshot = await getProgressSnapshot(userId);
      return NextResponse.json(snapshot);
    }

    const entitlement = await assertCanAddPracticeSeconds(userId, addSeconds);
    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: entitlement.error,
          code: "free_cap_reached",
          billing: entitlement.billing,
        },
        { status: 402 },
      );
    }

    const remaining = entitlement.billing.subscribed
      ? addSeconds
      : Math.min(addSeconds, entitlement.billing.freeSecondsRemaining);
    const capped = Math.min(remaining, 120);
    if (capped <= 0) {
      return NextResponse.json(
        {
          error: `You've used today's free ${entitlement.billing.freeDailyMinutes} minutes. Subscribe to keep practicing.`,
          code: "free_cap_reached",
          billing: entitlement.billing,
        },
        { status: 402 },
      );
    }

    const snapshot = await addPracticeSeconds(userId, capped);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("POST /api/progress", error);
    return NextResponse.json({ error: friendlyDbError(error) }, { status: 500 });
  }
}
