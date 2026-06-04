"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { EmptyState, PageHeader, primaryButton } from "@/components/ui";
import { ENTRY_TYPE_LABELS, ENTRY_TYPES } from "@/lib/domain";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";
import type { EntryWithRelations } from "@/lib/queries";

const TABS = [
  { value: "", label: "전체" },
  ...ENTRY_TYPES.map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] })),
];

export function EntriesView({ activeType }: { activeType: string }) {
  // 키는 page의 prefetch와 동일 → 첫 렌더는 하이드레이션 캐시에서 즉시, 재방문도 캐시로 즉시.
  const { data: entries = [] } = useQuery({
    queryKey: qk.entries(activeType),
    queryFn: () =>
      fetchJson<EntryWithRelations[]>(
        `/api/entries${activeType ? `?type=${activeType}` : ""}`,
      ),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="기록"
        description="흩어진 모든 기록을 시간순으로 모았습니다."
        action={
          <Link href="/entries/new" className={primaryButton}>
            <Plus className="h-4 w-4" />새 기록
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const on = tab.value === activeType;
          const href = tab.value ? `/entries?type=${tab.value}` : "/entries";
          return (
            <Link
              key={tab.value || "all"}
              href={href}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                on
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:border-accent/40"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="기록이 없어요"
          description="이 분류에는 아직 기록이 없습니다."
          action={
            <Link href="/entries/new" className={primaryButton}>
              새 기록 쓰기
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted">{entries.length}개의 기록</p>
          <div className="space-y-3">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
