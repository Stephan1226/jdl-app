import superjson from "superjson";

/**
 * 클라이언트 useQuery용 fetch 헬퍼.
 * 라우트 핸들러가 superjson.stringify로 보내므로 여기서 superjson.parse로 되돌린다
 * → Prisma의 Date 등이 문자열이 아니라 진짜 객체로 복원된다.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`요청 실패 (${res.status})`);
  }
  return superjson.parse<T>(await res.text());
}
