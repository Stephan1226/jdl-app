import "server-only";
import superjson from "superjson";
import { getOptionalUser } from "@/lib/user";

/**
 * 라우트 핸들러 응답 직렬화. superjson으로 보내 Date 등을 보존한다
 * (클라는 lib/query/fetcher의 fetchJson가 superjson.parse로 역직렬화).
 */
export function sjson(data: unknown): Response {
  return new Response(superjson.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * 라우트 핸들러용 인증. 미인증이면 null을 돌려주고, 핸들러는 401을 반환한다.
 * (페이지의 getCurrentUserId는 /login으로 redirect하지만, fetch에는 401이 적절.)
 * 인가는 호출부에서 이 userId로 Prisma 쿼리를 스코프해 IDOR을 막는다.
 */
export async function requireUserId(): Promise<string | null> {
  const user = await getOptionalUser();
  return user?.id ?? null;
}
