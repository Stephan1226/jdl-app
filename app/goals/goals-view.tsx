"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { GoalProgress } from "@/components/goal-progress";
import { Card, EmptyState, PageHeader, primaryButton } from "@/components/ui";
import type { GoalsData } from "@/lib/data/goals";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

export function GoalsView() {
  const { data: goals = [] } = useQuery({
    queryKey: qk.goals,
    queryFn: () => fetchJson<GoalsData>("/api/goals"),
  });

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
