"use client";

import { useFormStatus } from "react-dom";
import { inputClass, labelClass, primaryButton } from "@/components/ui";
import { GOAL_STATUS_LABELS, GOAL_STATUSES } from "@/lib/domain";

export type GoalFormDefaults = {
  title?: string;
  description?: string;
  status?: string;
  targetValue?: number | null;
  currentValue?: number;
  unit?: string;
  targetDate?: string; // yyyy-MM-dd
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButton} disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

export function GoalForm({
  action,
  defaults,
  submitLabel = "저장",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: GoalFormDefaults;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="title">
          목표
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          className={inputClass}
          placeholder="예: 2026년 책 12권 읽기"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          설명 <span className="font-normal text-muted">(선택)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaults?.description ?? ""}
          className={inputClass}
          placeholder="왜 이 목표를 세웠는지, 어떻게 이룰지"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="currentValue">
            현재
          </label>
          <input
            id="currentValue"
            name="currentValue"
            type="number"
            min={0}
            defaultValue={defaults?.currentValue ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="targetValue">
            목표치 <span className="font-normal text-muted">(선택)</span>
          </label>
          <input
            id="targetValue"
            name="targetValue"
            type="number"
            min={0}
            defaultValue={defaults?.targetValue ?? ""}
            className={inputClass}
            placeholder="12"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="unit">
            단위 <span className="font-normal text-muted">(선택)</span>
          </label>
          <input
            id="unit"
            name="unit"
            defaultValue={defaults?.unit ?? ""}
            className={inputClass}
            placeholder="권, 회, 편"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="status">
            상태
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? "ACTIVE"}
            className={inputClass}
          >
            {GOAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {GOAL_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="targetDate">
            목표일 <span className="font-normal text-muted">(선택)</span>
          </label>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            defaultValue={defaults?.targetDate ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
