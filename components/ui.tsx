import Link from "next/link";
import type { ReactNode } from "react";

/** 페이지 상단 헤더 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** 대시보드 숫자 카드 */
export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
}) {
  const body = (
    <Card className="h-full transition hover:border-accent/40">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <p className="text-base font-medium">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** 버튼 스타일 (Link / button 모두에 className으로 사용) */
export const primaryButton =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-50";
export const ghostButton =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-accent/40 disabled:opacity-50";
export const dangerButton =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-red-300 bg-card px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30";

/** 폼 입력 공통 스타일 */
export const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

/** <select> 전용 스타일 — 네이티브 화살표 대신 커스텀 chevron, 우측 여유 */
export const selectClass =
  `${inputClass} appearance-none pr-10 bg-no-repeat [background-position:right_12px_center] [background-size:16px] [background-image:url(data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E)]`;

export const labelClass = "block text-sm font-medium mb-1.5";
