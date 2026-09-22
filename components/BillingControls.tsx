"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchBillingStatus,
  openBillingPortal,
  startCheckout,
  type BillingSnapshot,
} from "@/lib/billingClient";

type BillingControlsProps = {
  compact?: boolean;
};

export function BillingControls({ compact = false }: BillingControlsProps) {
  const { ready, user, userId } = useAuth();
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !userId) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      void fetchBillingStatus(userId)
        .then((status) => {
          if (!cancelled) setBilling(status);
        })
        .catch((err: unknown) => {
          console.error(err);
          if (!cancelled) setBilling(null);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [ready, userId, user?.uid]);

  if (!billing?.configured) {
    return null;
  }

  const handleUpgrade = async () => {
    setError(null);
    if (!user) {
      setError("Sign in first, then subscribe.");
      return;
    }
    setBusy(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Checkout.");
      setBusy(false);
    }
  };

  const handlePortal = async () => {
    setError(null);
    if (!user) {
      setError("Sign in to manage billing.");
      return;
    }
    setBusy(true);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open billing portal.");
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        {billing.subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePortal()}
            className="rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            Manage billing
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleUpgrade()}
            className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-95 disabled:opacity-50"
          >
            Upgrade
          </button>
        )}
        {error ? <p className="max-w-[12rem] text-right text-[11px] text-[var(--danger)]">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-3.5 py-3 text-sm">
      {billing.subscribed ? (
        <>
          <p className="font-medium text-[var(--foreground)]">Pro active</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Unlimited daily practice
            {billing.currentPeriodEnd
              ? ` · renews ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
              : ""}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePortal()}
            className="mt-3 rounded-lg border border-[var(--level-border)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            Manage billing
          </button>
        </>
      ) : (
        <>
          <p className="font-medium text-[var(--foreground)]">Free plan</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {Math.floor(billing.freeSecondsRemaining / 60)} / {billing.freeDailyMinutes} free
            minutes left today
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleUpgrade()}
            className="mt-3 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-95 disabled:opacity-50"
          >
            Upgrade to Pro
          </button>
        </>
      )}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
