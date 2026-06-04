import { HeaderSkeleton, ListSkeleton, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton action />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <ListSkeleton count={5} />
    </div>
  );
}
