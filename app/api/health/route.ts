import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    webhookSecretConfigured: Boolean(
      process.env.STRIPE_WEBHOOK_SECRET &&
        !process.env.STRIPE_WEBHOOK_SECRET.includes("REPLACE"),
    ),
    gcpConfigured: Boolean(
      process.env.GOOGLE_CLOUD_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS,
    ),
  });
}
