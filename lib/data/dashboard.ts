import "server-only";
import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { entryInclude } from "@/lib/queries";

/** 대시보드 집계(전체/이번달/책 수, 진행중 목표, 최근 기록 5). userId 스코프. */
export async function getDashboardData(userId: string) {
  const monthStart = startOfMonth(new Date());
  const [entryCount, monthCount, bookCount, activeGoals, recent] =
    await Promise.all([
      prisma.entry.count({ where: { userId } }),
      prisma.entry.count({ where: { userId, occurredAt: { gte: monthStart } } }),
      prisma.book.count({ where: { userId } }),
      prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.entry.findMany({
        where: { userId },
        include: entryInclude,
        orderBy: { occurredAt: "desc" },
        take: 5,
      }),
    ]);
  return { entryCount, monthCount, bookCount, activeGoals, recent };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
