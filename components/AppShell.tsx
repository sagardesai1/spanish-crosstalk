"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthControls } from "@/components/AuthControls";
import { BillingControls } from "@/components/BillingControls";
import { Conversation } from "@/components/Conversation";
import { PracticeCalendar } from "@/components/PracticeCalendar";
import { useAuth } from "@/components/AuthProvider";
import type { AppView } from "@/components/ViewTabs";
import { startCheckout } from "@/lib/billingClient";

export function AppShell() {
  const [view, setView] = useState<AppView>("practice");
  const [banner, setBanner] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ready, user } = useAuth();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const upgrade = searchParams.get("upgrade");

    const id = window.setTimeout(() => {
      if (checkout === "success") {
        setBanner("You're Pro — unlimited practice is unlocked.");
        router.replace("/practice");
        return;
      }
      if (checkout === "canceled") {
        setBanner(null);
        router.replace("/practice");
        return;
      }
      if (upgrade === "1" && ready) {
        router.replace("/practice");
        if (!user) {
          setBanner("Sign in, then tap Upgrade to subscribe.");
          return;
        }
        void startCheckout()
          .then((url) => {
            window.location.href = url;
          })
          .catch((error: unknown) => {
            setBanner(error instanceof Error ? error.message : "Couldn't start Checkout.");
          });
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, [searchParams, ready, user, router]);

  const headerRight = (
    <div className="flex items-center gap-2">
      <BillingControls compact />
      <AuthControls />
    </div>
  );

  return (
    <>
      {banner ? (
        <div className="fixed left-1/2 top-3 z-40 w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl border border-[var(--panel-border)] bg-white px-3.5 py-2.5 text-center text-sm text-[var(--foreground)] shadow-[0_12px_30px_rgba(21,35,45,0.12)]">
          <p>{banner}</p>
          <button
            type="button"
            className="mt-1 text-xs text-[var(--muted)] underline-offset-2 hover:underline"
            onClick={() => setBanner(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {view === "calendar" ? (
        <PracticeCalendar view={view} onViewChange={setView} headerRight={headerRight} />
      ) : (
        <Conversation view={view} onViewChange={setView} headerRight={headerRight} />
      )}
    </>
  );
}
