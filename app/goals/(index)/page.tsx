import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getGoalsData } from "@/lib/data/goals";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUserId } from "@/lib/user";
import { GoalsView } from "../goals-view";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await getCurrentUserId();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.goals,
    queryFn: () => getGoalsData(userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GoalsView />
    </HydrationBoundary>
  );
}
