"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import superjson from "superjson";
import {
  Card,
  EmptyState,
  PageHeader,
  ghostButton,
  inputClass,
  labelClass,
  primaryButton,
} from "@/components/ui";
import type { BooksData } from "@/lib/data/books";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";
import { createBook } from "./actions";

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

export function BooksView() {
  const { data: books = [] } = useQuery({
    queryKey: qk.books,
    queryFn: () => fetchJson<BooksData>("/api/books"),
  });

  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchBookDoc[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIsbns, setAddedIsbns] = useState<Set<string>>(new Set());

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search/books?${new URLSearchParams({ query })}`);
      if (!res.ok) throw new Error(`검색 실패 (${res.status})`);
      const data = superjson.parse<SearchBookResponse>(await res.text());
      setResults(data.documents);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddBook(doc: SearchBookDoc) {
    const isbn = doc.isbn.split(" ")[0] || doc.isbn;
    const formData = new FormData();
    formData.set("title", doc.title);
    formData.set("author", doc.authors.join(", "));
    await createBook(formData);
    setAddedIsbns((prev) => new Set(prev).add(isbn));
    queryClient.invalidateQueries({ queryKey: qk.books });
    setTimeout(() => {
      setAddedIsbns((prev) => {
        const next = new Set(prev);
        next.delete(isbn);
        return next;
      });
    }, 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="독서"
        description="읽은 책과 그 책에 남긴 독후감을 함께 관리합니다."
      />

      <Card>
        <div className="mb-4">
          <h2 className="mb-3 font-medium">Daum 책 검색</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
              placeholder="책 제목, 저자로 검색…"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className={primaryButton}
            >
              <Search className="h-4 w-4" />
              {isSearching ? "검색 중…" : "검색"}
            </button>
          </form>
        </div>

        {results !== null && results.length === 0 && (
          <p className="text-sm text-muted">검색 결과가 없습니다.</p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              총 {results.length}건
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((doc) => {
                const isbn = doc.isbn.split(" ")[0] || doc.isbn;
                const added = addedIsbns.has(isbn);
                return (
                  <Card
                    key={isbn}
                    className="flex gap-4"
                  >
                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-accent/10">
                      {doc.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element -- 외부 CDN 이미지라 next/Image 사용 불가
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
                          {doc.sale_price > 0 && ` · ${doc.sale_price.toLocaleString()}원`}
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
            <input id="title" name="title" required className={inputClass} placeholder="책 제목" />
          </div>
          <div>
            <label className={labelClass} htmlFor="author">
              저자 <span className="font-normal text-muted">(선택)</span>
            </label>
            <input id="author" name="author" className={inputClass} placeholder="저자" />
          </div>
          <button type="submit" className={primaryButton}>
            추가
          </button>
        </form>
      </Card>

      {books.length === 0 ? (
        <EmptyState
          title="아직 책이 없어요"
          description="위에서 책을 검색하거나 직접 추가해 보세요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {books.map((b) => (
            <Link key={b.id} href={`/books/${b.id}`} className="block">
              <Card className="flex h-full gap-4 transition hover:border-accent/40">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.title}</p>
                  {b.author && (
                    <p className="truncate text-sm text-muted">{b.author}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    독후감 {b._count.entries}개
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
