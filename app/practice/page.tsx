import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Start a Crosstalk Spanish conversation with Mateo. Speak English, hear Spanish, track your daily practice.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function PracticePage() {
  return (
    <div className="h-dvh overflow-hidden">
      <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--muted)]">Loading…</div>}>
        <RequireAuth>
          <AppShell />
        </RequireAuth>
      </Suspense>
    </div>
  );
}
