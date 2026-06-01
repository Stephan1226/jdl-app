import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { EntryCard } from "@/components/entry-card";
import { EmptyState, dangerButton, primaryButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { entryInclude } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/user";
import { deleteBook } from "../actions";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const book = await prisma.book.findFirst({
    where: { id, userId },
    include: {
      entries: { include: entryInclude, orderBy: { occurredAt: "desc" } },
    },
  });
  if (!book) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/books"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 독서로
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          {book.author && <p className="mt-1 text-muted">{book.author}</p>}
          <p className="mt-2 text-sm text-muted">독후감 {book.entries.length}개</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/entries/new?type=BOOK&bookId=${book.id}`}
            className={primaryButton}
          >
            <Plus className="h-4 w-4" /> 독후감 쓰기
          </Link>
          <ConfirmButton
            action={deleteBook.bind(null, book.id)}
            label="책 삭제"
            message="책을 삭제할까요? 연결된 독후감은 남지만 책 연결은 해제됩니다."
            className={dangerButton}
          />
        </div>
      </div>

      {book.entries.length === 0 ? (
        <EmptyState
          title="이 책의 독후감이 아직 없어요"
          action={
            <Link
              href={`/entries/new?type=BOOK&bookId=${book.id}`}
              className={primaryButton}
            >
              독후감 쓰기
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {book.entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
