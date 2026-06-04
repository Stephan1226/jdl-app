import { HeaderSkeleton, Skeleton, StatGridSkeleton } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-48 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
