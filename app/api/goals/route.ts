import { requireUserId, sjson } from "@/lib/api";
import { getGoalsData } from "@/lib/data/goals";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  return sjson(await getGoalsData(userId));
}
