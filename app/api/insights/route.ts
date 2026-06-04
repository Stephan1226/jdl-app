import { requireUserId, sjson } from "@/lib/api";
import { getInsightsData } from "@/lib/data/insights";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  return sjson(await getInsightsData(userId));
}
