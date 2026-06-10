import { z } from "zod";

/**
 * jdl 도메인 어휘.
 * SQLite는 Prisma enum을 지원하지 않으므로 DB에는 String으로 저장하고,
 * 허용값/라벨/검증은 모두 이 파일에서 단일하게 관리한다.
 */

/** 기록 종류 */
export const ENTRY_TYPES = ["BOOK", "THOUGHT", "NOTE", "GOAL_LOG"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  BOOK: "독후감",
  THOUGHT: "생각",
  NOTE: "노트",
  GOAL_LOG: "목표 기록",
};
export const ENTRY_TYPE_EMOJI: Record<EntryType, string> = {
  BOOK: "📖",
  THOUGHT: "💭",
  NOTE: "📝",
  GOAL_LOG: "🎯",
};

/** 출처 — 흩어진 기록을 어디서 모았는지 (파편화 통합의 핵심) */
export const ENTRY_SOURCES = ["MANUAL", "PAPER", "NOTE_APP", "EXTERNAL"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];
export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  MANUAL: "직접 작성",
  PAPER: "종이",
  NOTE_APP: "노트 앱",
  EXTERNAL: "외부 서비스",
};

/** 목표 상태 */
export const GOAL_STATUSES = ["ACTIVE", "ACHIEVED", "PAUSED", "ABANDONED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: "진행 중",
  ACHIEVED: "달성",
  PAUSED: "보류",
  ABANDONED: "중단",
};

/** 감정/생각 톤 — 시각화용 (-2..2) */
export const MOOD_OPTIONS = [
  { value: 2, label: "아주 좋음", emoji: "😄" },
  { value: 1, label: "좋음", emoji: "🙂" },
  { value: 0, label: "보통", emoji: "😐" },
  { value: -1, label: "별로", emoji: "🙁" },
  { value: -2, label: "힘듦", emoji: "😞" },
] as const;

export function moodMeta(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return MOOD_OPTIONS.find((m) => m.value === value) ?? null;
}

export function isEntryType(v: string): v is EntryType {
  return (ENTRY_TYPES as readonly string[]).includes(v);
}

/** 폼에서 넘어온 빈 문자열을 undefined로 변환 */
const blank = (v: unknown) =>
  v === null || (typeof v === "string" && v.trim() === "") ? undefined : v;

const numberOrUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const dateOrUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : new Date(v as string);

/** 기록 작성/수정 입력 검증 */
export const entryInputSchema = z.object({
  type: z.enum(ENTRY_TYPES),
  title: z.preprocess(blank, z.string().trim().max(200).optional()),
  content: z.string().default(""),
  source: z.enum(ENTRY_SOURCES).default("MANUAL"),
  sourceRef: z.preprocess(blank, z.string().trim().max(1000).optional()),
  mood: z.preprocess(numberOrUndefined, z.number().int().min(-2).max(2).optional()),
  occurredAt: z.preprocess(dateOrUndefined, z.date().optional()),
  bookId: z.preprocess(blank, z.string().optional()),
  goalId: z.preprocess(blank, z.string().optional()),
  tags: z.array(z.string().trim().min(1)).default([]),
});
export type EntryInput = z.infer<typeof entryInputSchema>;

/** 목표 작성/수정 입력 검증 */
export const goalInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요").max(200),
  description: z.preprocess(blank, z.string().trim().max(2000).optional()),
  status: z.enum(GOAL_STATUSES).default("ACTIVE"),
  targetValue: z.preprocess(numberOrUndefined, z.number().int().min(0).optional()),
  currentValue: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
    z.number().int().min(0).default(0),
  ),
  unit: z.preprocess(blank, z.string().trim().max(20).optional()),
  targetDate: z.preprocess(dateOrUndefined, z.date().optional()),
});
export type GoalInput = z.infer<typeof goalInputSchema>;

/** 일괄 삭제 등 id 배열 입력 검증 */
export const idListSchema = z.array(z.string().min(1)).min(1).max(500);

/** 책 작성 입력 검증 */
export const bookInputSchema = z.object({
  title: z.string().trim().min(1, "책 제목을 입력해 주세요").max(300),
  author: z.preprocess(blank, z.string().trim().max(200).optional()),
  isbn: z.preprocess(blank, z.string().trim().max(30).optional()),
  coverUrl: z.preprocess(blank, z.string().trim().max(1000).optional()),
  totalPages: z.preprocess(numberOrUndefined, z.number().int().min(0).optional()),
});
export type BookInput = z.infer<typeof bookInputSchema>;
