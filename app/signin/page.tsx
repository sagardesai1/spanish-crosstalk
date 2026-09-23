import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Spanish Crosstalk to start practicing with Mateo.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignInPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(232, 238, 242, 0.96) 0%, rgba(232, 238, 242, 0.88) 42%, rgba(12, 28, 36, 0.45) 100%)",
          }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-10 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--partner)] sm:text-xl"
          >
            Spanish Crosstalk
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-12 sm:py-16">
          <div className="land-fade-up w-full max-w-md rounded-2xl border border-[var(--panel-border)] bg-white/90 p-6 shadow-[0_20px_50px_rgba(21,35,45,0.08)] backdrop-blur-sm sm:p-8">
            <Suspense
              fallback={<p className="text-sm text-[var(--muted)]">Loading sign-in…</p>}
            >
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
