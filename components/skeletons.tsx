import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui";

/**
 * 로딩 중 보여줄 회색 placeholder 블록.
 * 색 토큰은 코드베이스의 진행바 트랙과 동일(bg-black/[.06] · dark:bg-white/[.08]).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-black/[.06] dark:bg-white/[.08] ${className}`}
    />
  );
}

/** PageHeader 자리(제목 + 설명, 선택적으로 우측 액션 버튼) */
export function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      {action && <Skeleton className="h-9 w-28 rounded-full" />}
    </div>
  );
}

/** 숫자 카드(StatCard) 4개 그리드 자리 */
export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-12" />
        </Card>
      ))}
    </div>
  );
}

/** 세로 리스트형 카드 자리(기록·검색 결과) */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

/** 2열 카드 그리드 자리(목표·독서) */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </Card>
      ))}
    </div>
  );
}

/**
 * 프리페치되지 않는 하위 페이지(폼·상세)용 전환 로더.
 * 콘텐츠 스켈레톤(목록/그리드)이 안 맞는 곳에서, 스피너 + 라벨로 자연스러운 전환을 보여준다.
 */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
