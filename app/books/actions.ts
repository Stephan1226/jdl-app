"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookInputSchema, idListSchema } from "@/lib/domain";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";

export async function createBook(formData: FormData) {
  const userId = await getCurrentUserId();
  const data = bookInputSchema.parse({
    title: formData.get("title"),
    author: formData.get("author"),
    totalPages: formData.get("totalPages"),
  });
  const book = await prisma.book.create({
    data: {
      userId,
      title: data.title,
      author: data.author ?? null,
      totalPages: data.totalPages ?? null,
    },
  });
  revalidatePath("/books");
  redirect(`/books/${book.id}`);
}

/** Daum 검색에서 책 추가 — redirect 없이 현재 페이지에 남음 */
export async function addBookFromSearch(formData: FormData) {
  const userId = await getCurrentUserId();
  const data = bookInputSchema.parse({
    title: formData.get("title"),
    author: formData.get("author"),
    isbn: formData.get("isbn"),
    coverUrl: formData.get("coverUrl"),
  });
  if (data.isbn) {
    const exists = await prisma.book.findFirst({
      where: { userId, isbn: data.isbn },
      select: { id: true },
    });
    if (exists) return;
  }
  await prisma.book.create({
    data: {
      userId,
      title: data.title,
      author: data.author ?? null,
      isbn: data.isbn ?? null,
      coverUrl: data.coverUrl ?? null,
    },
  });
  revalidatePath("/books");
}

export async function deleteBook(id: string) {
  const userId = await getCurrentUserId();
  // 연결된 기록은 onDelete: SetNull 로 보존된다. userId 스코프로 IDOR 방지.
  await prisma.book.deleteMany({ where: { id, userId } });
  revalidatePath("/books");
  revalidatePath("/entries");
  redirect("/books");
}

/** 선택한 책 일괄 삭제 — 연결된 기록은 onDelete: SetNull 로 보존. 목록에 머무르므로 redirect 없음 */
export async function deleteBooks(ids: string[]) {
  const userId = await getCurrentUserId();
  const parsed = idListSchema.parse(ids);
  // userId 스코프로 IDOR 방지
  await prisma.book.deleteMany({ where: { id: { in: parsed }, userId } });
  revalidatePath("/books");
  revalidatePath("/entries");
}
