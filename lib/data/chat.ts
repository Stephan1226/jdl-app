import "server-only";
import { prisma } from "@/lib/db";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_TYPE_LABELS,
  moodMeta,
  type EntrySource,
  type EntryType,
} from "@/lib/domain";

const snippet = (s: string, n = 300) =>
  s.replace(/\s+/g, " ").trim().slice(0, n);

/**
 * 채팅이 "전체 데이터"를 근거로 답하도록 넘길 기록 컨텍스트.
 * 임베딩/RAG 없이, 최근 기록 본문 + 종류·출처·태그 분포를 컴팩트하게 모은다.
 * (개인 기록 규모에선 이 정도로 충분히 맥락이 잡힌다.)
 */
export async function buildChatContext(userId: string): Promise<string> {
  const [recent, byType, bySource, topTags, total] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      select: {
        title: true,
        content: true,
        type: true,
        mood: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: "desc" },
      take: 40,
    }),
    prisma.entry.groupBy({
      by: ["type"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.entry.groupBy({
      by: ["source"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.tag.findMany({
      where: { userId, entries: { some: {} } },
      select: { name: true, _count: { select: { entries: true } } },
      orderBy: { entries: { _count: "desc" } },
      take: 10,
    }),
    prisma.entry.count({ where: { userId } }),
  ]);

  if (total === 0) {
    return "사용자의 기록이 아직 없습니다.";
  }

  const recentText = recent
    .map((e) => {
      const m = moodMeta(e.mood);
      const tone = m ? ` (감정: ${m.label})` : "";
      const date = e.occurredAt.toISOString().slice(0, 10);
      return `- [${ENTRY_TYPE_LABELS[e.type as EntryType] ?? e.type}] ${date}${tone} ${
        e.title ? `${e.title}: ` : ""
      }${snippet(e.content)}`;
    })
    .join("\n");

  const typeSummary = byType
    .map(
      (g) =>
        `${ENTRY_TYPE_LABELS[g.type as EntryType] ?? g.type} ${g._count._all}개`,
    )
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

  return `전체 기록 수: ${total}개
종류 분포: ${typeSummary}
출처 분포: ${sourceSummary}
자주 쓴 태그: ${tagSummary}

최근 기록 (최신순):
${recentText}`;
}
