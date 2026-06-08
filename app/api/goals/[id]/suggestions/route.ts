import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { AiKeyError, callAI } from "@/lib/openrouter";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: {
      entries: {
        orderBy: { occurredAt: "desc" },
        take: 10,
        select: { title: true, content: true },
      },
    },
  });

  if (!goal) return new Response("Not Found", { status: 404 });

  const entriesText =
    goal.entries.length > 0
      ? goal.entries
          .map((e) => `- ${e.title ?? "기록"}: ${(e.content ?? "").slice(0, 200)}`)
          .join("\n")
      : "아직 기록이 없습니다.";

  const progressText = goal.targetValue
    ? `진척도: ${goal.currentValue ?? 0} / ${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ""}`
    : "";

  const prompt = `목표: ${goal.title}
설명: ${goal.description ?? "없음"}
현재 상태: ${goal.status}
${progressText}

최근 기록:
${entriesText}

위 목표와 기록을 바탕으로 지금 당장 실행할 수 있는 구체적인 다음 할 일 3가지를 한국어로 제안해 주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"suggestions": ["할 일 1", "할 일 2", "할 일 3"]}`;

  try {
    const raw = await callAI([{ role: "user", content: prompt }]);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "parse_error" }, { status: 500 });
    }
    const parsed = JSON.parse(match[0]) as { suggestions?: string[] };
    return Response.json({ suggestions: parsed.suggestions ?? [] });
  } catch (e) {
    if (e instanceof AiKeyError) {
      return Response.json({ error: "api_key_invalid" }, { status: 503 });
    }
    return Response.json({ error: "ai_error" }, { status: 500 });
  }
}
