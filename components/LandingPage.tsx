"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/components/AuthControls";
import { useAuth } from "@/components/AuthProvider";

function practiceHref(signedIn: boolean, path = "/practice"): string {
  if (signedIn) return path;
  return `/signin?next=${encodeURIComponent(path)}`;
}

export function LandingPage() {
  const { ready, user } = useAuth();
  const signedIn = ready && !!user;

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative min-h-dvh overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?auto=format&fit=crop&w=2400&q=80"
            alt="Plaza de la Virgen in Valencia, Spain"
            fill
            priority
            sizes="100vw"
            className="land-image-in object-cover object-[center_40%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12, 28, 36, 0.28) 0%, rgba(12, 28, 36, 0.18) 38%, rgba(12, 28, 36, 0.72) 100%)",
            }}
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex min-h-dvh flex-col">
          <header className="flex items-center justify-end gap-3 px-5 py-5 sm:px-10 sm:py-6">
            <AuthControls tone="onDark" />
          </header>

          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end px-5 pb-14 pt-10 sm:px-10 sm:pb-16">
            <h1 className="land-fade-up font-[family-name:var(--font-display)] text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.95] tracking-tight text-white">
              Spanish Crosstalk
            </h1>
            <p className="land-fade-up land-fade-up-delay-1 mt-5 max-w-xl font-[family-name:var(--font-display)] text-[clamp(1.35rem,3.4vw,2rem)] leading-snug text-white/95">
              Speak English. Hear Spanish. Get fluent by talking.
            </p>
            <p className="land-fade-up land-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Daily conversation with Mateo in Valencia — you talk naturally, he replies in simple
              Spanish you can actually follow.
            </p>
            <div className="land-fade-up land-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={practiceHref(signedIn)}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--partner)] transition hover:bg-white/95"
              >
                {signedIn ? "Continue practicing" : "Sign in to practice free"}
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-medium text-white transition hover:border-white/70"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-24"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
        >
          How Crosstalk practice works
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          No vocabulary lists. No grammar drills. Just a short daily conversation that builds real
          Spanish listening and speaking confidence.
        </p>

        <ol className="mt-12 space-y-10">
          <li>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              01 — Speak
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
              Talk in English about your day
            </h3>
            <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
              Keep the mic open and speak naturally. Continuous mode sends your turn after a short
              pause — like a real chat.
            </p>
          </li>
          <li>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              02 — Hear
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
              Mateo answers in simple Spanish
            </h3>
            <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
              Your partner replies aloud in clear A1–A2 Spanish, tuned to Spain or Latin America
              and the pace you choose.
            </p>
          </li>
          <li>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              03 — Return
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
              Show up for a few minutes a day
            </h3>
            <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
              Progress saves to your account — streak, daily goal, and today’s chat — so practice
              compounds instead of resetting.
            </p>
          </li>
        </ol>

        <div className="mt-14">
          <Link
            href={practiceHref(signedIn)}
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {signedIn ? "Open practice" : "Sign in to start"}
          </Link>
        </div>
      </section>

      <section
        id="pricing"
        className="border-t border-[var(--panel-border)] bg-[var(--panel)]/60"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2
            id="pricing-heading"
            className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
          >
            Simple pricing
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Try Crosstalk free every day. Upgrade when you want unlimited practice minutes.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Free
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
                {process.env.NEXT_PUBLIC_FREE_DAILY_MINUTES ?? "15"} min / day
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Full conversation practice with Mateo — enough to build the habit.
              </p>
              <Link
                href={practiceHref(signedIn)}
                className="mt-6 inline-flex rounded-full border border-[var(--level-border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
              >
                {signedIn ? "Start free" : "Sign in free"}
              </Link>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Pro
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
                {process.env.NEXT_PUBLIC_STRIPE_PRICE_LABEL ?? "$15"}
                <span className="ml-1 text-base font-sans font-normal text-[var(--muted)]">
                  / month
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Unlimited daily minutes, progress sync, and priority for new speaking features.
              </p>
              <Link
                href={practiceHref(signedIn, "/practice?upgrade=1")}
                className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Go Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--panel-border)] px-5 py-8 text-center text-xs text-[var(--muted)] sm:px-8">
        <p>Spanish Crosstalk — practice Spanish through conversation.</p>
        <p className="mt-2">
          Photo: Plaza de la Virgen, Valencia.{" "}
          <Link href={practiceHref(signedIn)} className="underline-offset-2 hover:underline">
            Open practice
          </Link>
        </p>
      </footer>
    </main>
  );
}
