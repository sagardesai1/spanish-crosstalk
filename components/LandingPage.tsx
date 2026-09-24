"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/components/AuthControls";
import { useAuth } from "@/components/AuthProvider";

function practiceHref(signedIn: boolean, path = "/practice"): string {
  if (signedIn) return path;
  return `/signin?next=${encodeURIComponent(path)}`;
}

const freeMinutes = process.env.NEXT_PUBLIC_FREE_DAILY_MINUTES ?? "15";
const priceLabel = process.env.NEXT_PUBLIC_STRIPE_PRICE_LABEL ?? "$15";

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
              Speak English. Hear real Spanish back.
            </p>
            <p className="land-fade-up land-fade-up-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Daily comprehensible conversation with Mateo — Spanish-only practice for beginners who
              want input first, not another drill app.
            </p>
            <div className="land-fade-up land-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={practiceHref(signedIn)}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--partner)] transition hover:bg-white/95"
              >
                {signedIn ? "Continue practicing" : "Start free — no card needed"}
              </Link>
              <a
                href="#why"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-3 text-sm font-medium text-white transition hover:border-white/70"
              >
                Why this works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="why"
        className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-24"
        aria-labelledby="why-heading"
      >
        <h2
          id="why-heading"
          className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
        >
          Spanish the way you actually acquire it
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Dreaming Spanish proved bingeable comprehensible input works. Spanish Crosstalk applies
          that idea to live conversation: you stay comfortable in English while Mateo floods you
          with Spanish you can follow.
        </p>
        <ul className="mt-10 space-y-6 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          <li>
            <span className="font-medium text-[var(--foreground)]">Spanish only.</span> No
            forty-language distraction. Every session is built for English speakers learning Spanish.
          </li>
          <li>
            <span className="font-medium text-[var(--foreground)]">Input before pressure.</span> You
            don’t have to produce perfect Spanish on day one. You listen, understand, and build the
            ear first.
          </li>
          <li>
            <span className="font-medium text-[var(--foreground)]">Voice, not homework.</span> Open
            the mic, talk about your day, and get Spanish back aloud — with Translate when a phrase
            slips past you.
          </li>
        </ul>
      </section>

      <section
        id="how-it-works"
        className="border-t border-[var(--panel-border)] bg-[var(--panel)]/50"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-24">
          <h2
            id="how-heading"
            className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
          >
            How a session works
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Three minutes or thirty — the loop stays the same.
          </p>

          <ol className="mt-12 space-y-10">
            <li>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                01 — Speak English
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
                Say what’s on your mind
              </h3>
              <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
                Continuous listening sends your turn after a short pause, so it feels like a real
                chat — not a push-to-talk quiz.
              </p>
            </li>
            <li>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                02 — Hear Spanish
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
                Mateo replies in clear beginner Spanish
              </h3>
              <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
                A Valencia partner answers aloud in A1–A2 Spanish. Tap Translate anytime you need the
                English meaning, then keep going.
              </p>
            </li>
            <li>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                03 — Come back tomorrow
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
                Daily minutes that actually stick
              </h3>
              <p className="mt-2 max-w-xl text-[var(--muted)] leading-relaxed">
                Your chat, streak, and goal save to your account so practice compounds instead of
                resetting every refresh.
              </p>
            </li>
          </ol>

          <div className="mt-14">
            <Link
              href={practiceHref(signedIn)}
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {signedIn ? "Open practice" : `Try ${freeMinutes} free minutes`}
            </Link>
          </div>
        </div>
      </section>

      <section
        id="for-who"
        className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-24"
        aria-labelledby="for-who-heading"
      >
        <h2
          id="for-who-heading"
          className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl"
        >
          Built for beginners who bounced off drill apps
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          If you’ve watched CI videos and still freeze in conversation — or you hate being forced to
          speak Spanish before you can understand it — this is for you.
        </p>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Travelers, partners of Spanish speakers, and A1–A2 learners who want a low-pressure daily
          voice habit without a classroom or flashcard streak.
        </p>
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
            Start free. Go Pro when you want unlimited time.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Enough free minutes to build the habit. Upgrade when conversations start running long.
          </p>

          <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Free
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
                {freeMinutes} min / day
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Full voice Crosstalk with Mateo, saved chat, and daily progress — no credit card.
              </p>
              <Link
                href={practiceHref(signedIn)}
                className="mt-6 inline-flex rounded-full border border-[var(--level-border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]"
              >
                {signedIn ? "Keep practicing" : "Sign in free"}
              </Link>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Pro
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
                {priceLabel}
                <span className="ml-1 text-base font-sans font-normal text-[var(--muted)]">
                  / month
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Unlimited daily minutes so you can stay in Spanish as long as the conversation is
                working.
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

      <section className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl">
          Ready to hear Spanish today?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Sign in, start a session, and let Mateo open in Spanish. Your first conversation takes
          under a minute to begin.
        </p>
        <Link
          href={practiceHref(signedIn)}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {signedIn ? "Continue with Mateo" : "Start free practice"}
        </Link>
      </section>

      <footer className="border-t border-[var(--panel-border)] px-5 py-8 text-center text-xs text-[var(--muted)] sm:px-8">
        <p>Spanish Crosstalk — comprehensible Spanish through daily conversation.</p>
        <p className="mt-2">
          <a href="#how-it-works" className="underline-offset-2 hover:underline">
            How it works
          </a>
          {" · "}
          <a href="#pricing" className="underline-offset-2 hover:underline">
            Pricing
          </a>
          {" · "}
          <Link href={practiceHref(signedIn)} className="underline-offset-2 hover:underline">
            Practice
          </Link>
        </p>
      </footer>
    </main>
  );
}
