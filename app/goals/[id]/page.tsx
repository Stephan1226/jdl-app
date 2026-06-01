import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/badges";
import { ConfirmButton } from "@/components/confirm-button";
import { EntryCard } from "@/components/entry-card";
import { GoalProgress } from "@/components/goal-progress";
import { EmptyState, dangerButton, ghostButton, primaryButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { entryInclude } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/user";
import { deleteGoal } from "../actions";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: {
      entries: { include: entryInclude, orderBy: { occurredAt: "desc" } },
    },
  });
  if (!goal) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 목표로
      </Link>

      <div className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
            <StatusBadge status={goal.status} />
          </div>
          <div className="flex gap-2">
            <Link href={`/goals/${goal.id}/edit`} className={ghostButton}>
              <Pencil className="h-4 w-4" /> 수정
            </Link>
            <ConfirmButton
              action={deleteGoal.bind(null, goal.id)}
              label="삭제"
              message="이 목표를 삭제할까요? 연결된 기록은 남습니다."
              className={dangerButton}
            />
          </div>
        </div>

        {goal.description && (
          <p className="whitespace-pre-wrap text-foreground/80">{goal.description}</p>
        )}

        {goal.targetValue ? (
          <div className="max-w-md">
            <GoalProgress
              current={goal.currentValue}
              target={goal.targetValue}
              unit={goal.unit}
            />
          </div>
        ) : null}

        {goal.targetDate && (
          <p className="text-sm text-muted">목표일 · {fmtDate(goal.targetDate)}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">연결된 기록 {goal.entries.length}개</h2>
        <Link
          href={`/entries/new?type=GOAL_LOG&goalId=${goal.id}`}
          className={primaryButton}
        >
          <Plus className="h-4 w-4" /> 기록 추가
        </Link>
      </div>

      {goal.entries.length === 0 ? (
        <EmptyState
          title="아직 연결된 기록이 없어요"
          description="이 목표를 향한 진행 상황을 기록으로 남겨보세요."
          action={
            <Link
              href={`/entries/new?type=GOAL_LOG&goalId=${goal.id}`}
              className={primaryButton}
            >
              기록 추가
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {goal.entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
