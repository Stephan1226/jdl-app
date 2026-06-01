/** 목표 진행도 막대 (현재/목표치 + 퍼센트) */
export function GoalProgress({
  current,
  target,
  unit,
}: {
  current: number;
  target?: number | null;
  unit?: string | null;
}) {
  if (!target || target <= 0) return null;
  const pct = Math.min(100, Math.round((current / target) * 100));
  const u = unit ?? "";
  return (
    <div>
      <div className="flex justify-between text-xs text-muted">
        <span>
          {current}
          {u} / {target}
          {u}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
