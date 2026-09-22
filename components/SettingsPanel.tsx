"use client";

import type { ReactNode } from "react";
import {
  DAILY_GOAL_OPTIONS,
  LANGUAGE_OPTIONS,
  LEARNER_LEVELS,
  REGION_OPTIONS,
  SILENCE_DELAY_OPTIONS,
  type PracticeSettings,
  type SpanishRegion,
  type VoiceGender,
} from "@/lib/settings";

type SettingsPanelProps = {
  open: boolean;
  settings: PracticeSettings;
  onChange: (next: PracticeSettings) => void;
  onClose: () => void;
};

const selectClass =
  "w-full rounded-xl border border-[var(--level-border)] bg-white px-3 py-2.5 text-[0.95rem] text-[var(--foreground)]";

export function SettingsPanel({ open, settings, onChange, onClose }: SettingsPanelProps) {
  if (!open) return null;

  const patch = (partial: Partial<PracticeSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(21,35,45,0.35)]"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative z-10 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="settings-title" className="text-lg font-semibold text-[var(--foreground)]">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            Done
          </button>
        </div>

        <div className="space-y-5">
          <Field label="Level">
            <select
              className={selectClass}
              value={settings.level}
              onChange={(e) => patch({ level: e.target.value as PracticeSettings["level"] })}
            >
              {LEARNER_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Language">
            <select className={selectClass} value={settings.language} disabled>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                  {!lang.available ? " (soon)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--muted)]">More languages can be added later.</p>
          </Field>

          <Field label="Region">
            <select
              className={selectClass}
              value={settings.region}
              onChange={(e) => patch({ region: e.target.value as SpanishRegion })}
            >
              {REGION_OPTIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Changes accent, vocabulary feel, and partner.
            </p>
          </Field>

          <Field label="Voice">
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as VoiceGender[]).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => patch({ voiceGender: gender })}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm capitalize transition",
                    settings.voiceGender === gender
                      ? "border-[var(--accent)] bg-[rgba(15,110,124,0.08)] text-[var(--foreground)]"
                      : "border-[var(--level-border)] text-[var(--muted)] hover:border-[var(--accent-soft)]",
                  ].join(" ")}
                >
                  {gender}
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Voice speed · ${settings.voiceSpeed.toFixed(2)}x`}>
            <input
              type="range"
              min={0.7}
              max={1.15}
              step={0.01}
              value={settings.voiceSpeed}
              onChange={(e) => patch({ voiceSpeed: Number(e.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-[11px] text-[var(--muted)]">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </Field>

          <Field label="Continuous conversation">
            <button
              type="button"
              onClick={() =>
                patch({ continuousConversation: !settings.continuousConversation })
              }
              className={[
                "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition",
                settings.continuousConversation
                  ? "border-[var(--accent)] bg-[rgba(15,110,124,0.08)] text-[var(--foreground)]"
                  : "border-[var(--level-border)] text-[var(--muted)]",
              ].join(" ")}
            >
              {settings.continuousConversation
                ? "On — listens and sends after silence"
                : "Off — tap the mic each turn"}
            </button>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Like Immersion-style Crosstalk: talk naturally, pause, and it sends.
            </p>
          </Field>

          <Field label="Silence delay">
            <select
              className={selectClass}
              value={settings.silenceDelaySeconds}
              disabled={!settings.continuousConversation}
              onChange={(e) => patch({ silenceDelaySeconds: Number(e.target.value) })}
            >
              {SILENCE_DELAY_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} second{seconds === 1 ? "" : "s"}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              How long to wait after you stop talking before sending.
            </p>
          </Field>

          <Field label="Daily goal">
            <select
              className={selectClass}
              value={settings.dailyGoalMinutes}
              onChange={(e) => patch({ dailyGoalMinutes: Number(e.target.value) })}
            >
              {DAILY_GOAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Saved to Firestore with your practice time.
            </p>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
