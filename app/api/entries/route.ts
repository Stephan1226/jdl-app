import { requireUserId, sjson } from "@/lib/api";
import { getEntriesData } from "@/lib/data/entries";
import { isEntryType } from "@/lib/domain";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const typeParam = new URL(request.url).searchParams.get("type");
  const type = typeParam && isEntryType(typeParam) ? typeParam : undefined;

  const entries = await getEntriesData(userId, type);
  return sjson(entries);
}
