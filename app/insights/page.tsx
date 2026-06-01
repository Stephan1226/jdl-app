import { format } from "date-fns";
import { InsightsCharts } from "@/components/insights-charts";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { prisma } from "@/lib/db";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_SOURCES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
  moodMeta,
} from "@/lib/domain";
import { getCurrentUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const userId = await getCurrentUserId();
  const [entries, tags] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      select: { occurredAt: true, mood: true, type: true, source: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { entries: true } } },
    }),
  ]);

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="인사이트"
          description="기록을 모아 흐름과 패턴을 들여다봅니다."
        />
        <EmptyState
          title="아직 보여줄 데이터가 없어요"
          description="기록을 쌓으면 시간에 따른 흐름이 보입니다."
        />
      </div>
    );
  }

  // 월별 집계 (기록 수 + 평균 감정)
  const byMonth = new Map<
    string,
    { count: number; moodSum: number; moodCount: number }
  >();
  for (const e of entries) {
    const key = format(e.occurredAt, "yyyy-MM");
    const m = byMonth.get(key) ?? { count: 0, moodSum: 0, moodCount: 0 };
    m.count += 1;
    if (e.mood !== null && e.mood !== undefined) {
      m.moodSum += e.mood;
      m.moodCount += 1;
    }
    byMonth.set(key, m);
  }
  const monthKeys = [...byMonth.keys()].sort();
  const label = (k: string) => k.slice(2).replace("-", "."); // 2026-01 → 26.01

  const monthly = monthKeys.map((k) => ({
    month: label(k),
    count: byMonth.get(k)!.count,
  }));
  const moodTrend = monthKeys.map((k) => {
    const m = byMonth.get(k)!;
    return {
      month: label(k),
      mood: m.moodCount ? Number((m.moodSum / m.moodCount).toFixed(2)) : null,
    };
  });

  const typeCounts = ENTRY_TYPES.map((t) => ({
    name: ENTRY_TYPE_LABELS[t],
    value: entries.filter((e) => e.type === t).length,
  })).filter((d) => d.value > 0);

  const sourceCounts = ENTRY_SOURCES.map((s) => ({
    name: ENTRY_SOURCE_LABELS[s],
    value: entries.filter((e) => e.source === s).length,
  })).filter((d) => d.value > 0);

  const topTags = tags
    .map((t) => ({ name: t.name, value: t._count.entries, color: t.color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const withMood = entries.filter((e) => e.mood !== null && e.mood !== undefined);
  const avgMood = withMood.length
    ? withMood.reduce((s, e) => s + (e.mood ?? 0), 0) / withMood.length
    : null;
  const avgMoodMeta = avgMood !== null ? moodMeta(Math.round(avgMood)) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="인사이트"
        description="흩어진 기록을 모아 시간에 따른 흐름과 패턴을 들여다봅니다."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="전체 기록" value={entries.length} />
        <StatCard label="기록한 개월 수" value={monthKeys.length} />
        <StatCard
          label="평균 감정"
          value={
            avgMood !== null ? `${avgMoodMeta?.emoji ?? ""} ${avgMood.toFixed(1)}` : "—"
          }
        />
        <StatCard label="태그 수" value={tags.length} />
      </div>

      <InsightsCharts
        monthly={monthly}
        moodTrend={moodTrend}
        typeCounts={typeCounts}
        sourceCounts={sourceCounts}
        topTags={topTags}
      />
    </div>
  );
}
