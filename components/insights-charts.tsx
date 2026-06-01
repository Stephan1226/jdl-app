"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;

type Pt = { month: string; count: number };
type MoodPt = { month: string; mood: number | null };
type Slice = { name: string; value: number; color?: string | null };

function ChartCard({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h3 className="mb-4 text-sm font-medium text-muted">{title}</h3>
      {children}
    </div>
  );
}

export function InsightsCharts({
  monthly,
  moodTrend,
  typeCounts,
  sourceCounts,
  topTags,
}: {
  monthly: Pt[];
  moodTrend: MoodPt[];
  typeCounts: Slice[];
  sourceCounts: Slice[];
  topTags: Slice[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="월별 기록 수">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-border)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-border)" />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="count" name="기록" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="감정 추이 (월 평균)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={moodTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-border)" />
            <YAxis
              domain={[-2, 2]}
              ticks={[-2, -1, 0, 1, 2]}
              tick={{ fontSize: 12 }}
              stroke="var(--color-border)"
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="mood"
              name="평균 감정"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="종류 분포">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={typeCounts}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={2}
            >
              {typeCounts.map((d, i) => (
                <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="출처 분포 (어디서 모았나)">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={sourceCounts}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={2}
            >
              {sourceCounts.map((d, i) => (
                <Cell key={d.name} fill={PALETTE[(i + 2) % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="자주 쓰는 태그" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={Math.max(160, topTags.length * 36)}>
          <BarChart
            data={topTags}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-border)" />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fontSize: 12 }}
              stroke="var(--color-border)"
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="value" name="기록 수" radius={[0, 6, 6, 0]}>
              {topTags.map((d, i) => (
                <Cell key={d.name} fill={d.color ?? PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
