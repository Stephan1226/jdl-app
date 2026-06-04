import { BackButton } from "@/components/back-button";
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
      <BackButton fallback="/entries" />
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
