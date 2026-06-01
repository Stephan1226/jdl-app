import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryForm } from "@/components/entry-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { loadEntryFormOptions } from "@/lib/entry-data";
import { toDateInput } from "@/lib/format";
import { getCurrentUserId } from "@/lib/user";
import { updateEntry } from "../../actions";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const entry = await prisma.entry.findFirst({
    where: { id, userId },
    include: { tags: { include: { tag: true } } },
  });
  if (!entry) notFound();

  const { books, goals, allTags } = await loadEntryFormOptions(userId);

  return (
    <div className="space-y-6">
      <Link
        href={`/entries/${entry.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 기록으로
      </Link>
      <PageHeader title="기록 수정" />
      <EntryForm
        action={updateEntry.bind(null, entry.id)}
        books={books}
        goals={goals}
        allTags={allTags}
        defaults={{
          type: entry.type,
          title: entry.title ?? "",
          content: entry.content,
          source: entry.source,
          sourceRef: entry.sourceRef ?? "",
          mood: entry.mood,
          occurredAt: toDateInput(entry.occurredAt),
          bookId: entry.bookId,
          goalId: entry.goalId,
          tags: entry.tags.map((t) => t.tag.name),
        }}
        submitLabel="수정 저장"
      />
    </div>
  );
}
