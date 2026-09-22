"use client";

import { useEffect, useState } from "react";

type SessionTimerProps = {
  running: boolean;
  startedAt: number | null;
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SessionTimer({ running, startedAt }: SessionTimerProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running || startedAt == null) return;

    const id = window.setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startedAt));
    }, 1000);

    return () => window.clearInterval(id);
  }, [running, startedAt]);

  const displayMs = startedAt == null ? 0 : elapsedMs;

  return (
    <div
      className="inline-flex items-baseline gap-2 rounded-md border border-[var(--level-border)] px-3 py-1.5"
      aria-live="polite"
      aria-label={`Conversation time ${formatElapsed(displayMs)}`}
    >
      <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        Time
      </span>
      <span className="font-[family-name:var(--font-display)] text-lg tabular-nums text-[var(--foreground)]">
        {formatElapsed(displayMs)}
      </span>
    </div>
  );
}
