import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getInsightsData } from "@/lib/data/insights";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { InsightsView } from "./insights-view";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const userId = await getCurrentUserId();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.insights,
    queryFn: () => getInsightsData(userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InsightsView />
    </HydrationBoundary>
  );
}
