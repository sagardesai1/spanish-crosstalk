import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import { getBillingSnapshot } from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const userIdParam = new URL(request.url).searchParams.get("userId");
    const resolved = await resolveRequestUser(request, userIdParam);
    if (resolved instanceof NextResponse) return resolved;

    const billing = await getBillingSnapshot(resolved.userId);
    return NextResponse.json({
      ...billing,
      // Guests see configured/pricing info, but subscribed is always false for anon.
      configured: isStripeConfigured(),
    });
  } catch (error) {
    console.error("GET /api/billing/status", error);
    return NextResponse.json({ error: "Couldn't load billing status." }, { status: 500 });
  }
}
