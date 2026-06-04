import "server-only";
import { prisma } from "@/lib/db";

/** 책 목록(+ 연결된 기록 수). userId 스코프. */
export async function getBooksData(userId: string) {
  return prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });
}

export type BooksData = Awaited<ReturnType<typeof getBooksData>>;
