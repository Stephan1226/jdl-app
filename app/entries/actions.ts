"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { entryInputSchema, idListSchema } from "@/lib/domain";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";

function parseEntryForm(formData: FormData) {
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return entryInputSchema.parse({
    type: formData.get("type"),
    title: formData.get("title"),
    content: formData.get("content"),
    source: formData.get("source"),
    sourceRef: formData.get("sourceRef"),
    mood: formData.get("mood"),
    occurredAt: formData.get("occurredAt"),
    bookId: formData.get("bookId"),
    goalId: formData.get("goalId"),
    tags,
  });
}

/** 태그 이름들을 upsert하고 id 배열을 반환 */
async function resolveTagIds(userId: string, names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

export async function createEntry(formData: FormData) {
  const userId = await getCurrentUserId();
  const data = parseEntryForm(formData);
  const tagIds = await resolveTagIds(userId, data.tags);

  const entry = await prisma.entry.create({
    data: {
      userId,
      type: data.type,
      title: data.title ?? null,
      content: data.content,
      source: data.source,
      sourceRef: data.sourceRef ?? null,
      mood: data.mood ?? null,
      occurredAt: data.occurredAt ?? new Date(),
      bookId: data.bookId || null,
      goalId: data.goalId || null,
      tags: { create: tagIds.map((id) => ({ tag: { connect: { id } } })) },
    },
  });

  revalidatePath("/entries");
  revalidatePath("/");
  redirect(`/entries/${entry.id}`);
}

export async function updateEntry(id: string, formData: FormData) {
  const userId = await getCurrentUserId();
  const data = parseEntryForm(formData);
  const tagIds = await resolveTagIds(userId, data.tags);

  // 소유권 확인 — 남의 기록은 수정 불가(IDOR 방지)
  const owned = await prisma.entry.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) notFound();

  // 태그 연결을 초기화하고 다시 연결
  await prisma.tagsOnEntries.deleteMany({ where: { entryId: id } });
  await prisma.entry.update({
    where: { id },
    data: {
      type: data.type,
      title: data.title ?? null,
      content: data.content,
      source: data.source,
      sourceRef: data.sourceRef ?? null,
      mood: data.mood ?? null,
      occurredAt: data.occurredAt ?? new Date(),
      bookId: data.bookId || null,
      goalId: data.goalId || null,
      tags: { create: tagIds.map((tid) => ({ tag: { connect: { id: tid } } })) },
    },
  });

  revalidatePath("/entries");
  revalidatePath(`/entries/${id}`);
  revalidatePath("/");
  redirect(`/entries/${id}`);
}

export async function deleteEntry(id: string) {
  const userId = await getCurrentUserId();
  // userId 스코프 → 남의 기록은 삭제되지 않는다(IDOR 방지)
  await prisma.entry.deleteMany({ where: { id, userId } });
  revalidatePath("/entries");
  revalidatePath("/");
  redirect("/entries");
}

/** 선택한 기록 일괄 삭제 — 목록 페이지에 머무르므로 redirect 없음 */
export async function deleteEntries(ids: string[]) {
  const userId = await getCurrentUserId();
  const parsed = idListSchema.parse(ids);
  // userId 스코프 → 남의 기록은 삭제되지 않는다(IDOR 방지)
  await prisma.entry.deleteMany({ where: { id: { in: parsed }, userId } });
  revalidatePath("/entries");
  revalidatePath("/");
}
