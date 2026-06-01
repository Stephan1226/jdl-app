import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MoodTag, SourceBadge, TagChip, TypeBadge } from "@/components/badges";
import { ConfirmButton } from "@/components/confirm-button";
import { dangerButton, ghostButton } from "@/components/ui";
import { prisma } from "@/lib/db";
import { ENTRY_SOURCE_LABELS, type EntrySource } from "@/lib/domain";
import { fmtDate } from "@/lib/format";
import { entryInclude } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/user";
import { deleteEntry } from "../actions";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const entry = await prisma.entry.findFirst({
    where: { id, userId },
    include: entryInclude,
  });
  if (!entry) notFound();

  const tags = entry.tags.map((t) => t.tag);

  return (
    <div className="space-y-6">
      <Link
        href="/entries"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 기록으로
      </Link>

      <article className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <TypeBadge type={entry.type} />
          <span>{fmtDate(entry.occurredAt)}</span>
          <MoodTag mood={entry.mood} />
          <SourceBadge source={entry.source} />
        </div>

        {entry.title && (
          <h1 className="text-2xl font-semibold tracking-tight">{entry.title}</h1>
        )}

        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
          {entry.content || <span className="text-muted">(내용 없음)</span>}
        </p>

        {(entry.book || entry.goal || entry.sourceRef) && (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
            {entry.book && (
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-muted">책</span>
                <Link
                  href={`/books/${entry.book.id}`}
                  className="text-accent hover:underline"
                >
                  📖 {entry.book.title}
                  {entry.book.author ? ` · ${entry.book.author}` : ""}
                </Link>
              </div>
            )}
            {entry.goal && (
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-muted">목표</span>
                <Link
                  href={`/goals/${entry.goal.id}`}
                  className="text-accent hover:underline"
                >
                  🎯 {entry.goal.title}
                </Link>
              </div>
            )}
            {entry.sourceRef && (
              <div className="flex gap-2">
                <span className="w-16 shrink-0 text-muted">
                  {ENTRY_SOURCE_LABELS[entry.source as EntrySource] ?? "원본"}
                </span>
                <span className="break-all text-foreground/80">{entry.sourceRef}</span>
              </div>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} />
            ))}
          </div>
        )}

        <div className="flex gap-2 border-t border-border pt-5">
          <Link href={`/entries/${entry.id}/edit`} className={ghostButton}>
            <Pencil className="h-4 w-4" /> 수정
          </Link>
          <ConfirmButton
            action={deleteEntry.bind(null, entry.id)}
            label="삭제"
            message="이 기록을 삭제할까요? 되돌릴 수 없습니다."
            className={dangerButton}
          />
        </div>
      </article>
    </div>
  );
}
