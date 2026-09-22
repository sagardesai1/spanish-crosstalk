"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/**
 * Blocks the practice app until Firebase Auth reports a signed-in user.
 * Guests are sent to the dedicated sign-in page.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, ready, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ready || !configured || user) return;
    const search = searchParams.toString();
    const next = `${pathname}${search ? `?${search}` : ""}`;
    router.replace(`/signin?next=${encodeURIComponent(next)}`);
  }, [ready, configured, user, router, pathname, searchParams]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)] px-6 text-sm text-[var(--muted)]">
        Checking sign-in…
      </div>
    );
  }

  if (configured && !user) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[var(--background)] px-6 text-sm text-[var(--muted)]">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
