"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { AiErrorModal } from "@/components/ai-error-modal";
import { Card } from "@/components/ui";
import { ghostButton, primaryButton } from "@/components/ui";

/** 서버에서 주입하는 캐시된 제안(없으면 null). */
export type InitialGoalSuggestions = {
  suggestions: string[];
  stale: boolean;
} | null;

type State = "idle" | "loading" | "done" | "error";

export function GoalSuggestions({
  goalId,
  initial,
}: {
  goalId: string;
  initial: InitialGoalSuggestions;
}) {
  const hasCache = initial !== null;
  const [state, setState] = useState<State>(hasCache ? "done" : "idle");
  const [suggestions, setSuggestions] = useState<string[]>(
    initial?.suggestions ?? [],
  );
  const [stale, setStale] = useState(initial?.stale ?? false);
  const [showError, setShowError] = useState(false);

  async function regenerate() {
    setState("loading");
    try {
      const res = await fetch(`/api/goals/${goalId}/suggestions`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        suggestions?: string[];
        error?: string;
      };
      if (data.error) {
        setState("error");
        setShowError(true);
        return;
      }
      setSuggestions(data.suggestions ?? []);
      setStale(false);
      setState("done");
    } catch {
      setState("error");
      setShowError(true);
    }
  }

  const loading = state === "loading";
  const showList = state === "done" && suggestions.length > 0;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI 다음 할 일 제안</h2>
          <button
            onClick={regenerate}
            disabled={loading}
            className={showList ? ghostButton : primaryButton}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "분석 중..." : showList ? "다시 제안" : "다음 할 일 제안"}
          </button>
        </div>

        {showList && stale && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <p className="text-sm text-foreground/80">
              새 기록이 추가됐어요. 새 기록에 맞춘 제안을 다시 받을까요?
            </p>
            <button onClick={regenerate} disabled={loading} className={primaryButton}>
              <RefreshCw className="h-4 w-4" /> 다시 제안
            </button>
          </div>
        )}

        {showList && (
          <Card>
            <p className="mb-3 text-xs text-muted">
              AI가 목표와 기록을 분석해 제안한 다음 할 일입니다.
            </p>
            <ol className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      {showError && <AiErrorModal onClose={() => setShowError(false)} />}
    </>
  );
}
