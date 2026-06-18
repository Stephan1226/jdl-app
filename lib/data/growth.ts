import "server-only";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { computeGrowth, computeStreaks, type GrowthStats } from "@/lib/growth";

/**
 * 성장 데이터 집계. 무거운 가공은 서버에서 끝내 컴팩트한 결과만 내려준다.
 * userId 스코프 — 남의 데이터 접근 차단.
 */
export async function getGrowthData(userId: string) {
  const [entries, tagCount, achievedGoals] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      select: { occurredAt: true, type: true, source: true, mood: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.tag.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: "ACHIEVED" } }),
  ]);

  const byType: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const moods = new Set<number>();
  const dayKeys = new Set<string>();
  const dayCounts: Record<string, number> = {};
  const yearSet = new Set<number>();

  for (const e of entries) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
    bySource[e.source] = (bySource[e.source] ?? 0) + 1;
    if (e.mood !== null && e.mood !== undefined) moods.add(e.mood);
    const key = format(e.occurredAt, "yyyy-MM-dd"); // 서버 기준 날짜
    dayKeys.add(key);
    dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    yearSet.add(e.occurredAt.getFullYear());
  }

  const today = new Date();
  // 잔디 연도 탭 — 기록이 있는 해 + 올해(빈 해여도 "올해" 탭은 보이도록), 내림차순.
  yearSet.add(today.getFullYear());
  const years = [...yearSet].sort((a, b) => b - a);

  const { currentStreak, longestStreak } = computeStreaks([...dayKeys], today);

  const stats: GrowthStats = {
    total: entries.length,
    byType,
    bySource,
    tagCount,
    distinctMoods: moods.size,
    currentStreak,
    longestStreak,
    achievedGoals,
    activeDays: dayKeys.size,
  };

  return { stats, ...computeGrowth(stats), dayCounts, years };
}

export type GrowthData = Awaited<ReturnType<typeof getGrowthData>>;
