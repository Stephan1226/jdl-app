import "server-only";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "openai/gpt-oss-120b:free";

type Message = { role: "system" | "user" | "assistant"; content: string };

export class AiKeyError extends Error {
  constructor() {
    super("api_key_invalid");
  }
}

export class AiUnavailableError extends Error {
  constructor(status: number) {
    super(`ai_error:${status}`);
  }
}

export async function callAI(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AiKeyError();

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jdl.app",
      "X-Title": "jdl",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new AiKeyError();
    throw new AiUnavailableError(res.status);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}
