import { prisma } from "@/lib/db";

/** 기록 작성/수정 폼에 필요한 선택지(책·목표·태그) */
export async function loadEntryFormOptions(userId: string) {
  const [books, goals, tags] = await Promise.all([
    prisma.book.findMany({
      where: { userId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true },
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);
  return { books, goals, allTags: tags.map((t) => t.name) };
}
