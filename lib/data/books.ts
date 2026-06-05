import "server-only";
import { prisma } from "@/lib/db";

export interface BookQueryParams {
  q?: string;
  sort?: "createdAt" | "recentEntry";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface BookListResult {
  items: Array<{
    id: string;
    title: string;
    author: string | null;
    isbn: string | null;
    coverUrl: string | null;
    totalPages: number | null;
    createdAt: Date;
    _count: { entries: number };
    lastEntryAt: Date | null;
  }>;
  totalCount: number;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

/**
 * 책 목록(+ 연결된 기록 수 + 마지막 기록 시각). 검색·정렬·페이지네이션 지원.
 * userId 스코프.
 */
export async function getBooksData(
  userId: string,
  params: BookQueryParams = {},
): Promise<BookListResult> {
  const q = (params.q ?? "").trim();
  const sort = params.sort ?? "createdAt";
  const order = params.order ?? "desc";
  const page = params.page ?? 0;
  const limit = params.limit ?? PAGE_SIZE;

  const where = {
    userId,
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { author: { contains: q } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "createdAt"
      ? { createdAt: order }
      : { createdAt: "desc" as const };

  const [items, totalCount] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      skip: page * limit,
      take: limit + 1,
      include: {
        _count: { select: { entries: true } },
        entries: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true },
        },
      },
    }),
    prisma.book.count({ where }),
  ]);

  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;

  // recentEntry 정렬은 entries의 최근 occurredAt 기준으로 in-memory 정렬
  const result = sliced.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    coverUrl: b.coverUrl,
    totalPages: b.totalPages,
    createdAt: b.createdAt,
    _count: b._count,
    lastEntryAt: b.entries[0]?.occurredAt ?? null,
  }));

  if (sort === "recentEntry") {
    result.sort((a, b) => {
      const aDate = a.lastEntryAt?.getTime() ?? 0;
      const bDate = b.lastEntryAt?.getTime() ?? 0;
      return order === "asc" ? aDate - bDate : bDate - aDate;
    });
  }

  return { items: result, totalCount, hasMore };
}

export type BooksData = Awaited<ReturnType<typeof getBooksData>>;
