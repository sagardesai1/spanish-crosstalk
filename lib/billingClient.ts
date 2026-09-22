/**
 * Client helpers for Stripe billing.
 */

import { getIdToken } from "@/lib/authClient";
import type { BillingSnapshot } from "@/lib/billingTypes";

export type { BillingSnapshot };

async function authHeaders(): Promise<HeadersInit> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchBillingStatus(userId: string): Promise<BillingSnapshot> {
  const headers = await authHeaders();
  const res = await fetch(`/api/billing/status?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as BillingSnapshot & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Couldn't load billing status");
  }
  return json;
}

export async function startCheckout(): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: "{}",
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "Couldn't start Checkout");
  }
  return json.url;
}

export async function openBillingPortal(): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: "{}",
    signal: AbortSignal.timeout(30_000),
  });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "Couldn't open billing portal");
  }
  return json.url;
}
