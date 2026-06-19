import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { buildChatContext } from "@/lib/data/chat";
import { AiKeyError, callAI } from "@/lib/openrouter";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * 무상태 채팅. 대화 자체는 브라우저(localStorage)에 저장되므로 서버는 아무것도 영속하지 않는다.
 * 클라가 보낸 대화 + 사용자의 기록 컨텍스트로 답변만 생성해 돌려준다.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  // 토큰 관리를 위해 최근 대화 12개로 제한.
  const history = parsed.data.messages.slice(-12);
  const context = await buildChatContext(userId);

  const system = `당신은 사용자의 개인 기록(독서·생각·메모·목표)을 모두 알고 있는 한국어 비서입니다.
아래 [사용자 기록]만을 근거로 답하세요. 기록에 없는 내용은 지어내지 말고, 모르면 솔직히 모른다고 하세요.
답변은 간결하고 따뜻하게, 가능하면 어떤 기록을 근거로 했는지 짧게 언급하세요.

[사용자 기록]
${context}`;

  const messages = [
    { role: "system" as const, content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const reply = (await callAI(messages)).trim();
    return Response.json({ reply });
  } catch (e) {
    if (e instanceof AiKeyError) {
      return Response.json({ error: "api_key_invalid" }, { status: 503 });
    }
    return Response.json({ error: "ai_error" }, { status: 500 });
  }
}
