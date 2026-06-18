"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { Card, EmptyState, PageHeader, primaryButton } from "@/components/ui";
import type { GrowthData } from "@/lib/data/growth";
import type { Badge } from "@/lib/growth";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

// 레벨 — 게임 gem(보석) 아이콘
function GemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <polygon points="8,3 16,3 21,9 12,21 3,9" opacity="0.85" />
      <polygon points="8,3 16,3 21,9 12,9 3,9" opacity="1" />
      <line x1="9" y1="5" x2="11" y2="8" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

// 연속 기록 — 게임 불꽃 아이콘
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C11 5 8 8 8 12.5a4.5 4.5 0 009 0c0-2-.9-3.4-2-4.5.1 1.4-.8 2.5-.8 2.5C14.5 8 14 4.5 12 2z" />
      <path d="M12 15.5a1.8 1.8 0 01-1.8-1.8" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}

// 사고 다양성 — 4방향 나침반 로즈 아이콘
function CompassRoseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="12" cy="12" r="1.6" />
      {/* N (밝음) */}
      <path d="M12 3l2.2 5.5H9.8L12 3z" />
      {/* S (어두움) */}
      <path d="M12 21l-2.2-5.5h4.4L12 21z" opacity="0.55" />
      {/* E (밝음) */}
      <path d="M21 12l-5.5 2.2V9.8L21 12z" />
      {/* W (어두움) */}
      <path d="M3 12l5.5-2.2v4.4L3 12z" opacity="0.55" />
    </svg>
  );
}

export function GrowthView() {
  const { data } = useQuery({
    queryKey: qk.growth,
    queryFn: () => fetchJson<GrowthData>("/api/growth"),
  });
  if (!data) return null;

  if (data.stats.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="성장"
          description="기록이 쌓이는 만큼 성장합니다."
        />
        <EmptyState
          title="아직 성장 기록이 없어요"
          description="첫 기록을 남기면 레벨과 배지가 열립니다."
          action={
            <Link href="/entries/new" className={primaryButton}>
              첫 기록 쓰기
            </Link>
          }
        />
      </div>
    );
  }

  const earned = data.badges.filter((b) => b.earned);

  return (
    <div className="space-y-8">
      <PageHeader
        title="성장"
        description="기록의 양이 아니라 사고의 다양성과 꾸준함으로 자랍니다."
      />

      {/* 레벨 + 스트릭 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm text-muted">
            <GemIcon className="h-4 w-4 text-accent" /> 레벨
          </div>
          <p className="mt-2 text-4xl font-bold tracking-tight">
            Lv.{data.level}
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted">
              <span>{data.xp.toLocaleString()} XP</span>
              <span>
                다음 레벨까지 {(data.xpForNextLevel - data.xpIntoLevel).toLocaleString()} XP
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${data.levelProgressPct}%` }}
              />
            </div>
          </div>

          {data.xpBreakdown.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted">XP 구성</p>
              {data.xpBreakdown.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between text-xs">
                  <span className="text-muted">
                    {s.label} <span className="text-muted/70">({s.detail})</span>
                  </span>
                  <span className="font-medium tabular-nums">+{s.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm text-muted">
            <FlameIcon className="h-4 w-4 text-orange-500" /> 연속 기록
          </div>
          <p className="mt-2 text-4xl font-bold tracking-tight">
            {data.stats.currentStreak}
            <span className="ml-1 text-lg font-medium text-muted">일</span>
          </p>
          <p className="mt-4 text-xs text-muted">
            최장 기록 {data.stats.longestStreak}일 · 기록한 날 {data.stats.activeDays}일
          </p>
        </Card>
      </div>

      {/* 기록 잔디 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">기록 잔디</h2>
        <Card>
          <ContributionHeatmap dayCounts={data.dayCounts} years={data.years} />
        </Card>
      </section>

      {/* 다양성 점수 */}
      <DiversityCard score={data.diversity} />

      {/* 배지 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">배지</h2>
          <span className="text-sm text-muted">
            {earned.length} / {data.badges.length} 획득
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.badges.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DiversityCard({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;

  return (
    <Card>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="11"
              className="stroke-black/[.07] dark:stroke-white/[.09]"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              stroke="var(--color-accent)"
              strokeDasharray={`${dash} ${c}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight">{score}</span>
            <span className="text-xs text-muted">/ 100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="flex items-center justify-center gap-2 text-lg font-semibold sm:justify-start">
            <CompassRoseIcon className="h-5 w-5 text-accent" /> 사고 다양성
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            한 가지 주제·톤에 머무를수록 점수가 낮아집니다. 다양한 종류·출처·감정의
            기록을 남길수록 시야가 넓어져요.
          </p>
          <Link href="/perspective" className={`${primaryButton} mt-4`}>
            <CompassRoseIcon className="h-4 w-4" /> AI로 다른 시야 보기
          </Link>
        </div>
      </div>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));
  return (
    <div
      className={`rounded-2xl border p-4 text-center transition ${
        badge.earned
          ? "border-accent/40 bg-accent/[.06]"
          : "border-border bg-card"
      }`}
    >
      <div className={`text-3xl ${badge.earned ? "" : "opacity-30 grayscale"}`}>
        {badge.emoji}
      </div>
      <p className="mt-2 text-sm font-medium">{badge.title}</p>
      <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
      <p
        className={`mt-1.5 text-xs font-semibold ${
          badge.earned ? "text-accent" : "text-muted/70"
        }`}
      >
        {badge.earned ? "✓ " : ""}+{badge.xp.toLocaleString()} XP
      </p>
      {!badge.earned && (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
            <div
              className="h-full rounded-full bg-accent/60"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {badge.current} / {badge.target}
          </p>
        </div>
      )}
    </div>
  );
}
