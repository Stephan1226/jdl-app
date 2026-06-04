import { HeaderSkeleton, ListSkeleton, Skeleton } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <Card className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
      <ListSkeleton count={4} />
    </div>
  );
}
