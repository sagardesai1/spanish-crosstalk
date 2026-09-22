"use client";

import { useState } from "react";

type MessageProps = {
  role: "user" | "assistant";
  content: string;
  speakerName?: string;
};

export function Message({ role, content, speakerName = "Mateo" }: MessageProps) {
  const isUser = role === "user";
  const [translation, setTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation((prev) => !prev);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
        signal: AbortSignal.timeout(30_000),
      });
      const json = (await res.json()) as { translation?: string; error?: string };
      if (!res.ok || !json.translation) {
        setError(json.error ?? "Couldn't translate that.");
        return;
      }
      setTranslation(json.translation);
      setShowTranslation(true);
    } catch {
      setError("Couldn't translate that.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={[
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      <div
        className={[
          "max-w-[85%] px-1 py-2",
          isUser ? "text-right" : "text-left",
        ].join(" ")}
      >
        <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {isUser ? "You" : speakerName}
        </p>
        <p
          className={[
            "text-[1.05rem] leading-relaxed",
            isUser ? "text-[var(--foreground)]" : "text-[var(--partner)]",
          ].join(" ")}
        >
          {content}
        </p>

        {!isUser ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => void handleTranslate()}
              disabled={loading}
              className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline disabled:opacity-50"
            >
              {loading
                ? "Translating…"
                : translation && showTranslation
                  ? "Hide English"
                  : translation
                    ? "Show English"
                    : "Translate"}
            </button>
            {error ? <p className="mt-1 text-xs text-[var(--danger)]">{error}</p> : null}
            {showTranslation && translation ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{translation}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
