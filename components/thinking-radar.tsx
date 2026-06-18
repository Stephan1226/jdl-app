"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { ProfileAxis } from "@/lib/growth";

/**
 * 사고 프로필 육각형 레이더. 6개 영역(0~100)의 균형을 한눈에 보여주고,
 * 가장 낮은 영역을 "채워야 할 곳"으로 짚어준다.
 */
export function ThinkingRadar({ axes }: { axes: ProfileAxis[] }) {
  // 낮은 순으로 정렬해 부족한 영역 추출 (60 미만, 최대 3개)
  const weak = [...axes].sort((a, b) => a.value - b.value).filter((a) => a.value < 60).slice(0, 3);
  const avg = Math.round(axes.reduce((s, a) => s + a.value, 0) / axes.length);

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:items-center">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={axes} outerRadius="68%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="space-y-3">
        {weak.length === 0 ? (
          <p className="text-sm leading-relaxed">
            여섯 영역이 고르게 채워져 있어요 (평균 {avg}점). 균형 잡힌 기록 습관이에요. 👏
          </p>
        ) : (
          <>
            <p className="text-sm font-medium">채우면 시야가 넓어지는 영역</p>
            <ul className="space-y-2.5">
              {weak.map((a) => (
                <li key={a.key} className="text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{a.label}</span>
                    <span className="text-xs text-muted">{a.value}점</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{a.tip}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
