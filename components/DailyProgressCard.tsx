"use client";

import { DAILY_GOAL_OPTIONS } from "@/lib/settings";
import { goalReached } from "@/lib/progress";

type DailyProgressCardProps = {
  secondsToday: number;
  dailyGoalMinutes: number;
  loading?: boolean;
  onGoalChange?: (minutes: number) => void;
  /** Inline toolbar style — less vertical chrome in the practice shell. */
  compact?: boolean;
};

export function DailyProgressCard({
  secondsToday,
  dailyGoalMinutes,
  loading,
  onGoalChange,
  compact = false,
}: DailyProgressCardProps) {
  const goalSeconds = Math.max(1, dailyGoalMinutes * 60);
  const ratio = Math.min(1, secondsToday / goalSeconds);
  const minutesDone = Math.floor(secondsToday / 60);
  const hitGoal = goalReached(secondsToday, dailyGoalMinutes);
  const percent = Math.round(ratio * 100);

  return (
    <div
      className={[
        "w-full rounded-xl border border-[var(--panel-border)] bg-white/70",
        compact ? "px-3 py-2" : "mx-auto max-w-sm px-3.5 py-2.5",
      ].join(" ")}
      aria-label={`Today ${minutesDone} of ${dailyGoalMinutes} minutes`}
    >
      <div
        className={[
          "flex items-center gap-3 text-xs",
          compact ? "justify-between" : "mb-1.5 justify-between",
        ].join(" ")}
      >
        <span className="uppercase tracking-[0.12em] text-[var(--muted)]">Today</span>
        <span
          className={[
            "tabular-nums font-medium",
            hitGoal ? "text-[var(--ready)]" : "text-[var(--foreground)]",
          ].join(" ")}
        >
          {loading ? "…" : `${minutesDone} / ${dailyGoalMinutes} min`}
          {!loading && hitGoal ? " · Goal hit" : ""}
        </span>
        {compact && onGoalChange ? (
          <label className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="sr-only">Daily goal</span>
            <select
              className="rounded-md border border-[var(--level-border)] bg-white px-1.5 py-0.5 text-xs text-[var(--foreground)]"
              value={dailyGoalMinutes}
              disabled={loading}
              onChange={(e) => onGoalChange(Number(e.target.value))}
              aria-label="Set daily practice goal"
            >
              {DAILY_GOAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes}m
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div
        className={[
          "overflow-hidden rounded-full bg-[rgba(21,35,45,0.08)]",
          compact ? "mt-1.5 h-1.5" : "h-2",
        ].join(" ")}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className={[
            "h-full rounded-full transition-[width] duration-500",
            hitGoal ? "bg-[var(--ready)]" : "bg-[var(--accent)]",
          ].join(" ")}
          style={{ width: `${loading ? 0 : percent}%` }}
        />
      </div>

      {!compact && onGoalChange ? (
        <label className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>Daily goal</span>
          <select
            className="rounded-md border border-[var(--level-border)] bg-white px-2 py-1 text-xs text-[var(--foreground)]"
            value={dailyGoalMinutes}
            disabled={loading}
            onChange={(e) => onGoalChange(Number(e.target.value))}
            aria-label="Set daily practice goal"
          >
            {DAILY_GOAL_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
