import Link from "next/link";
import { MoodTag, SourceBadge, TagChip, TypeBadge } from "@/components/badges";
import { fmtDate } from "@/lib/format";
import type { EntryWithRelations } from "@/lib/queries";

export function EntryCard({ entry }: { entry: EntryWithRelations }) {
  const tags = entry.tags.map((t) => t.tag);
  return (
    <Link href={`/entries/${entry.id}`} className="block">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-accent/40">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <TypeBadge type={entry.type} />
          <span>{fmtDate(entry.occurredAt)}</span>
          <MoodTag mood={entry.mood} />
          <span className="ml-auto">
            <SourceBadge source={entry.source} />
          </span>
        </div>
        {entry.title && <h3 className="mt-2.5 font-semibold">{entry.title}</h3>}
        {entry.content && (
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-foreground/80">
            {entry.content}
          </p>
        )}
        {(entry.book || tags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {entry.book && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/[.05] px-2.5 py-0.5 text-xs dark:bg-white/[.07]">
                📖 {entry.book.title}
              </span>
            )}
            {tags.map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} />
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
