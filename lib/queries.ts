import { Prisma } from "@/app/generated/prisma/client";

/** 기록을 보여줄 때 늘 함께 가져오는 관계 */
export const entryInclude = {
  tags: { include: { tag: true } },
  book: true,
  goal: true,
} satisfies Prisma.EntryInclude;

export type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof entryInclude;
}>;
