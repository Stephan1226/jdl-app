import "server-only";
import { prisma } from "@/lib/db";
import type { RecommendationKind } from "@/lib/domain";

/**
 * AI 추천 캐시 데이터 액세스.
 *
 * 추천은 한 번 만들면 DB에 저장해 페이지를 이동해도 유지한다(요청-응답 메모리 캐시 X).
 * 대신 "관련 기록"이 그대로인지 시그니처(개수 + 최신 수정시각)로 추적해서,
 * 새 기록이 쌓이거나 수정되면 stale=true로 표시 → UI가 재추천을 유도한다.
 *
 * 모든 쿼리는 userId 스코프(IDOR 방지).
 */

export type Signature = { count: number; latest: Date | null };

export type CachedRecommendation<T> = {
  payload: T;
  generatedAt: Date;
  /** 생성 이후 관련 기록이 늘거나 바뀌었는가 */
  stale: boolean;
};

/** 독서 추천의 재료 = 생각·메모 기록. 그 집합의 시그니처. */
export async function bookSignature(userId: string): Promise<Signature> {
  const agg = await prisma.entry.aggregate({
    where: { userId, type: { in: ["THOUGHT", "NOTE"] } },
    _count: { _all: true },
    _max: { updatedAt: true },
  });
  return { count: agg._count._all, latest: agg._max.updatedAt };
}

/** 목표 다음 할 일의 재료 = 그 목표에 연결된 기록 + 목표 자체의 변경. */
export async function goalSignature(
  userId: string,
  goalId: string,
): Promise<Signature> {
  const [agg, goal] = await Promise.all([
    prisma.entry.aggregate({
      where: { userId, goalId },
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    prisma.goal.findFirst({
      where: { id: goalId, userId },
      select: { updatedAt: true },
    }),
  ]);
  return {
    count: agg._count._all,
    latest: maxDate(agg._max.updatedAt, goal?.updatedAt ?? null),
  };
}

function maxDate(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function isStale(sig: Signature, row: { sourceCount: number; sourceLatest: Date | null }): boolean {
  if (sig.count !== row.sourceCount) return true;
  if (sig.latest && (!row.sourceLatest || sig.latest > row.sourceLatest)) return true;
  return false;
}

/**
 * 캐시된 추천을 읽는다. 없으면 null.
 * 현재 시그니처(sig)와 저장 시점 시그니처를 비교해 stale 여부를 함께 계산한다.
 */
export async function readRecommendation<T>(
  userId: string,
  kind: RecommendationKind,
  goalId: string | null,
  sig: Signature,
): Promise<CachedRecommendation<T> | null> {
  const row = await prisma.recommendation.findFirst({
    where: { userId, kind, goalId },
  });
  if (!row) return null;
  return {
    payload: row.payload as T,
    generatedAt: row.createdAt,
    stale: isStale(sig, row),
  };
}

/**
 * 추천을 저장(없으면 생성, 있으면 갱신). userId+kind+goalId당 1개를 유지한다.
 * Postgres가 NULL을 distinct로 다뤄 @@unique가 BOOK(goalId=null)을 강제하지 못하므로
 * upsert 대신 findFirst → update/create로 코드에서 단일성을 보장한다.
 */
export async function writeRecommendation(
  userId: string,
  kind: RecommendationKind,
  goalId: string | null,
  payload: unknown,
  sig: Signature,
): Promise<void> {
  const data = {
    payload: payload as object,
    sourceCount: sig.count,
    sourceLatest: sig.latest,
  };
  const existing = await prisma.recommendation.findFirst({
    where: { userId, kind, goalId },
    select: { id: true },
  });
  if (existing) {
    await prisma.recommendation.update({ where: { id: existing.id }, data });
  } else {
    await prisma.recommendation.create({
      data: { userId, kind, goalId, ...data },
    });
  }
}
