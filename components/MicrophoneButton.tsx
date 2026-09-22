"use client";

type MicrophoneButtonProps = {
  isListening: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function MicrophoneButton({
  isListening,
  disabled,
  onClick,
}: MicrophoneButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? "Stop recording" : "Start recording"}
      className={[
        "relative flex h-24 w-24 items-center justify-center rounded-full transition-transform duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:scale-[1.03] active:scale-[0.97]",
        isListening
          ? "bg-[var(--accent)] text-white shadow-[0_0_0_10px_rgba(15,110,124,0.16)]"
          : "bg-[var(--mic-bg)] text-[var(--foreground)] shadow-[0_12px_40px_rgba(28,42,36,0.12)]",
      ].join(" ")}
    >
      {isListening ? (
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)] opacity-20" />
      ) : null}
      <MicIcon listening={isListening} />
    </button>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  if (listening) {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="7" y="7" width="10" height="10" rx="2" />
      </svg>
    );
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
