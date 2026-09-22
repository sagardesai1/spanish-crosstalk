/**
 * Server-side Stripe client. Returns null when billing isn't configured yet.
 */

import Stripe from "stripe";

let stripeClient: Stripe | null | undefined;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return Boolean(
    process.env.STRIPE_PRICE_ID &&
      (key.startsWith("sk_") || key.startsWith("rk_")),
  );
}

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe isn't configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID.");
  }
  if (stripeClient === undefined) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  // stripeClient is set above; keep a narrow cast for the undefined sentinel.
  return stripeClient as Stripe;
}

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID is not configured");
  }
  return priceId;
}

export function getAppBaseUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://127.0.0.1:43123";
}

/** Minutes of free daily practice without an active subscription. */
export function getFreeDailyMinutes(): number {
  const raw = Number(process.env.FREE_DAILY_MINUTES ?? "15");
  if (!Number.isFinite(raw) || raw < 0) return 15;
  return Math.min(120, Math.floor(raw));
}
