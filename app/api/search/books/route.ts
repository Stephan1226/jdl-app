import { requireUserId, sjson } from "@/lib/api";
import { searchBooks } from "@/lib/data/search-books";
import type { BookSearchParams } from "@/lib/data/search-books";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const u = new URL(request.url).searchParams;
  const query = u.get("query") ?? "";
  if (!query.trim()) {
    return new Response("query parameter is required", { status: 400 });
  }

  const params: BookSearchParams = {};
  const sort = u.get("sort");
  if (sort && ["accuracy", "latest"].includes(sort)) params.sort = sort as "accuracy" | "latest";
  const page = u.get("page");
  if (page) params.page = Number(page);
  const size = u.get("size");
  if (size) params.size = Number(size);
  const target = u.get("target");
  if (target && ["title", "isbn", "publisher", "person"].includes(target)) {
    params.target = target as "title" | "isbn" | "publisher" | "person";
  }

  return sjson(await searchBooks(query, params));
}
