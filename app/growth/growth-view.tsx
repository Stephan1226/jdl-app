"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { Card, EmptyState, PageHeader, primaryButton } from "@/components/ui";
import type { GrowthData } from "@/lib/data/growth";
import type { Badge } from "@/lib/growth";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

function GemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <polygon points="8,3 16,3 21,9 12,21 3,9" opacity="0.85" />
      <polygon points="8,3 16,3 12,9" opacity="0.55" />
      <polyline points="3,9 12,9 21,9" fill="none" stroke="white" strokeWidth="0.6" opacity="0.4" />
      <line x1="9" y1="4.5" x2="11" y2="8" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function FireIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C11 5 8 7.5 8 12a4.5 4.5 0 009 0c0-2-.9-3.3-1.8-4.2.1 1.4-.7 2.2-.7 2.2C14 7.5 14.5 4.5 12 2z" />
      <path d="M12 15.5A1.5 1.5 0 0110.5 14" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M9 9l1.8 4.5 1.2-2.5 1.2 2.5L15 9l-2.5 1.2L12 9.8l-.5.4z" />
    </svg>
  );
}

function BadgeIcon({ id, className }: { id: string; className?: string }) {
  const cls = `h-8 w-8 ${className ?? ""}`;
  switch (id) {
    case "first":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M12 22v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M12 13C12 13 7 10 7 6a5 5 0 0110 0c0 4-5 7-5 7z" />
          <path d="M12 17c2-.5 4.5-2 5-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        </svg>
      );
    case "ten":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <rect x="4" y="3" width="13" height="18" rx="2" />
          <rect x="16" y="5" width="4" height="14" rx="1" opacity="0.45" />
          <line x1="7" y1="8" x2="14" y2="8" stroke="white" strokeWidth="1.2" opacity="0.45" />
          <line x1="7" y1="12" x2="14" y2="12" stroke="white" strokeWidth="1.2" opacity="0.45" />
          <path d="M7 16l2 2 4-3.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "hundred":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M12 2l2.4 7.4H22l-6.3 4.6 2.4 7.3L12 17l-6.1 4.3 2.4-7.3L2 9.4h7.6z" />
        </svg>
      );
    case "streak7":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M12 2C10.5 6 8 8.5 8 13a4.5 4.5 0 009 0c0-2-.9-3.4-2-4.5.1 1.6-.8 2.7-.8 2.7C14 9 14.5 5.5 12 2z" />
          <path d="M12 16.5A2 2 0 0110 15" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
          <circle cx="17" cy="7" r="3.5" />
          <path d="M15.5 7h3M17 5.5v3" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "streak30":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
        </svg>
      );
    case "reader":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <rect x="3" y="16" width="18" height="5" rx="1.5" />
          <rect x="5" y="10" width="14" height="5" rx="1.5" opacity="0.82" />
          <rect x="7" y="4" width="10" height="5" rx="1.5" opacity="0.65" />
          <line x1="6.5" y1="16" x2="6.5" y2="21" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="8.5" y1="10" x2="8.5" y2="15" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="10.5" y1="4" x2="10.5" y2="9" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>
      );
    case "thinker":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M12 2a7 7 0 015.2 11.6l-.2.3V17a1 1 0 01-1 1H8a1 1 0 01-1-1v-3.1l-.2-.3A7 7 0 0112 2z" />
          <rect x="9" y="18" width="6" height="2" rx="0.5" opacity="0.7" />
          <rect x="10" y="20.2" width="4" height="1.8" rx="1" opacity="0.45" />
          <path d="M9.5 8.5a3 3 0 012.5-3" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case "achiever":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M7 2h10v8.5a5 5 0 01-10 0V2z" />
          <path d="M5 4H3a2 2 0 000 4h2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M19 4h2a2 2 0 010 4h-2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10.5" y="13" width="3" height="3.5" opacity="0.75" />
          <rect x="7" y="16.5" width="10" height="3" rx="1" />
          <path d="M12 4.5l.9 2.7h2.8l-2.3 1.7.9 2.7L12 10l-2.3 1.6.9-2.7-2.3-1.7h2.8z" fill="white" opacity="0.75" />
        </svg>
      );
    case "tagger":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M3 8a2 2 0 012-2h7.2l4.8 4.8-6 6L3 10.8V8z" />
          <circle cx="8" cy="10" r="1.3" fill="white" opacity="0.65" />
          <path d="M13 5.5h4l4.5 4.5-2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
        </svg>
      );
    case "allTypes":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
          <circle cx="5" cy="5" r="1.5" opacity="0.45" />
          <circle cx="19" cy="5" r="1.5" opacity="0.45" />
          <circle cx="5" cy="19" r="1.5" opacity="0.45" />
          <circle cx="19" cy="19" r="1.5" opacity="0.45" />
        </svg>
      );
    case "integrator":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="1.8" />
          <path d="M12 4l2.2 6.2H18l-3 2.2 1.1 3.6L12 14l-4.1 2 1.1-3.6-3-2.2h3.8z" opacity="0.8" />
        </svg>
      );
    case "openMind":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" fill="none" />
          <path d="M4.5 7.5h15M4.5 16.5h15" stroke="currentColor" strokeWidth="0.9" opacity="0.3" fill="none" />
        </svg>
      );
    default:
      return <span className="text-3xl">{id}</span>;
  }
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
        <PageHeader title="성장" description="기록이 쌓이는 만큼 성장합니다." />
        <EmptyState
          title="아직 성장 기록이 없어요"
          description="첫 기록을 남기면 레벨과 배지가 열립니다."
          action={<Link href="/entries/new" className={primaryButton}>첫 기록 쓰기</Link>}
        />
      </div>
    );
  }

  const earned = data.badges.filter((b) => b.earned);

  return (
    <div className="space-y-8">
      <PageHeader title="성장" description="기록의 양이 아니라 사고의 다양성과 꾸준함으로 자랍니다." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm text-muted">
            <GemIcon className="h-4 w-4 text-accent" /> 레벨
          </div>
          <p className="mt-2 text-4xl font-bold tracking-tight">Lv.{data.level}</p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted">
              <span>{data.xp.toLocaleString()} XP</span>
              <span>다음 레벨까지 {(data.xpForNextLevel - data.xpIntoLevel).toLocaleString()} XP</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
              <div className="h-full rounded-full bg-accent" style={{ width: `${data.levelProgressPct}%` }} />
            </div>
          </div>
          {data.xpBreakdown.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted">XP 구성</p>
              {data.xpBreakdown.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between text-xs">
                  <span className="text-muted">{s.label} <span className="text-muted/70">({s.detail})</span></span>
                  <span className="font-medium tabular-nums">+{s.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm text-muted">
            <FireIcon className="h-4 w-4 text-orange-500" /> 연속 기록
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">기록 잔디</h2>
        <Card>
          <ContributionHeatmap dayCounts={data.dayCounts} years={data.years} />
        </Card>
      </section>

      <DiversityCard score={data.diversity} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">배지</h2>
          <span className="text-sm text-muted">{earned.length} / {data.badges.length} 획득</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.badges.map((b) => <BadgeCard key={b.id} badge={b} />)}
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
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" className="stroke-black/[.07] dark:stroke-white/[.09]" />
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="11" strokeLinecap="round" stroke="var(--color-accent)" strokeDasharray={`${dash} ${c}`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight">{score}</span>
            <span className="text-xs text-muted">/ 100</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="flex items-center justify-center gap-2 text-lg font-semibold sm:justify-start">
            <CompassIcon className="h-5 w-5 text-accent" /> 사고 다양성
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            한 가지 주제·톤에 머무를수록 점수가 낮아집니다. 다양한 종류·출처·감정의 기록을 남길수록 시야가 넓어져요.
          </p>
          <Link href="/perspective" className={`${primaryButton} mt-4`}>
            <CompassIcon className="h-4 w-4" /> AI로 다른 시야 보기
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
        badge.earned ? "border-accent/40 bg-accent/[.06]" : "border-border bg-card"
      }`}
    >
      <div className={`flex justify-center ${badge.earned ? "text-accent" : "text-muted/40"}`}>
        <BadgeIcon id={badge.id} />
      </div>
      <p className="mt-2 text-sm font-medium">{badge.title}</p>
      <p className="mt-0.5 text-xs text-muted">{badge.description}</p>
      <p className={`mt-1.5 text-xs font-semibold ${badge.earned ? "text-accent" : "text-muted/70"}`}>
        {badge.earned ? "✓ " : ""}+{badge.xp.toLocaleString()} XP
      </p>
      {!badge.earned && (
        <div className="mt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/[.06] dark:bg-white/[.08]">
            <div className="h-full rounded-full bg-accent/60" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{badge.current} / {badge.target}</p>
        </div>
      )}
    </div>
  );
}
