import "server-only";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_SOURCES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
  moodMeta,
} from "@/lib/domain";

/**
 * 인사이트 집계. 무거운 가공을 서버에서 끝내 컴팩트한 결과만 내려보낸다
 * (전체 entries를 클라로 보내지 않음).
 */
export async function getInsightsData(userId: string) {
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
  const avgMoodEmoji = avgMood !== null ? (moodMeta(Math.round(avgMood))?.emoji ?? null) : null;

  return {
    total: entries.length,
    monthCount: monthKeys.length,
    tagCount: tags.length,
    avgMood,
    avgMoodEmoji,
    monthly,
    moodTrend,
    typeCounts,
    sourceCounts,
    topTags,
  };
}

export type InsightsData = Awaited<ReturnType<typeof getInsightsData>>;
