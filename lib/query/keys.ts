/**
 * TanStack Query 키 팩토리 — RSC prefetch와 클라 useQuery가 **반드시 같은 키**를 써야
 * 하이드레이션이 맞물린다. 한 곳에서 관리해 오타로 인한 캐시 미스를 막는다.
 */
export const qk = {
  dashboard: ["dashboard"] as const,
  entries: (type?: string) => ["entries", type ?? ""] as const,
  entry: (id: string) => ["entry", id] as const,
  books: (params?: Record<string, string>) => ["books", params ?? {}] as const,
  book: (id: string) => ["book", id] as const,
  goals: ["goals"] as const,
  goal: (id: string) => ["goal", id] as const,
  insights: ["insights"] as const,
  search: (params: Record<string, string>) => ["search", params] as const,
  entryFormOptions: ["entry-form-options"] as const,
  bookSearch: (query: string) => ["book-search", query] as const,
};
