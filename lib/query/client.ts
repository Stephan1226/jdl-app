import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";
import superjson from "superjson";

/**
 * 서버/클라 공용 QueryClient 팩토리.
 * - staleTime 60s: 이 시간 안에는 재방문 시 네트워크 없이 캐시로 즉시 표시(= "SPA 체감").
 * - superjson (de)serializeData: Prisma의 Date 등을 하이드레이션 경계 너머로 보존
 *   (라우트 핸들러 fetch 경로의 superjson과 짝을 이뤄, 클라가 항상 진짜 Date를 받게 한다).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** 서버: 요청마다 새 클라이언트. 클라: 탭당 싱글턴(리렌더에도 캐시 유지). */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
