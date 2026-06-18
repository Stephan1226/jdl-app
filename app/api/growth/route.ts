import { requireUserId, sjson } from "@/lib/api";
import { getGrowthData } from "@/lib/data/growth";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const data = await getGrowthData(userId);
  return sjson(data);
}
