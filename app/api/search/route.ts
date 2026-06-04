import { requireUserId, sjson } from "@/lib/api";
import { getSearchData, type SearchParams } from "@/lib/data/search";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const u = new URL(request.url).searchParams;
  const sp: SearchParams = {
    q: u.get("q") ?? undefined,
    type: u.get("type") ?? undefined,
    source: u.get("source") ?? undefined,
    tag: u.get("tag") ?? undefined,
    from: u.get("from") ?? undefined,
    to: u.get("to") ?? undefined,
  };
  return sjson(await getSearchData(userId, sp));
}
