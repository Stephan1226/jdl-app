import "server-only";
import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { prisma } from "@/lib/db";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_TYPE_LABELS,
  moodMeta,
  type EntrySource,
  type EntryType,
} from "@/lib/domain";
import { computeProfile, type ProfileAxis } from "@/lib/growth";

const snippet = (s: string, n = 220) =>
  s.replace(/\s+/g, " ").trim().slice(0, n);

/**
 * 시야(편향 해소) AI에 넘길 기록 다이제스트.
 * 전체 기록을 보내지 않고, (1) 최근 흐름 (2) 종류·출처·태그 분포 (3) 오래 묵힌 기록 한 개를
 * 추려 컴팩트하게 만든다. (3)은 "재발견"의 재료 — 잊고 있던 기록을 지금 맥락과 잇기 위함.
 */
export async function getPerspectiveDigest(userId: string) {
  const [recent, grouped, topTags, total, oldPool] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      select: { title: true, content: true, type: true, mood: true },
      orderBy: { occurredAt: "desc" },
      take: 8,
    }),
    prisma.entry.groupBy({
      by: ["type"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.tag.findMany({
      where: { userId, entries: { some: {} } },
      select: { name: true, _count: { select: { entries: true } } },
      orderBy: { entries: { _count: "desc" } },
      take: 8,
    }),
    prisma.entry.count({ where: { userId } }),
    // 30일 이상 묵은 기록 중 하나(재발견 재료). 너무 짧은 메모는 제외.
    prisma.entry.findMany({
      where: {
        userId,
        occurredAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, title: true, content: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
      take: 50,
    }),
  ]);

  const bySource = await prisma.entry.groupBy({
    by: ["source"],
    where: { userId },
    _count: { _all: true },
  });

  const recentText = recent
    .map((e) => {
      const m = moodMeta(e.mood);
      const tone = m ? ` (감정: ${m.label})` : "";
      return `- [${ENTRY_TYPE_LABELS[e.type as EntryType] ?? e.type}]${tone} ${
        e.title ? `${e.title}: ` : ""
      }${snippet(e.content)}`;
    })
    .join("\n");

  const typeSummary = grouped
    .map((g) => `${ENTRY_TYPE_LABELS[g.type as EntryType] ?? g.type} ${g._count._all}개`)
    .join(", ");

  const sourceSummary = bySource
    .map(
      (g) =>
        `${ENTRY_SOURCE_LABELS[g.source as EntrySource] ?? g.source} ${g._count._all}개`,
    )
    .join(", ");

  const tagSummary =
    topTags.length > 0
      ? topTags.map((t) => `#${t.name}(${t._count.entries})`).join(", ")
      : "없음";

  // 재발견용 묵은 기록 하나 — 풀에서 가볍게 무작위 선택(세렌디피티).
  const forgotten =
    oldPool.length > 0
      ? oldPool[Math.floor(Math.random() * oldPool.length)]
      : null;

  const forgottenText = forgotten
    ? `제목: ${forgotten.title ?? "(제목 없음)"}\n작성: ${formatDistanceToNow(
        forgotten.occurredAt,
        { addSuffix: true, locale: ko },
      )}\n내용: ${snippet(forgotten.content, 400)}`
    : null;

  return {
    total,
    recentText,
    typeSummary,
    sourceSummary,
    tagSummary,
    forgotten: forgotten
      ? { id: forgotten.id, title: forgotten.title }
      : null,
    forgottenText,
  };
}

export type PerspectiveDigest = Awaited<ReturnType<typeof getPerspectiveDigest>>;

/**
 * 레이더(육각형) 그래프용 사고 프로필. 기록을 6개 영역으로 나눠 0~100으로 점수화 →
 * 낮은 축 = 채워야 할 사각지대. 결정적 계산이라 AI 호출 없이 항상 보여준다.
 */
export async function getThinkingProfile(
  userId: string,
): Promise<{ total: number; axes: ProfileAxis[] }> {
  const entries = await prisma.entry.findMany({
    where: { userId },
    select: {
      type: true,
      source: true,
      mood: true,
      content: true,
      occurredAt: true,
      _count: { select: { tags: true } },
    },
  });

  const total = entries.length;
  const byType: Record<string, number> = {};
  const sources = new Set<string>();
  const moods = new Set<number>();
  const recentDays = new Set<string>();
  let contentSum = 0;
  let taggedCount = 0;
  const now = new Date();

  for (const e of entries) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
    sources.add(e.source);
    if (e.mood !== null && e.mood !== undefined) moods.add(e.mood);
    contentSum += e.content.trim().length;
    if (e._count.tags > 0) taggedCount += 1;
    if (differenceInCalendarDays(now, e.occurredAt) < 30) {
      recentDays.add(`${e.occurredAt.getFullYear()}-${e.occurredAt.getMonth()}-${e.occurredAt.getDate()}`);
    }
  }

  const axes = computeProfile({
    total,
    byType,
    distinctSources: sources.size,
    distinctMoods: moods.size,
    recentActiveDays: recentDays.size,
    avgContentLength: total > 0 ? contentSum / total : 0,
    taggedRatio: total > 0 ? taggedCount / total : 0,
  });

  return { total, axes };
}
