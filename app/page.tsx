import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getDashboardData } from "@/lib/data/dashboard";
import { getQueryClient } from "@/lib/query/client";
import { qk } from "@/lib/query/keys";
import { getCurrentUser } from "@/lib/user";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: qk.dashboard,
    queryFn: () => getDashboardData(user.id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView userName={user.name} />
    </HydrationBoundary>
  );
}
