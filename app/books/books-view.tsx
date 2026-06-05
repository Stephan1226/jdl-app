"use client";

import { useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import superjson from "superjson";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Card,
  EmptyState,
  PageHeader,
  ghostButton,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui";
import type { BookListResult } from "@/lib/data/books";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";
import { addBookFromSearch, createBook } from "./actions";

/* ── Daum 검색 결과 타입 ────────────────────────────────────────────── */

interface SearchBookDoc {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  price: number;
  sale_price: number;
  isbn: string;
  url: string;
  datetime: string;
  status: string;
}

interface SearchBookResponse {
  meta: { total_count: number; pageable_count: number; is_end: boolean };
  documents: SearchBookDoc[];
}

/* ── 정렬 옵션 ──────────────────────────────────────────────────────── */

type SortKey = "createdAt" | "recentEntry";
type SortOrder = "asc" | "desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "추가한 날짜" },
  { value: "recentEntry", label: "최근 독후감" },
];

/* ── 컴포넌트 ───────────────────────────────────────────────────────── */

export function BooksView() {
  const queryClient = useQueryClient();

  // Daum 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchBookDoc[] | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [addedIsbns, setAddedIsbns] = useState<Set<string>>(new Set());

  // 내 책 필터/정렬 상태
  const [filterQ, setFilterQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const params: Record<string, string> = {};
  if (filterQ) params.q = filterQ;
  if (sortKey !== "createdAt") params.sort = sortKey;
  if (sortOrder !== "desc") params.order = sortOrder;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: qk.books(params),
      queryFn: ({ pageParam = 0 }) =>
        fetchJson<BookListResult>(
          `/api/books?${new URLSearchParams({ ...params, page: String(pageParam), limit: "10" }).toString()}`,
        ),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasMore ? allPages.length : undefined,
    });

  const books = data?.pages.flatMap((p) => p.items) ?? [];

  /* ── Daum 검색 핸들러 ─────────────────────────────────────────────── */

  async function handleDaumSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search/books?${new URLSearchParams({ query: searchQuery })}`,
      );
      if (!res.ok) throw new Error(`검색 실패 (${res.status})`);
      const result = superjson.parse<SearchBookResponse>(await res.text());
      setSearchResults(result.documents);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddBook(doc: SearchBookDoc) {
    const isbn = doc.isbn.split(" ")[0] || doc.isbn;
    const formData = new FormData();
    formData.set("title", doc.title);
    formData.set("author", doc.authors.join(", "));
    formData.set("isbn", isbn);
    formData.set("coverUrl", doc.thumbnail);
    await addBookFromSearch(formData);
    setAddedIsbns((prev) => new Set(prev).add(isbn));
    queryClient.invalidateQueries({ queryKey: qk.books({}) });
    setTimeout(() => {
      setAddedIsbns((prev) => {
        const next = new Set(prev);
        next.delete(isbn);
        return next;
      });
    }, 2000);
  }

  /* ── 렌더링 ───────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <PageHeader
        title="독서"
        description="읽은 책과 그 책에 남긴 독후감을 함께 관리합니다."
      />

      {/* ── Daum 검색 섹션 ──────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-3 font-medium">Daum 책 검색</h2>
        <form onSubmit={handleDaumSearch} className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
            placeholder="책 제목, 저자로 검색…"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className={primaryButton}
          >
            <Search className="h-4 w-4" />
            {isSearching ? "검색 중…" : "검색"}
          </button>
        </form>

        {searchResults !== null && searchResults.length === 0 && (
          <p className="mt-3 text-sm text-muted">검색 결과가 없습니다.</p>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">총 {searchResults.length}건</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {searchResults.map((doc) => {
                const isbn = doc.isbn.split(" ")[0] || doc.isbn;
                const added = addedIsbns.has(isbn);
                return (
                  <Card key={isbn} className="flex gap-4">
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-accent/10">
                      {doc.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doc.thumbnail}
                          alt={doc.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-accent">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {doc.title}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {doc.authors.join(", ")}
                        </p>
                        <p className="text-xs text-muted">
                          {doc.publisher}
                          {doc.sale_price > 0 &&
                            ` · ${doc.sale_price.toLocaleString()}원`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddBook(doc)}
                        disabled={added}
                        className={`${added ? ghostButton : primaryButton} mt-2 self-start text-xs`}
                      >
                        {added ? "추가됨" : "내 책에 추가"}
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── 필터 & 정렬 ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label className={labelClass} htmlFor="filter-q">
            책 검색
          </label>
          <input
            id="filter-q"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            className={inputClass}
            placeholder="제목 또는 저자로 필터…"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sort-key">
            정렬
          </label>
          <select
            id="sort-key"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={inputClass}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          className={ghostButton}
          aria-label={sortOrder === "asc" ? "오름차순" : "내림차순"}
        >
          {sortOrder === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {sortOrder === "asc" ? "오름차순" : "내림차순"}
        </button>
      </div>

      {/* ── 직접 추가 ────────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-3 font-medium">직접 추가</h2>
        <form
          action={createBook}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className={labelClass} htmlFor="title">
              제목
            </label>
            <input
              id="title"
              name="title"
              required
              className={inputClass}
              placeholder="책 제목"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="author">
              저자 <span className="font-normal text-muted">(선택)</span>
            </label>
            <input
              id="author"
              name="author"
              className={inputClass}
              placeholder="저자"
            />
          </div>
          <button type="submit" className={primaryButton}>
            추가
          </button>
        </form>
      </Card>

      {/* ── 책 목록 ──────────────────────────────────────────────────── */}
      {books.length === 0 && !filterQ ? (
        <EmptyState
          title="아직 책이 없어요"
          description="위에서 책을 검색하거나 직접 추가해 보세요."
        />
      ) : books.length === 0 && filterQ ? (
        <EmptyState
          title="일치하는 책이 없어요"
          description="다른 검색어로 시도해 보세요."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">총 {books.length}권</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((b) => (
              <Link key={b.id} href={`/books/${b.id}`} className="block">
                <Card className="flex h-full gap-4 transition hover:border-accent/40">
                  {/* 썸네일 */}
                  <div className="h-22 w-15 shrink-0 overflow-hidden rounded-lg bg-accent/10">
                    {b.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-accent">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{b.title}</p>
                      {b.author && (
                        <p className="truncate text-sm text-muted">
                          {b.author}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        <span>
                          추가{" "}
                          {format(b.createdAt, "yy.MM.dd", { locale: ko })}
                        </span>
                        <span>독후감 {b._count.entries}개</span>
                        {b.lastEntryAt && (
                          <span>
                            최근 기록{" "}
                            {format(b.lastEntryAt, "yy.MM.dd", { locale: ko })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* 더보기 */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className={ghostButton}
              >
                {isFetchingNextPage ? (
                  "불러오는 중…"
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    더보기
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
