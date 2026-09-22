"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type AuthControlsProps = {
  /** Light controls for dark hero backgrounds */
  tone?: "default" | "onDark";
};

function signInHref(pathname: string): string {
  if (pathname === "/" || pathname === "/signin") {
    return "/signin?next=%2Fpractice";
  }
  return `/signin?next=${encodeURIComponent(pathname)}`;
}

export function AuthControls({ tone = "default" }: AuthControlsProps) {
  const { configured, ready, user, migrating, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const triggerClass =
    tone === "onDark"
      ? "rounded-lg border border-white/40 bg-white/10 px-2.5 py-1.5 text-xs text-white transition hover:border-white/70 hover:bg-white/15"
      : "rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]";

  const handleSignOut = async () => {
    await signOut();
    if (pathname !== "/") {
      router.push("/");
    }
  };

  if (!configured) {
    return (
      <span
        className={
          tone === "onDark"
            ? "rounded-lg border border-white/35 px-2.5 py-1.5 text-xs text-white/80"
            : "rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)]"
        }
        title="Add NEXT_PUBLIC_FIREBASE_* env vars to enable sign-in"
      >
        Guest
      </span>
    );
  }

  if (!ready) {
    return (
      <span
        className={
          tone === "onDark"
            ? "rounded-lg border border-white/35 px-2.5 py-1.5 text-xs text-white/80"
            : "rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)]"
        }
      >
        …
      </span>
    );
  }

  if (user) {
    const label = user.displayName?.split(" ")[0] || user.email || "Signed in";
    return (
      <div className="flex items-center gap-2">
        {migrating ? (
          <span
            className={
              tone === "onDark" ? "text-[11px] text-white/75" : "text-[11px] text-[var(--muted)]"
            }
          >
            Syncing…
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={`max-w-[9.5rem] truncate ${triggerClass}`}
          title={user.email ?? "Sign out"}
        >
          {label} · Out
        </button>
      </div>
    );
  }

  return (
    <Link href={signInHref(pathname)} className={triggerClass}>
      Sign in
    </Link>
  );
}
