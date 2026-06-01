import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EntryForm } from "@/components/entry-form";
import { PageHeader } from "@/components/ui";
import { isEntryType } from "@/lib/domain";
import { loadEntryFormOptions } from "@/lib/entry-data";
import { getCurrentUserId } from "@/lib/user";
import { createEntry } from "../actions";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; bookId?: string; goalId?: string }>;
}) {
  const sp = await searchParams;
  const userId = await getCurrentUserId();
  const { books, goals, allTags } = await loadEntryFormOptions(userId);
  const type = sp.type && isEntryType(sp.type) ? sp.type : undefined;

  return (
    <div className="space-y-6">
      <Link
        href="/entries"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 기록으로
      </Link>
      <PageHeader title="새 기록" description="어떤 기록이든 한 곳에 남겨두세요." />
      <EntryForm
        action={createEntry}
        books={books}
        goals={goals}
        allTags={allTags}
        defaults={{ type, bookId: sp.bookId, goalId: sp.goalId }}
        submitLabel="기록 저장"
      />
    </div>
  );
}
