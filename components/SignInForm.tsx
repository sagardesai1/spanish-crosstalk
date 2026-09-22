"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/practice";
  return raw;
}

export function SignInForm() {
  const {
    configured,
    ready,
    user,
    migrating,
    authError,
    clearAuthError,
    signInGoogle,
    sendLink,
    finishMagicLink,
    needsMagicEmail,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const titleId = useId();

  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    const id = window.setTimeout(() => {
      router.replace(nextPath);
    }, 0);
    return () => window.clearTimeout(id);
  }, [ready, user, nextPath, router]);

  if (!configured) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Sign-in isn’t configured yet. Add the Firebase web keys to your environment.
      </p>
    );
  }

  if (!ready || user || migrating) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {migrating ? "Syncing your account…" : user ? "Taking you to practice…" : "Loading…"}
      </p>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1
        id={titleId}
        className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
      >
        Sign in to practice
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
        Google or a magic link — your streak, daily goal, and chat stay on your account.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          clearAuthError();
          setBusy(true);
          void signInGoogle()
            .catch(() => undefined)
            .finally(() => setBusy(false));
        }}
        className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--level-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-50"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--level-border)]" />
        or email link
        <span className="h-px flex-1 bg-[var(--level-border)]" />
      </div>

      <label className="mb-2 block text-sm text-[var(--muted)]" htmlFor="signin-email">
        Email
      </label>
      <input
        id="signin-email"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="mb-3 w-full rounded-xl border border-[var(--level-border)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
      />

      {needsMagicEmail ? (
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => {
            clearAuthError();
            setBusy(true);
            void finishMagicLink(email)
              .catch(() => undefined)
              .finally(() => setBusy(false));
          }}
          className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          Finish magic link sign-in
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => {
            clearAuthError();
            setBusy(true);
            void sendLink(email)
              .then(() => setLinkSent(true))
              .catch(() => undefined)
              .finally(() => setBusy(false));
          }}
          className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          {linkSent ? "Link sent — check your email" : "Email me a magic link"}
        </button>
      )}

      {linkSent ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Open the link on this device to finish signing in.
        </p>
      ) : null}

      {authError ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--danger)]">{authError}</p>
      ) : null}

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/" className="underline-offset-2 hover:underline">
          Back to Spanish Crosstalk
        </Link>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
