"use client";

import type { AppStatus } from "@/lib/types";

type StatusIndicatorProps = {
  status: AppStatus;
  errorMessage?: string | null;
  partnerName?: string;
};

export function StatusIndicator({
  status,
  errorMessage,
  partnerName = "Mateo",
}: StatusIndicatorProps) {
  const labels: Record<AppStatus, string> = {
    ready: "Ready",
    connecting: "Connecting mic…",
    listening: "Listening…",
    transcribing: "Transcribing…",
    thinking: `${partnerName} is thinking…`,
    speaking: `${partnerName} is speaking…`,
    error: "Something went wrong",
  };

  const isBusy = status !== "ready" && status !== "error";

  return (
    <div className="flex flex-col items-center gap-1 text-center" aria-live="polite">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span
          className={[
            "inline-block h-2 w-2 rounded-full",
            status === "listening"
              ? "animate-pulse bg-[var(--accent)]"
              : status === "error"
                ? "bg-[var(--danger)]"
                : isBusy
                  ? "animate-pulse bg-[var(--accent-soft)]"
                  : "bg-[var(--ready)]",
          ].join(" ")}
        />
        <span>{labels[status]}</span>
      </div>
      {status === "error" && errorMessage ? (
        <p className="max-w-md text-sm text-[var(--danger)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
