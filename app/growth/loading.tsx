import { HeaderSkeleton, Skeleton } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
