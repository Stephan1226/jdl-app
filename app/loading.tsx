import {
  HeaderSkeleton,
  ListSkeleton,
  Skeleton,
  StatGridSkeleton,
} from "@/components/skeletons";

// 대시보드(/) 로딩 스켈레톤. loading.js는 page를 <Suspense>로 감싸
// 데이터가 스트리밍되는 동안 즉시 보여진다 — 소프트 네비게이션 체감 속도의 핵심.
export default function Loading() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton action />
      <StatGridSkeleton />
      <section className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Skeleton className="h-6 w-24" />
          <ListSkeleton count={3} />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-6 w-24" />
          <ListSkeleton count={2} />
        </div>
      </section>
    </div>
  );
}
