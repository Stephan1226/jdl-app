"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type Cell = { date: string; count: number; dow: number };
type Hover = { date: string; count: number; x: number; y: number };

/** 기록 수 → 잔디 색 단계 (0=빈칸, 1~4 진해짐). */
function levelClass(count: number): string {
  if (count <= 0) return "bg-black/[.06] dark:bg-white/[.07]";
  if (count === 1) return "bg-accent/30";
  if (count === 2) return "bg-accent/50";
  if (count === 3) return "bg-accent/75";
  return "bg-accent";
}

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * GitHub 잔디형 기록 히트맵. 한 해를 통째로(주=열, 요일=행) 깐다.
 * 칸은 컨테이너 폭에 맞춰 늘고 줄어 **가로 스크롤이 생기지 않는다**(스크롤바로 인한 높이 흔들림 방지).
 * 여러 해 데이터가 있으면 연도 탭으로 과거도 보고, 칸에 호버하면 그날 기록 수가 뜬다.
 * 현재 연도는 오늘까지만 활성 — 미래 칸은 잠금 표시된다.
 */
export function ContributionHeatmap({
  dayCounts,
  years,
}: {
  dayCounts: Record<string, number>;
  years: number[];
}) {
  const [year, setYear] = useState(years[0]);
  const [hover, setHover] = useState<Hover | null>(null);

  const { weeks, monthLabels, activeDays, total } = useMemo(() => {
    const cells: Cell[] = [];
    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      const key = `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      cells.push({ date: key, count: dayCounts[key] ?? 0, dow: d.getDay() });
      d.setDate(d.getDate() + 1);
    }

    const weeks: (Cell | null)[][] = [];
    let week: (Cell | null)[] = new Array(7).fill(null);
    for (const c of cells) {
      week[c.dow] = c;
      if (c.dow === 6) {
        weeks.push(week);
        week = new Array(7).fill(null);
      }
    }
    if (week.some((c) => c !== null)) weeks.push(week);

    const monthLabels = weeks.map((w, i) => {
      const first = w.find((c) => c !== null);
      if (!first) return "";
      const month = Number(first.date.slice(5, 7)) - 1;
      const prev = weeks[i - 1]?.find((c) => c !== null);
      const prevMonth = prev ? Number(prev.date.slice(5, 7)) - 1 : -1;
      return month !== prevMonth ? MONTHS[month] : "";
    });

    const activeDays = cells.filter((c) => c.count > 0).length;
    const total = cells.reduce((s, c) => s + c.count, 0);
    return { weeks, monthLabels, activeDays, total };
  }, [year, dayCounts]);

  const fmtDate = (key: string) => {
    const [y, m, dd] = key.split("-").map(Number);
    return `${y}년 ${m}월 ${dd}일`;
  };

  return (
    <div className="space-y-3">
      {years.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                y === year
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-black/[.04] dark:hover:bg-white/[.05]"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* 월 라벨 — 각 주 열과 같은 폭(flex-1)으로 맞추고, 글자는 옆 빈 열로 넘쳐 보이게 */}
      <div className="flex gap-[2px]">
        {monthLabels.map((m, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[10px] text-muted"
          >
            {m}
          </div>
        ))}
      </div>

      {/* 잔디 — 폭에 맞춰 칸이 늘고 줄어 가로 스크롤이 없다 */}
      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-[2px]">
            {week.map((cell, di) =>
              cell === null ? (
                <div key={di} className="aspect-square w-full" />
              ) : (
                <div
                  key={di}
                  className={`aspect-square w-full rounded-[2px] ${levelClass(cell.count)}`}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setHover({
                      date: cell.date,
                      count: cell.count,
                      x: r.left + r.width / 2,
                      y: r.top,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {year}년 · {activeDays}일 기록, 총 {total}개
        </span>
        <span className="flex items-center gap-1">
          적음
          <span className="h-3 w-3 rounded-[2px] bg-black/[.06] dark:bg-white/[.07]" />
          <span className="h-3 w-3 rounded-[2px] bg-accent/30" />
          <span className="h-3 w-3 rounded-[2px] bg-accent/50" />
          <span className="h-3 w-3 rounded-[2px] bg-accent/75" />
          <span className="h-3 w-3 rounded-[2px] bg-accent" />
          많음
        </span>
      </div>

      {/* 툴팁은 body로 포털 → 카드 레이아웃에 전혀 영향 주지 않음 */}
      {hover &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: hover.x, top: hover.y - 8 }}
          >
            <span className="font-semibold">
              {hover.count > 0 ? `기록 ${hover.count}개` : "기록 없음"}
            </span>
            <span className="text-muted"> · {fmtDate(hover.date)}</span>
          </div>,
          document.body,
        )}
    </div>
  );
}
