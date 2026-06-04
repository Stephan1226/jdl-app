import { CardGridSkeleton, HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton action />
      <CardGridSkeleton count={4} />
    </div>
  );
}
