import { requireUserId, sjson } from "@/lib/api";
import { getBooksData, type BookQueryParams } from "@/lib/data/books";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const u = new URL(request.url).searchParams;
  const params: BookQueryParams = {};
  const q = u.get("q");
  if (q) params.q = q;
  const sort = u.get("sort");
  if (sort && ["createdAt", "recentEntry"].includes(sort)) {
    params.sort = sort as "createdAt" | "recentEntry";
  }
  const order = u.get("order");
  if (order && ["asc", "desc"].includes(order)) {
    params.order = order as "asc" | "desc";
  }
  const page = u.get("page");
  if (page) params.page = Number(page);
  const limit = u.get("limit");
  if (limit) params.limit = Number(limit);

  return sjson(await getBooksData(userId, params));
}
