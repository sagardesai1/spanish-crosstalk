import { NextResponse } from "next/server";
import { resolveRequestUser } from "@/lib/authServer";
import { getBillingSnapshot, setStripeCustomerId } from "@/lib/billing";
import {
  getAppBaseUrl,
  getStripe,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe";

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
    if (!resolved.authenticated || !resolved.token) {
      return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
    }

    const billing = await getBillingSnapshot(resolved.userId);
    if (billing.subscribed) {
      return NextResponse.json(
        { error: "You're already subscribed. Use Manage billing to change your plan." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const priceId = getStripePriceId();
    const baseUrl = getAppBaseUrl(request);
    const email = resolved.token.email ?? undefined;

    let customerId = billing.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: typeof resolved.token.name === "string" ? resolved.token.name : undefined,
        metadata: { firebaseUid: resolved.userId },
      });
      customerId = customer.id;
      await setStripeCustomerId(resolved.userId, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/practice?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=canceled#pricing`,
      client_reference_id: resolved.userId,
      metadata: { firebaseUid: resolved.userId },
      subscription_data: {
        metadata: { firebaseUid: resolved.userId },
      },
      allow_promotion_codes: true,
      // Dashboard tracking label for this Checkout flow (API 2026-03-25+)
      integration_identifier: `crosstalk_pro_${Math.random().toString(36).slice(2, 10)}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Couldn't start Checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("POST /api/billing/checkout", error);
    const message = error instanceof Error ? error.message : "Couldn't start Checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
