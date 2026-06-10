"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus } from "lucide-react";
import Link from "next/link";
import {
  SelectableItem,
  SelectionToolbar,
  useBulkSelect,
} from "@/components/bulk-select";
import { EntryCard } from "@/components/entry-card";
import {
  EmptyState,
  PageHeader,
  ghostButton,
  primaryButton,
} from "@/components/ui";
import { ENTRY_TYPE_LABELS, ENTRY_TYPES } from "@/lib/domain";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";
import type { EntryWithRelations } from "@/lib/queries";
import { deleteEntries } from "./actions";

const TABS = [
  { value: "", label: "전체" },
  ...ENTRY_TYPES.map((t) => ({ value: t, label: ENTRY_TYPE_LABELS[t] })),
];

export function EntriesView({ activeType }: { activeType: string }) {
  const queryClient = useQueryClient();
  // 키는 page의 prefetch와 동일 → 첫 렌더는 하이드레이션 캐시에서 즉시, 재방문도 캐시로 즉시.
  const { data: entries = [] } = useQuery({
    queryKey: qk.entries(activeType),
    queryFn: () =>
      fetchJson<EntryWithRelations[]>(
        `/api/entries${activeType ? `?type=${activeType}` : ""}`,
      ),
  });

  const sel = useBulkSelect();
  const { exit: exitSelection } = sel;

  // 탭이 바뀌면 보이지 않는 항목이 선택된 채 남지 않게 선택 모드를 종료
  useEffect(() => {
    exitSelection();
  }, [activeType, exitSelection]);

  async function handleBulkDelete() {
    await deleteEntries([...sel.selected]);
    exitSelection();
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  }

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
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{entries.length}개의 기록</p>
            {!sel.active && (
              <button
                type="button"
                className={ghostButton}
                onClick={() => sel.start()}
              >
                <CheckSquare className="h-4 w-4" />
                선택
              </button>
            )}
          </div>
          <div className={`space-y-3 ${sel.active ? "pb-24" : ""}`}>
            {entries.map((e) => (
              <SelectableItem
                key={e.id}
                selectionMode={sel.active}
                selected={sel.selected.has(e.id)}
                onLongPress={() =>
                  sel.active ? sel.toggle(e.id) : sel.start(e.id)
                }
                onToggle={() => sel.toggle(e.id)}
              >
                <EntryCard entry={e} />
              </SelectableItem>
            ))}
          </div>
        </>
      )}

      {sel.active && (
        <SelectionToolbar
          count={sel.selected.size}
          total={entries.length}
          unit="개"
          confirmMessage={`선택한 기록 ${sel.selected.size}개를 삭제할까요? 되돌릴 수 없습니다.`}
          onToggleAll={() =>
            sel.selected.size === entries.length
              ? sel.setAll([])
              : sel.setAll(entries.map((e) => e.id))
          }
          onDelete={handleBulkDelete}
          onExit={exitSelection}
        />
      )}
    </div>
  );
}
