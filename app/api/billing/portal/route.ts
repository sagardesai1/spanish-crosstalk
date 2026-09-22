import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import { getBillingSnapshot } from "@/lib/billing";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Billing isn't configured yet. Add Stripe keys to the environment." },
        { status: 503 },
      );
    }

    const resolved = await resolveRequestUser(request);
    if (resolved instanceof NextResponse) return resolved;
    if (!resolved.authenticated) {
      return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
    }

    const billing = await getBillingSnapshot(resolved.userId);
    if (!billing.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account yet. Subscribe first." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const baseUrl = getAppBaseUrl(request);
    const session = await stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: `${baseUrl}/practice`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/billing/portal", error);
    const message = error instanceof Error ? error.message : "Couldn't open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
