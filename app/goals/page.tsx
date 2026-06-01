import { Plus } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { GoalProgress } from "@/components/goal-progress";
import { Card, EmptyState, PageHeader, primaryButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import type { GoalStatus } from "@/lib/domain";
import { getCurrentUserId } from "@/lib/user";

const STATUS_ORDER: Record<GoalStatus, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  ACHIEVED: 2,
  ABANDONED: 3,
};

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await getCurrentUserId();
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: "desc" },
  });
  goals.sort(
    (a, b) =>
      (STATUS_ORDER[a.status as GoalStatus] ?? 9) -
      (STATUS_ORDER[b.status as GoalStatus] ?? 9),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="목표"
        description="목표를 세우고, 기록으로 연결하고, 진행 상황을 추적합니다."
        action={
          <Link href="/goals/new" className={primaryButton}>
            <Plus className="h-4 w-4" />새 목표
          </Link>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          title="아직 목표가 없어요"
          description="첫 목표를 세워보세요."
          action={
            <Link href="/goals/new" className={primaryButton}>
              새 목표 만들기
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <Link key={g.id} href={`/goals/${g.id}`} className="block">
              <Card className="flex h-full flex-col gap-3 transition hover:border-accent/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{g.title}</p>
                  <StatusBadge status={g.status} />
                </div>
                {g.description && (
                  <p className="line-clamp-2 text-sm text-muted">{g.description}</p>
                )}
                <div className="mt-auto space-y-2">
                  <GoalProgress
                    current={g.currentValue}
                    target={g.targetValue}
                    unit={g.unit}
                  />
                  <p className="text-xs text-muted">연결된 기록 {g._count.entries}개</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
