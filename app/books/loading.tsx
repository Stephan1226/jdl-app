import { CardGridSkeleton, HeaderSkeleton, Skeleton } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <Card className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-full" />
      </Card>
      <CardGridSkeleton count={4} />
    </div>
  );
}
