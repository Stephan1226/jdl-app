import { requireUserId } from "@/lib/api";
import { getPerspectiveDigest } from "@/lib/data/perspective";
import { AiKeyError, callAI } from "@/lib/openrouter";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const d = await getPerspectiveDigest(userId);
  if (d.total === 0) {
    return Response.json({ error: "no_entries" }, { status: 400 });
  }

  const bridgeBlock = d.forgottenText
    ? `\n\n[오래 묵힌 기록 — 재발견 재료]\n${d.forgottenText}`
    : "";
  const bridgeField = d.forgottenText
    ? `,\n  "bridge": "위 '오래 묵힌 기록'을 사용자의 최근 관심사와 연결하는 1~2문장. 잊고 있던 생각을 다시 꺼낼 이유를 짚어줄 것"`
    : "";

  const prompt = `당신은 한 사람의 개인 기록을 분석해 **그 사람이 스스로 보지 못하는 각도**를 비춰주는 조력자입니다.
개인 기록은 본질적으로 같은 관심사·관점·감정으로 쏠리기 쉽습니다(에코챔버).
당신의 역할은 동의나 요약이 아니라, 시야를 넓히는 것입니다.

[종류 분포] ${d.typeSummary || "없음"}
[출처 분포] ${d.sourceSummary || "없음"}
[자주 쓴 태그] ${d.tagSummary}

[최근 기록]
${d.recentText}${bridgeBlock}

위 기록을 바탕으로 한국어로 답하세요. 부드럽지만 솔직하게, 사용자를 한 단계 밀어주는 톤으로.
반드시 아래 JSON 형식으로만 응답하세요(다른 텍스트 없이):
{
  "echo": "거울: 이 사람의 기록이 어떤 주제·관점·감정으로 쏠려 있는지 자각하게 하는 1~2문장",
  "counterpoint": "반대 관점: 최근 기록 중 하나를 골라, 그와 다른/반대되는 관점을 설득력 있게 2~3문장으로 제시(허수아비 아닌 가장 강한 반대 논리)",
  "blindspots": ["사용자가 한 번도 다루지 않았지만 탐구해볼 만한 질문 3개를 각각 한 문장으로"]${bridgeField}
}`;

  try {
    const raw = await callAI([{ role: "user", content: prompt }]);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: "parse_error" }, { status: 500 });

    const parsed = JSON.parse(match[0]) as {
      echo?: string;
      counterpoint?: string;
      blindspots?: string[];
      bridge?: string;
    };

    return Response.json({
      lenses: {
        echo: parsed.echo ?? "",
        counterpoint: parsed.counterpoint ?? "",
        blindspots: Array.isArray(parsed.blindspots) ? parsed.blindspots : [],
        bridge: parsed.bridge ?? "",
      },
      forgotten: d.forgotten,
    });
  } catch (e) {
    if (e instanceof AiKeyError) {
      return Response.json({ error: "api_key_invalid" }, { status: 503 });
    }
    return Response.json({ error: "ai_error" }, { status: 500 });
  }
}
