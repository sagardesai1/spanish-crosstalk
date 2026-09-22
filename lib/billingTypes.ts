/**
 * Shared billing types (safe for client + server).
 */

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export type BillingSnapshot = {
  userId: string;
  configured: boolean;
  subscribed: boolean;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  freeDailyMinutes: number;
  secondsToday: number;
  freeSecondsRemaining: number;
  canPractice: boolean;
};
