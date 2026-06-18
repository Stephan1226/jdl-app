/**
 * 성장(게임화) 도메인 로직 — DB 없이 순수 계산만.
 *
 * 설계 의도: 단순 "기록 수 늘리기"가 아니라 **사고의 다양성**을 보상한다.
 * 개인 기록 서비스는 본질적으로 에코챔버(편향)가 되기 쉬운데, 게임화가
 * 같은 주제·톤의 반복을 보상하면 편향을 오히려 강화한다. 그래서 XP·배지·점수를
 * 종류/출처/감정의 "폭"에 가중치를 둬, 다양한 각도의 기록을 끌어낸다.
 * (시야 기능 lib/data/perspective 와 한 몸 — 한쪽은 다양성을 보상, 한쪽은 견인.)
 */

import { differenceInCalendarDays } from "date-fns";
import { ENTRY_SOURCES, ENTRY_TYPES, MOOD_OPTIONS } from "@/lib/domain";

/** DB에서 모은 원자료 — lib/data/growth.ts가 채운다. */
export type GrowthStats = {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  tagCount: number;
  distinctMoods: number; // 사용한 서로 다른 감정 값의 수 (0..5)
  currentStreak: number;
  longestStreak: number;
  achievedGoals: number;
  activeDays: number; // 기록이 있는 서로 다른 날의 수
};

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  current: number;
  target: number;
  xp: number; // 획득 시 주어지는 보너스 XP
};

/** XP가 어디서 왔는지 — 화면에 그대로 풀어 보여준다. */
export type XpSource = { label: string; detail: string; xp: number };

export type GrowthResult = {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgressPct: number;
  diversity: number; // 0..100, Shannon 엔트로피 기반 사고 다양성
  badges: Badge[];
  xpBreakdown: XpSource[];
};

/**
 * 연속 기록일 계산 — 순수 함수(테스트 위해 today 주입).
 * - 현재 스트릭: 마지막 기록일이 오늘 또는 어제면 살아있다(하루 유예) → 거꾸로 이어지는 날 수.
 * - 최장 스트릭: 전체 기간 중 가장 길게 연속된 날 수.
 * @param dayKeys "yyyy-MM-dd" 형식의 기록일들 (중복 무관)
 */
export function computeStreaks(
  dayKeys: string[],
  today: Date,
): { currentStreak: number; longestStreak: number } {
  const unique = [...new Set(dayKeys)].sort(); // 사전식 = 시간순
  if (unique.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dates = unique.map((d) => new Date(`${d}T00:00:00`));

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = differenceInCalendarDays(dates[i], dates[i - 1]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const last = dates[dates.length - 1];
  let current = 0;
  if (differenceInCalendarDays(today, last) <= 1) {
    current = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      if (differenceInCalendarDays(dates[i], dates[i - 1]) === 1) current++;
      else break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}

/** 레벨 L에 도달하기 위한 누적 XP (삼각수 곡선 ×100). L1=0, L2=100, L3=300, L4=600 ... */
function cumulativeXpForLevel(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

/** 누적 XP → 레벨/레벨 내 진행도. */
function levelFromXp(xp: number) {
  // n(n-1)/2 <= xp/100 를 만족하는 최대 n. 삼각수 역산.
  const x = xp / 100;
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 8 * x)) / 2));
  const base = cumulativeXpForLevel(level);
  const next = cumulativeXpForLevel(level + 1);
  const span = next - base;
  const into = xp - base;
  return {
    level,
    xpIntoLevel: into,
    xpForNextLevel: span,
    levelProgressPct: span > 0 ? Math.round((into / span) * 100) : 0,
  };
}

/**
 * 활동 XP 구성 — 다양성(종류·출처)과 연속성(스트릭), 목표 달성에 가중치를 둔다.
 * "XP가 어디서 왔는지"를 그대로 화면에 보여주려고 항목별로 쪼개 돌려준다.
 */
function activityXpSources(s: GrowthStats): XpSource[] {
  const distinctTypes = ENTRY_TYPES.filter((t) => (s.byType[t] ?? 0) > 0).length;
  const distinctSources = ENTRY_SOURCES.filter(
    (src) => (s.bySource[src] ?? 0) > 0,
  ).length;
  return [
    { label: "기록", detail: `${s.total}개 × 10`, xp: s.total * 10 },
    { label: "태그", detail: `${s.tagCount}개 × 5`, xp: s.tagCount * 5 },
    { label: "종류 다양성", detail: `${distinctTypes}종 × 30`, xp: distinctTypes * 30 },
    { label: "출처 다양성", detail: `${distinctSources}곳 × 30`, xp: distinctSources * 30 },
    { label: "최장 연속", detail: `${s.longestStreak}일 × 20`, xp: s.longestStreak * 20 },
    { label: "목표 달성", detail: `${s.achievedGoals}개 × 100`, xp: s.achievedGoals * 100 },
  ].filter((r) => r.xp > 0);
}

/**
 * 사고 다양성 점수 (0..100). 정보이론의 Shannon 엔트로피로 "한쪽으로 쏠렸는지"를 잰다.
 * - 종류 분포의 정규화 엔트로피(가장 큰 비중): 한 종류만 쓰면 0, 네 종류 고르게 쓰면 1
 * - 출처 커버리지: 흩어진 기록을 얼마나 다양한 곳에서 모았나
 * - 감정 커버리지: 한 가지 톤에만 머무르지 않았나
 */
function diversityScore(s: GrowthStats): number {
  if (s.total === 0) return 0;

  const typeCounts = ENTRY_TYPES.map((t) => s.byType[t] ?? 0).filter((n) => n > 0);
  const sum = typeCounts.reduce((a, b) => a + b, 0);
  let entropy = 0;
  for (const c of typeCounts) {
    const p = c / sum;
    entropy -= p * Math.log2(p);
  }
  // log2(종류 수)로 정규화 → 0..1 (네 종류를 고르게 쓰면 1)
  const maxEntropy = Math.log2(ENTRY_TYPES.length);
  const typeEntropyNorm = maxEntropy > 0 ? entropy / maxEntropy : 0;

  const distinctSources = ENTRY_SOURCES.filter(
    (src) => (s.bySource[src] ?? 0) > 0,
  ).length;
  const sourceCoverage = distinctSources / ENTRY_SOURCES.length;
  const moodCoverage = s.distinctMoods / MOOD_OPTIONS.length;

  return Math.round(
    100 * (0.5 * typeEntropyNorm + 0.25 * sourceCoverage + 0.25 * moodCoverage),
  );
}

function computeBadges(s: GrowthStats, diversity: number): Badge[] {
  const distinctTypes = ENTRY_TYPES.filter((t) => (s.byType[t] ?? 0) > 0).length;
  const distinctSources = ENTRY_SOURCES.filter(
    (src) => (s.bySource[src] ?? 0) > 0,
  ).length;
  const book = s.byType.BOOK ?? 0;
  const thought = s.byType.THOUGHT ?? 0;

  const defs: Omit<Badge, "earned">[] = [
    { id: "first", emoji: "🌱", title: "첫 발자국", description: "첫 기록을 남겼어요", current: s.total, target: 1, xp: 20 },
    { id: "ten", emoji: "📝", title: "기록의 습관", description: "기록 10개를 모았어요", current: s.total, target: 10, xp: 50 },
    { id: "hundred", emoji: "💯", title: "기록 100", description: "기록 100개를 넘겼어요", current: s.total, target: 100, xp: 300 },
    { id: "streak7", emoji: "🔥", title: "일주일 연속", description: "7일 연속 기록했어요", current: s.longestStreak, target: 7, xp: 100 },
    { id: "streak30", emoji: "⚡", title: "한 달 연속", description: "30일 연속 기록했어요", current: s.longestStreak, target: 30, xp: 400 },
    { id: "reader", emoji: "📚", title: "독서가", description: "독후감 5개를 남겼어요", current: book, target: 5, xp: 80 },
    { id: "thinker", emoji: "💭", title: "사색가", description: "생각 10개를 남겼어요", current: thought, target: 10, xp: 80 },
    { id: "achiever", emoji: "🏆", title: "목표 달성가", description: "목표를 달성했어요", current: s.achievedGoals, target: 1, xp: 150 },
    { id: "tagger", emoji: "🏷️", title: "분류왕", description: "태그 10개로 정리했어요", current: s.tagCount, target: 10, xp: 80 },
    // 아래 셋은 편향 해소(다양성)를 보상하는 핵심 배지 — XP도 높게
    { id: "allTypes", emoji: "🌈", title: "다재다능", description: "네 종류의 기록을 모두 남겼어요", current: distinctTypes, target: ENTRY_TYPES.length, xp: 150 },
    { id: "integrator", emoji: "🧭", title: "통합가", description: "3곳 이상의 출처에서 기록을 모았어요", current: distinctSources, target: 3, xp: 150 },
    { id: "openMind", emoji: "🌐", title: "열린 사고", description: "사고 다양성 70점을 넘겼어요", current: diversity, target: 70, xp: 200 },
  ];

  return defs.map((d) => ({ ...d, earned: d.current >= d.target }));
}

/** 원자료 → 화면에 내려줄 성장 결과 전체. */
export function computeGrowth(stats: GrowthStats): GrowthResult {
  const diversity = diversityScore(stats);
  const badges = computeBadges(stats, diversity);

  const activity = activityXpSources(stats);
  const badgeXp = badges.filter((b) => b.earned).reduce((sum, b) => sum + b.xp, 0);
  const xpBreakdown: XpSource[] = [...activity];
  if (badgeXp > 0) {
    const earnedCount = badges.filter((b) => b.earned).length;
    xpBreakdown.push({ label: "배지 보너스", detail: `${earnedCount}개 획득`, xp: badgeXp });
  }
  const xp = xpBreakdown.reduce((sum, r) => sum + r.xp, 0);

  return {
    xp,
    ...levelFromXp(xp),
    diversity,
    badges,
    xpBreakdown,
  };
}

/** 레이더(육각형) 그래프용 사고 프로필 축. */
export type ProfileAxis = { key: string; label: string; value: number; tip: string };

export type ProfileInput = {
  total: number;
  byType: Record<string, number>;
  distinctSources: number;
  distinctMoods: number;
  recentActiveDays: number; // 최근 30일 중 기록한 날 수
  avgContentLength: number; // 기록당 평균 글자 수
  taggedRatio: number; // 태그가 달린 기록의 비율 (0..1)
};

/**
 * 사고 프로필 6축 (각 0..100). "내가 어느 영역이 부족한지"를 한눈에 보여주는 육각형 레이더용.
 * 편향 해소(시야) 페이지의 핵심 — 낮은 축이 곧 채워야 할 사각지대.
 */
export function computeProfile(p: ProfileInput): ProfileAxis[] {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  // 종류 다양성 — Shannon 엔트로피 정규화
  const typeCounts = ENTRY_TYPES.map((t) => p.byType[t] ?? 0).filter((n) => n > 0);
  const sum = typeCounts.reduce((a, b) => a + b, 0);
  let entropy = 0;
  for (const c of typeCounts) {
    const x = c / sum;
    entropy -= x * Math.log2(x);
  }
  const typeNorm = sum > 0 ? entropy / Math.log2(ENTRY_TYPES.length) : 0;

  return [
    { key: "type", label: "종류 다양성", value: clamp(typeNorm * 100), tip: "독후감·생각·노트·목표기록을 골고루 남겨보세요. 한 종류에 치우쳐 있어요." },
    { key: "source", label: "출처 다양성", value: clamp((p.distinctSources / ENTRY_SOURCES.length) * 100), tip: "종이 메모·노트앱 등 다른 곳의 기록도 가져와 보세요." },
    { key: "mood", label: "감정 표현", value: clamp((p.distinctMoods / MOOD_OPTIONS.length) * 100), tip: "기록에 그때의 감정을 함께 남기면 마음의 흐름이 보여요." },
    { key: "consistency", label: "꾸준함", value: clamp((p.recentActiveDays / 15) * 100), tip: "최근 기록이 뜸해요. 짧게라도 자주 남겨보세요." },
    { key: "depth", label: "기록 깊이", value: clamp((p.avgContentLength / 300) * 100), tip: "한 줄을 넘어, 왜 그렇게 느꼈는지 한 문장 더 적어보세요." },
    { key: "organization", label: "정리·연결", value: clamp(p.taggedRatio * 100), tip: "태그를 붙이면 흩어진 기록이 서로 연결돼요." },
  ];
}
