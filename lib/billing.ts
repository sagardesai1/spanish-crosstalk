/**
 * Billing state helpers (Firestore + entitlements).
 */

import { FieldValue } from "firebase-admin/firestore";
import type { BillingSnapshot, SubscriptionStatus } from "@/lib/billingTypes";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getProgressSnapshot } from "@/lib/firestore";
import { getFreeDailyMinutes, isStripeConfigured } from "@/lib/stripe";

export type { BillingSnapshot, SubscriptionStatus };

function userRef(userId: string) {
  return getAdminFirestore().collection("users").doc(userId);
}

function isSubscribedStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export async function getBillingSnapshot(userId: string): Promise<BillingSnapshot> {
  const [userSnap, progress] = await Promise.all([
    userRef(userId).get(),
    getProgressSnapshot(userId),
  ]);
  const data = userSnap.data() ?? {};
  const status = (
    typeof data.subscriptionStatus === "string" ? data.subscriptionStatus : "none"
  ) as SubscriptionStatus;
  const subscribed = isSubscribedStatus(status);
  const freeDailyMinutes = getFreeDailyMinutes();
  const freeCapSeconds = freeDailyMinutes * 60;
  const freeSecondsRemaining = subscribed
    ? freeCapSeconds
    : Math.max(0, freeCapSeconds - progress.secondsToday);

  return {
    userId,
    configured: isStripeConfigured(),
    subscribed,
    status,
    stripeCustomerId:
      typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : null,
    stripeSubscriptionId:
      typeof data.stripeSubscriptionId === "string" ? data.stripeSubscriptionId : null,
    stripePriceId: typeof data.stripePriceId === "string" ? data.stripePriceId : null,
    currentPeriodEnd:
      typeof data.subscriptionCurrentPeriodEnd === "string"
        ? data.subscriptionCurrentPeriodEnd
        : null,
    freeDailyMinutes,
    secondsToday: progress.secondsToday,
    freeSecondsRemaining: subscribed ? freeCapSeconds : freeSecondsRemaining,
    canPractice: subscribed || freeSecondsRemaining > 0 || !isStripeConfigured(),
  };
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await userRef(userId).set(
    {
      stripeCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function applySubscriptionUpdate(input: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId: string;
  status: string;
  priceId?: string | null;
  currentPeriodEnd?: number | null;
}): Promise<void> {
  let userId = input.userId ?? null;

  if (!userId && input.customerId) {
    const snap = await getAdminFirestore()
      .collection("users")
      .where("stripeCustomerId", "==", input.customerId)
      .limit(1)
      .get();
    userId = snap.docs[0]?.id ?? null;
  }

  if (!userId) {
    console.warn("applySubscriptionUpdate: no user for", input.subscriptionId);
    return;
  }

  const periodEnd =
    typeof input.currentPeriodEnd === "number"
      ? new Date(input.currentPeriodEnd * 1000).toISOString()
      : null;

  await userRef(userId).set(
    {
      ...(input.customerId ? { stripeCustomerId: input.customerId } : {}),
      stripeSubscriptionId: input.subscriptionId,
      subscriptionStatus: input.status,
      stripePriceId: input.priceId ?? null,
      subscriptionCurrentPeriodEnd: periodEnd,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearSubscriptionForCustomer(customerId: string): Promise<void> {
  const snap = await getAdminFirestore()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return;
  await doc.ref.set(
    {
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      subscriptionCurrentPeriodEnd: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Enforce free daily cap for non-subscribers when crediting practice time.
 */
export async function assertCanAddPracticeSeconds(
  userId: string,
  addSeconds: number,
): Promise<
  | { allowed: true; billing: BillingSnapshot }
  | { allowed: false; billing: BillingSnapshot; error: string }
> {
  const billing = await getBillingSnapshot(userId);
  // If Stripe isn't configured yet, don't block local development.
  if (!billing.configured || billing.subscribed || addSeconds <= 0) {
    return { allowed: true, billing };
  }
  if (billing.freeSecondsRemaining <= 0) {
    return {
      allowed: false,
      billing,
      error: `You've used today's free ${billing.freeDailyMinutes} minutes. Subscribe to keep practicing.`,
    };
  }
  return { allowed: true, billing };
}
