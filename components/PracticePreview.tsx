/**
 * Static product preview for the landing page — shows the Crosstalk loop
 * without requiring sign-in or a video.
 */
export function PracticePreview() {
  return (
    <div
      className="land-fade-up mx-auto w-full max-w-lg overflow-hidden rounded-[1.35rem] border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_20px_60px_rgba(28,42,36,0.06)]"
      role="img"
      aria-label="Preview of a Crosstalk session: you speak English, Mateo replies in Spanish"
    >
      <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-4 py-3">
        <p className="font-[family-name:var(--font-display)] text-sm text-[var(--foreground)]">
          Spanish Crosstalk
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">with Mateo</p>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="text-right">
          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">You</p>
          <p className="text-[1.05rem] leading-relaxed text-[var(--foreground)]">
            I went for a walk by the river this morning.
          </p>
        </div>

        <div className="text-left">
          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Mateo</p>
          <p className="text-[1.05rem] leading-relaxed text-[var(--partner)]">
            ¡Qué bien! El río es muy bonito por la mañana. ¿Fuiste solo o con alguien?
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] underline-offset-2">Translate</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-[var(--panel-border)] bg-white/50 px-4 py-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_0_0_8px_rgba(15,110,124,0.14)]"
          aria-hidden
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M19 11a7 7 0 0 1-14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="text-xs text-[var(--muted)]">Listening… speak in English</p>
      </div>
    </div>
  );
}
