import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getSearchData, type SearchParams } from "@/lib/data/search";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { SearchView } from "./search-view";

const KEYS = ["q", "type", "source", "tag", "from", "to"] as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const userId = await getCurrentUserId();

  // page와 view가 동일한 params 객체를 만들도록 키 순서를 고정.
  const params: Record<string, string> = {};
  for (const k of KEYS) {
    const v = sp[k];
    if (v) params[k] = v;
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.search(params),
    queryFn: () => getSearchData(userId, params as SearchParams),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchView params={params} />
    </HydrationBoundary>
  );
}
