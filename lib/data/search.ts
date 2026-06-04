import "server-only";
import { endOfDay } from "date-fns";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ENTRY_SOURCES, isEntryType } from "@/lib/domain";
import { entryInclude } from "@/lib/queries";

export type SearchParams = {
  q?: string;
  type?: string;
  source?: string;
  tag?: string;
  from?: string;
  to?: string;
};

/** 검색(제목·내용·태그·기간·종류·출처). userId 스코프, 최대 100건. */
export async function getSearchData(userId: string, sp: SearchParams) {
  const q = (sp.q ?? "").trim();
  const type = sp.type && isEntryType(sp.type) ? sp.type : "";
  const source =
    sp.source && (ENTRY_SOURCES as readonly string[]).includes(sp.source)
      ? sp.source
      : "";
  const tag = (sp.tag ?? "").trim();
  const from = sp.from ?? "";
  const to = sp.to ?? "";

  const where: Prisma.EntryWhereInput = { userId };
  if (q) where.OR = [{ title: { contains: q } }, { content: { contains: q } }];
  if (type) where.type = type;
  if (source) where.source = source;
  if (tag) where.tags = { some: { tag: { name: tag } } };
  if (from || to) {
    where.occurredAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: endOfDay(new Date(to)) } : {}),
    };
  }

  const [entries, allTags] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: entryInclude,
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return { entries, allTags };
}

export type SearchData = Awaited<ReturnType<typeof getSearchData>>;
