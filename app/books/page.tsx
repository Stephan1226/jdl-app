import { BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createBook } from "./actions";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const userId = await getCurrentUserId();
  const books = await prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="독서"
        description="읽은 책과 그 책에 남긴 독후감을 함께 관리합니다."
      />

      <Card>
        <h2 className="mb-3 font-medium">책 추가</h2>
        <form
          action={createBook}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className={labelClass} htmlFor="title">
              제목
            </label>
            <input id="title" name="title" required className={inputClass} placeholder="책 제목" />
          </div>
          <div>
            <label className={labelClass} htmlFor="author">
              저자 <span className="font-normal text-muted">(선택)</span>
            </label>
            <input id="author" name="author" className={inputClass} placeholder="저자" />
          </div>
          <button type="submit" className={primaryButton}>
            추가
          </button>
        </form>
      </Card>

      {books.length === 0 ? (
        <EmptyState
          title="아직 책이 없어요"
          description="위에서 책을 추가하면 독후감을 연결할 수 있어요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((b) => (
            <Link key={b.id} href={`/books/${b.id}`} className="block">
              <Card className="flex h-full gap-4 transition hover:border-accent/40">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.title}</p>
                  {b.author && (
                    <p className="truncate text-sm text-muted">{b.author}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    독후감 {b._count.entries}개
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
