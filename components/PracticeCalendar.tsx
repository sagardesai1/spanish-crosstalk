"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ViewTabs, type AppView } from "@/components/ViewTabs";
import {
  fetchCalendarMonth,
  postProgress,
  type CalendarDay,
  type CalendarResponse,
} from "@/lib/progress";
import { DAILY_GOAL_OPTIONS } from "@/lib/settings";

type PracticeCalendarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  headerRight?: ReactNode;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function intensityClass(day: CalendarDay | undefined, goalMinutes: number): string {
  if (!day || day.seconds <= 0) {
    return "bg-[rgba(21,35,45,0.04)] text-[var(--muted)]";
  }
  if (day.goalHit) {
    return "bg-[var(--ready)] text-white";
  }
  const ratio = goalMinutes > 0 ? day.minutes / goalMinutes : 0;
  if (ratio >= 0.5) {
    return "bg-[rgba(15,110,124,0.55)] text-white";
  }
  return "bg-[rgba(15,110,124,0.25)] text-[var(--foreground)]";
}

export function PracticeCalendar({ view, onViewChange, headerRight }: PracticeCalendarProps) {
  const { ready: authReady, userId, migrating } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!authReady || !userId || migrating) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void (async () => {
        try {
          const calendar = await fetchCalendarMonth(userId, year, month);
          if (!cancelled) setData(calendar);
        } catch (err) {
          console.error(err);
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Couldn't load calendar.");
            setData(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [year, month, reloadToken, authReady, userId, migrating]);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const day of data?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [data]);

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startPad = first.getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const items: Array<{ key: string; date: string | null; dayNum: number | null }> = [];

    for (let i = 0; i < startPad; i += 1) {
      items.push({ key: `pad-${i}`, date: null, dayNum: null });
    }
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      items.push({ key: date, date, dayNum: day });
    }
    while (items.length % 7 !== 0) {
      items.push({ key: `end-${items.length}`, date: null, dayNum: null });
    }
    return items;
  }, [year, month]);

  const selected = selectedDate ? dayMap.get(selectedDate) : null;
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const shiftMonth = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setSelectedDate(null);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
      <header className="mb-4 shrink-0 text-center">
        <div className="mb-3 flex items-center justify-between gap-3">
          <ViewTabs view={view} onChange={onViewChange} />
          <div className="flex items-center gap-2">
            {headerRight}
            <button
              type="button"
              onClick={() => setReloadToken((value) => value + 1)}
              className="rounded-lg border border-[var(--level-border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Refresh
            </button>
          </div>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--foreground)] sm:text-4xl">
          Consistency
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          See which days you showed up for Crosstalk.
        </p>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)]/80 shadow-[0_20px_60px_rgba(28,42,36,0.06)] backdrop-blur-sm">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg border border-[var(--level-border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Prev
            </button>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--foreground)]">
              {monthLabel(year, month)}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg border border-[var(--level-border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Next
            </button>
          </div>

          {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <Stat
              label="Practiced"
              value={loading ? "…" : String(data?.practicedDays ?? 0)}
              hint="days"
            />
            <Stat
              label="Goals hit"
              value={loading ? "…" : String(data?.goalHitDays ?? 0)}
              hint="days"
            />
            <Stat
              label="Streak"
              value={loading ? "…" : String(data?.currentStreak ?? 0)}
              hint="days"
            />
          </div>

          <label className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[var(--panel-border)] bg-white/70 px-3.5 py-2.5 text-sm">
            <span className="text-[var(--muted)]">Daily goal</span>
            <select
              className="rounded-md border border-[var(--level-border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)]"
              value={data?.dailyGoalMinutes ?? 20}
              disabled={loading}
              onChange={(e) => {
                const minutes = Number(e.target.value);
                if (!userId) return;
                void postProgress({ userId, dailyGoalMinutes: minutes })
                  .then(() => setReloadToken((value) => value + 1))
                  .catch((err: unknown) => {
                    console.error(err);
                    setError(
                      err instanceof Error ? err.message : "Couldn't save daily goal.",
                    );
                  });
              }}
              aria-label="Set daily practice goal"
            >
              {DAILY_GOAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell) => {
              if (!cell.date || cell.dayNum == null) {
                return <div key={cell.key} className="aspect-square" />;
              }
              const day = dayMap.get(cell.date);
              const isToday = cell.date === todayKey;
              const isSelected = cell.date === selectedDate;
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDate(cell.date)}
                  className={[
                    "aspect-square rounded-lg text-sm tabular-nums transition",
                    intensityClass(day, data?.dailyGoalMinutes ?? 20),
                    isToday ? "ring-2 ring-[var(--accent)] ring-offset-1" : "",
                    isSelected
                      ? "outline outline-2 outline-offset-1 outline-[var(--foreground)]"
                      : "",
                  ].join(" ")}
                  aria-label={`${cell.date}${day && day.seconds > 0 ? `, ${day.minutes} minutes` : ", no practice"}`}
                >
                  {cell.dayNum}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            <Legend swatch="bg-[rgba(21,35,45,0.04)]" label="None" />
            <Legend swatch="bg-[rgba(15,110,124,0.25)]" label="Some" />
            <Legend swatch="bg-[rgba(15,110,124,0.55)]" label="Halfway+" />
            <Legend swatch="bg-[var(--ready)]" label="Goal hit" />
          </div>

          <div className="mt-5 rounded-xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--foreground)]">
            {selected ? (
              selected.seconds > 0 ? (
                <p>
                  <span className="font-medium">{selected.date}</span>
                  {" · "}
                  {selected.minutes} min practiced
                  {selected.goalHit ? " · daily goal hit" : ""}
                </p>
              ) : (
                <p>
                  <span className="font-medium">{selected.date}</span>
                  {" · "}
                  no practice logged
                </p>
              )
            ) : (
              <p className="text-[var(--muted)]">Tap a day to see details.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-2 py-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--foreground)]">
        {value}
      </p>
      <p className="text-xs text-[var(--muted)]">{hint}</p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
