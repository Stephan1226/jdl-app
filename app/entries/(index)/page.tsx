import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getEntriesData } from "@/lib/data/entries";
import { isEntryType } from "@/lib/domain";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { EntriesView } from "../entries-view";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const userId = await getCurrentUserId();
  const activeType = type && isEntryType(type) ? type : "";

  // 서버에서 미리 가져와 캐시에 심는다 → 첫 화면은 SSR로 즉시(클라 재요청 없음).
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.entries(activeType),
    queryFn: () => getEntriesData(userId, activeType || undefined),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EntriesView activeType={activeType} />
    </HydrationBoundary>
  );
}
