"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AiErrorModal } from "@/components/ai-error-modal";
import { Card } from "@/components/ui";
import { ghostButton, primaryButton } from "@/components/ui";

type State = "idle" | "loading" | "done" | "error";

export function GoalSuggestions({ goalId }: { goalId: string }) {
  const [state, setState] = useState<State>("idle");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  async function fetchSuggestions() {
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
      setState("done");
    } catch {
      setState("error");
      setShowError(true);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">AI 다음 할 일 제안</h2>
          <button
            onClick={fetchSuggestions}
            disabled={state === "loading"}
            className={state === "done" ? ghostButton : primaryButton}
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {state === "loading"
              ? "분석 중..."
              : state === "done"
                ? "다시 제안"
                : "다음 할 일 제안"}
          </button>
        </div>

        {state === "done" && suggestions.length > 0 && (
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
