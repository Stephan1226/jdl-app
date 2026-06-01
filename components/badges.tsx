import {
  ENTRY_SOURCE_LABELS,
  ENTRY_TYPE_EMOJI,
  ENTRY_TYPE_LABELS,
  GOAL_STATUS_LABELS,
  moodMeta,
  type EntrySource,
  type EntryType,
  type GoalStatus,
} from "@/lib/domain";

export function TypeBadge({ type }: { type: string }) {
  const t = type as EntryType;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/[.05] px-2.5 py-1 text-xs font-medium dark:bg-white/[.07]">
      <span>{ENTRY_TYPE_EMOJI[t] ?? "•"}</span>
      {ENTRY_TYPE_LABELS[t] ?? type}
    </span>
  );
}

export function SourceBadge({ source }: { source: string }) {
  const s = source as EntrySource;
  if (s === "MANUAL") return null; // 직접 작성은 굳이 표시 안 함
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted">
      {ENTRY_SOURCE_LABELS[s] ?? source}
    </span>
  );
}

export function MoodTag({ mood }: { mood: number | null | undefined }) {
  const m = moodMeta(mood);
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" title={m.label}>
      <span className="text-sm">{m.emoji}</span>
    </span>
  );
}

const STATUS_STYLE: Record<GoalStatus, string> = {
  ACTIVE:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  ACHIEVED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  PAUSED: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  ABANDONED: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as GoalStatus;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[s] ?? ""}`}
    >
      {GOAL_STATUS_LABELS[s] ?? status}
    </span>
  );
}

export function TagChip({
  name,
  color,
}: {
  name: string;
  color?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color ?? "var(--color-muted)" }}
      />
      {name}
    </span>
  );
}
