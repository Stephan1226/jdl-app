import { requireUserId, sjson } from "@/lib/api";
import { getDashboardData } from "@/lib/data/dashboard";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  return sjson(await getDashboardData(userId));
}
