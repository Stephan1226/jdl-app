import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getGrowthData } from "@/lib/data/growth";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { GrowthView } from "./growth-view";

export const dynamic = "force-dynamic";

export default async function GrowthPage() {
  const userId = await getCurrentUserId();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.growth,
    queryFn: () => getGrowthData(userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GrowthView />
    </HydrationBoundary>
  );
}
