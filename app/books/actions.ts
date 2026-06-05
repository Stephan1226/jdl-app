"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bookInputSchema } from "@/lib/domain";
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
