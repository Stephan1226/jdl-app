"use client";

import {
  BookOpen,
  LayoutDashboard,
  LineChart,
  LogOut,
  NotebookPen,
  Plus,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { ghostButton, primaryButton } from "@/components/ui";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/entries", label: "기록", icon: NotebookPen },
  { href: "/books", label: "독서", icon: BookOpen },
  { href: "/search", label: "검색", icon: Search },
  { href: "/insights", label: "인사이트", icon: LineChart },
  { href: "/goals", label: "목표", icon: Target },
];

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const pathname = usePathname();

  // 로그인·회원가입은 사이드바 없이 가운데 정렬한 베어 레이아웃.
  if (pathname === "/login" || pathname === "/signup") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </div>
    );
  }

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl">
      {/* 사이드바 (md+) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
        <Link href="/" className="px-2 text-xl font-bold tracking-tight">
          jdl<span className="text-accent">.</span>
        </Link>
        <p className="mt-1 px-2 text-xs text-muted">흩어진 기록을 한 곳에</p>

        <Link href="/entries/new" className={`${primaryButton} mt-6`}>
          <Plus className="h-4 w-4" /> 새 기록
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on = active(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  on
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/70 hover:bg-black/[.04] hover:text-foreground dark:hover:bg-white/[.05]"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2.5 px-2">
          {userEmail && (
            <p className="truncate text-xs text-muted" title={userEmail}>
              {userEmail}
            </p>
          )}
          <form action={logout}>
            <button type="submit" className={`${ghostButton} w-full`}>
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </form>
          <p className="text-xs text-muted">졸업작품 · jdl</p>
        </div>
      </aside>

      <div className="flex w-full min-w-0 flex-col">
        {/* 모바일 상단바 */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/" className="text-lg font-bold">
            jdl<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/entries/new" className={primaryButton}>
              <Plus className="h-4 w-4" />새 기록
            </Link>
            <form action={logout}>
              <button
                type="submit"
                aria-label="로그아웃"
                className={`${ghostButton} px-2.5`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {NAV.map((item) => {
            const on = active(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  on ? "bg-accent/10 text-accent" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
