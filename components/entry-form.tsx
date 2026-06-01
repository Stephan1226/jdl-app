"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { inputClass, labelClass, primaryButton } from "@/components/ui";
import {
  ENTRY_SOURCE_LABELS,
  ENTRY_SOURCES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
  MOOD_OPTIONS,
} from "@/lib/domain";

type Option = { id: string; title: string };

export type EntryFormDefaults = {
  type?: string;
  title?: string;
  content?: string;
  source?: string;
  sourceRef?: string;
  mood?: number | null;
  occurredAt?: string; // yyyy-MM-dd
  bookId?: string | null;
  goalId?: string | null;
  tags?: string[];
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButton} disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

export function EntryForm({
  action,
  books,
  goals,
  allTags,
  defaults,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  books: Option[];
  goals: Option[];
  allTags: string[];
  defaults?: EntryFormDefaults;
  submitLabel?: string;
}) {
  const [type, setType] = useState(defaults?.type ?? "THOUGHT");

  return (
    <form action={action} className="space-y-5">
      <div>
        <span className={labelClass}>종류</span>
        <div className="flex flex-wrap gap-2">
          {ENTRY_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ${
                type === t
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              {ENTRY_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="title">
          제목 <span className="font-normal text-muted">(선택)</span>
        </label>
        <input
          id="title"
          name="title"
          defaultValue={defaults?.title ?? ""}
          className={inputClass}
          placeholder="한 줄 제목"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="content">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={defaults?.content ?? ""}
          rows={8}
          className={inputClass}
          placeholder="무엇이든 기록해 보세요…"
        />
      </div>

      {type === "BOOK" && (
        <div>
          <label className={labelClass} htmlFor="bookId">
            책
          </label>
          <select
            id="bookId"
            name="bookId"
            defaultValue={defaults?.bookId ?? ""}
            className={inputClass}
          >
            <option value="">— 책 선택 안 함 —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            목록에 없으면 독서 메뉴에서 책을 먼저 추가하세요.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="occurredAt">
            날짜
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="date"
            defaultValue={defaults?.occurredAt ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="mood">
            그날의 감정 <span className="font-normal text-muted">(선택)</span>
          </label>
          <select
            id="mood"
            name="mood"
            defaultValue={defaults?.mood?.toString() ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {MOOD_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="source">
            출처
          </label>
          <select
            id="source"
            name="source"
            defaultValue={defaults?.source ?? "MANUAL"}
            className={inputClass}
          >
            {ENTRY_SOURCES.map((s) => (
              <option key={s} value={s}>
                {ENTRY_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="goalId">
            연결할 목표 <span className="font-normal text-muted">(선택)</span>
          </label>
          <select
            id="goalId"
            name="goalId"
            defaultValue={defaults?.goalId ?? ""}
            className={inputClass}
          >
            <option value="">— 연결 안 함 —</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="sourceRef">
          원본 링크/위치 <span className="font-normal text-muted">(선택)</span>
        </label>
        <input
          id="sourceRef"
          name="sourceRef"
          defaultValue={defaults?.sourceRef ?? ""}
          className={inputClass}
          placeholder="https://…  ·  notion://…  ·  노트 12쪽"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="tags">
          태그 <span className="font-normal text-muted">(쉼표로 구분)</span>
        </label>
        <input
          id="tags"
          name="tags"
          defaultValue={(defaults?.tags ?? []).join(", ")}
          className={inputClass}
          placeholder="성장, 회고"
          list="tag-suggestions"
        />
        <datalist id="tag-suggestions">
          {allTags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="flex gap-2 pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
