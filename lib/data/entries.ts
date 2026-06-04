import "server-only";
import { prisma } from "@/lib/db";
import { entryInclude } from "@/lib/queries";

/** 기록 목록(선택적 type 필터). userId 스코프 필수. RSC prefetch와 라우트 핸들러가 공용. */
export function getEntriesData(userId: string, type?: string) {
  return prisma.entry.findMany({
    where: { userId, ...(type ? { type } : {}) },
    include: entryInclude,
    orderBy: { occurredAt: "desc" },
  });
}
