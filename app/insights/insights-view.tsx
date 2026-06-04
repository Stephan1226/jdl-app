"use client";

import { useQuery } from "@tanstack/react-query";
import { InsightsCharts } from "@/components/insights-charts";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import type { InsightsData } from "@/lib/data/insights";
import { fetchJson } from "@/lib/query/fetcher";
import { qk } from "@/lib/query/keys";

export function InsightsView() {
  const { data } = useQuery({
    queryKey: qk.insights,
    queryFn: () => fetchJson<InsightsData>("/api/insights"),
  });
  if (!data) return null;

  if (data.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="인사이트"
          description="기록을 모아 흐름과 패턴을 들여다봅니다."
        />
        <EmptyState
          title="아직 보여줄 데이터가 없어요"
          description="기록을 쌓으면 시간에 따른 흐름이 보입니다."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="인사이트"
        description="흩어진 기록을 모아 시간에 따른 흐름과 패턴을 들여다봅니다."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="전체 기록" value={data.total} />
        <StatCard label="기록한 개월 수" value={data.monthCount} />
        <StatCard
          label="평균 감정"
          value={
            data.avgMood !== null
              ? `${data.avgMoodEmoji ?? ""} ${data.avgMood.toFixed(1)}`
              : "—"
          }
        />
        <StatCard label="태그 수" value={data.tagCount} />
      </div>

      <InsightsCharts
        monthly={data.monthly}
        moodTrend={data.moodTrend}
        typeCounts={data.typeCounts}
        sourceCounts={data.sourceCounts}
        topTags={data.topTags}
      />
    </div>
  );
}
