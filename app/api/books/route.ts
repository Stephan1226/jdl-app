import { requireUserId, sjson } from "@/lib/api";
import { getBooksData } from "@/lib/data/books";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  return sjson(await getBooksData(userId));
}
