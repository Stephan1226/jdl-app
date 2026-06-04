"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { EntryCard } from "@/components/entry-card";
import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  primaryButton,
} from "@/components/ui";
import type { DashboardData } from "@/lib/data/dashboard";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

export function DashboardView({ userName }: { userName: string }) {
  const { data } = useQuery({
    queryKey: qk.dashboard,
    queryFn: () => fetchJson<DashboardData>("/api/dashboard"),
  });
  if (!data) return null;
  const { entryCount, monthCount, bookCount, activeGoals, recent } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`안녕하세요, ${userName}님`}
        description="흩어져 있던 기록을 한 곳에서 돌아봅니다."
        action={
          <Link href="/entries/new" className={primaryButton}>
            <Plus className="h-4 w-4" />새 기록
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="전체 기록" value={entryCount} href="/entries" />
        <StatCard label="이번 달 기록" value={monthCount} hint="이번 달에 남긴 기록" />
        <StatCard label="읽은 책" value={bookCount} href="/books" />
        <StatCard label="진행 중 목표" value={activeGoals.length} href="/goals" />
      </div>

      <section className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">최근 기록</h2>
            <Link href="/entries" className="text-sm text-accent hover:underline">
              전체 보기
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="아직 기록이 없어요"
              description="첫 기록을 남겨보세요."
              action={
                <Link href="/entries/new" className={primaryButton}>
                  새 기록 쓰기
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recent.map((e) => (
                <EntryCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">진행 중 목표</h2>
            <Link href="/goals" className="text-sm text-accent hover:underline">
              전체 보기
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <EmptyState title="진행 중인 목표가 없어요" />
          ) : (
            <div className="space-y-3">
              {activeGoals.map((g) => {
                const pct =
                  g.targetValue && g.targetValue > 0
                    ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                    : null;
                return (
                  <Link key={g.id} href={`/goals/${g.id}`} className="block">
                    <Card className="transition hover:border-accent/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{g.title}</p>
                        <StatusBadge status={g.status} />
                      </div>
                      {pct !== null && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted">
                            <span>
                              {g.currentValue}
                              {g.unit ?? ""} / {g.targetValue}
                              {g.unit ?? ""}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
