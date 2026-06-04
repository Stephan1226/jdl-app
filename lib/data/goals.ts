import "server-only";
import { prisma } from "@/lib/db";
import type { GoalStatus } from "@/lib/domain";

const STATUS_ORDER: Record<GoalStatus, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  ACHIEVED: 2,
  ABANDONED: 3,
};

/** 목표 목록(+ 연결 기록 수), 상태 우선순위로 정렬. userId 스코프. */
export async function getGoalsData(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "desc" },
  });
  return goals.sort(
    (a, b) =>
      (STATUS_ORDER[a.status as GoalStatus] ?? 9) -
      (STATUS_ORDER[b.status as GoalStatus] ?? 9),
  );
}

export type GoalsData = Awaited<ReturnType<typeof getGoalsData>>;
