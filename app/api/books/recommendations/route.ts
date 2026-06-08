import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { AiKeyError, callAI } from "@/lib/openrouter";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const entries = await prisma.entry.findMany({
    where: { userId, type: { in: ["THOUGHT", "NOTE"] } },
    orderBy: { occurredAt: "desc" },
    take: 20,
    select: { title: true, content: true },
  });

  if (entries.length === 0) {
    return Response.json({ recommendations: [], noEntries: true });
  }

  const entriesText = entries
    .map((e) => `- ${e.title ?? "기록"}: ${(e.content ?? "").slice(0, 300)}`)
    .join("\n");

  const prompt = `다음은 사용자의 최근 생각·메모 기록입니다:

${entriesText}

위 기록을 분석해서 지금 이 시점에 읽으면 좋을 책 3권을 한국어로 추천해 주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"recommendations": [{"title": "책 제목", "reason": "추천 이유 한 줄"}, {"title": "책 제목", "reason": "추천 이유 한 줄"}, {"title": "책 제목", "reason": "추천 이유 한 줄"}]}`;

  try {
    const raw = await callAI([{ role: "user", content: prompt }]);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "parse_error" }, { status: 500 });
    }
    const parsed = JSON.parse(match[0]) as {
      recommendations?: { title: string; reason: string }[];
    };
    return Response.json({ recommendations: parsed.recommendations ?? [] });
  } catch (e) {
    if (e instanceof AiKeyError) {
      return Response.json({ error: "api_key_invalid" }, { status: 503 });
    }
    return Response.json({ error: "ai_error" }, { status: 500 });
  }
}
