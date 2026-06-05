"use client";

import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import {
  EmptyState,
  PageHeader,
  inputClass,
  primaryButton,
  selectClass,
} from "@/components/ui";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_SOURCES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
} from "@/lib/domain";
import type { SearchData } from "@/lib/data/search";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

export function SearchView({ params }: { params: Record<string, string> }) {
  const { data } = useQuery({
    queryKey: qk.search(params),
    queryFn: () =>
      fetchJson<SearchData>(
        `/api/search?${new URLSearchParams(params).toString()}`,
      ),
  });
  const entries = data?.entries ?? [];
  const allTags = data?.allTags ?? [];

  const q = params.q ?? "";
  const type = params.type ?? "";
  const source = params.source ?? "";
  const tag = params.tag ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const hasFilter = Boolean(q || type || source || tag || from || to);

  return (
    <div className="space-y-6">
      <PageHeader
        title="검색"
        description="제목·내용·태그·기간·종류·출처로 기록을 찾습니다."
      />

      <form
        method="get"
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            className={`${inputClass} min-w-0 flex-1`}
            placeholder="제목이나 내용으로 검색…"
          />
          <button type="submit" className={`${primaryButton} shrink-0`}>
            <SearchIcon className="h-4 w-4" />검색
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select name="type" defaultValue={type} className={selectClass}>
            <option value="">모든 종류</option>
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENTRY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select name="source" defaultValue={source} className={selectClass}>
            <option value="">모든 출처</option>
            {ENTRY_SOURCES.map((s) => (
              <option key={s} value={s}>
                {ENTRY_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
          <select name="tag" defaultValue={tag} className={selectClass}>
            <option value="">모든 태그</option>
            {allTags.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1.5 block text-sm text-muted">기간</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              name="from"
              defaultValue={from}
              aria-label="시작일"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <span className="shrink-0 text-muted">~</span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              aria-label="종료일"
              className={`${inputClass} min-w-0 flex-1`}
            />
          </div>
        </div>
        {hasFilter && (
          <Link
            href="/search"
            className="inline-block text-sm text-muted hover:text-foreground"
          >
            필터 초기화
          </Link>
        )}
      </form>

      <p className="text-sm text-muted">
        {entries.length}개 {hasFilter ? "검색 결과" : "전체 기록"}
        {entries.length === 100 ? " (최대 100개 표시)" : ""}
      </p>

      {entries.length === 0 ? (
        <EmptyState
          title="결과가 없어요"
          description="다른 검색어나 필터로 다시 시도해 보세요."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
