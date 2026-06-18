import { HeaderSkeleton } from "@/components/skeletons";
import { PageLoader } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton action />
      <PageLoader />
    </div>
  );
}
