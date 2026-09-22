"use client";

export type AppView = "practice" | "calendar";

type ViewTabsProps = {
  view: AppView;
  onChange: (view: AppView) => void;
};

export function ViewTabs({ view, onChange }: ViewTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--level-border)] p-0.5 text-xs">
      {(
        [
          { id: "practice", label: "Practice" },
          { id: "calendar", label: "Consistency" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            "rounded-md px-2.5 py-1.5 transition",
            view === tab.id
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
