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

export async function deleteBook(id: string) {
  // 연결된 기록은 onDelete: SetNull 로 보존된다.
  await prisma.book.delete({ where: { id } });
  revalidatePath("/books");
  revalidatePath("/entries");
  redirect("/books");
}
