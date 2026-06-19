import { HeaderSkeleton, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton />
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-4/5 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
