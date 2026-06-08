"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AiErrorModal } from "@/components/ai-error-modal";
import { ghostButton, primaryButton } from "@/components/ui";

type BookRec = { title: string; reason: string };
type State = "idle" | "loading" | "done" | "no-entries" | "error";

export function BookRecommendations() {
  const [state, setState] = useState<State>("idle");
  const [recs, setRecs] = useState<BookRec[]>([]);
  const [showError, setShowError] = useState(false);

  async function fetchRecs() {
    setState("loading");
    try {
      const res = await fetch("/api/books/recommendations");
      const data = (await res.json()) as {
        recommendations?: BookRec[];
        noEntries?: boolean;
        error?: string;
      };
      if (data.error) {
        setState("error");
        setShowError(true);
        return;
      }
      if (data.noEntries) {
        setState("no-entries");
        return;
      }
      setRecs(data.recommendations ?? []);
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
          <h2 className="text-lg font-semibold">지금 읽으면 좋을 책</h2>
          <button
            onClick={fetchRecs}
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
                ? "다시 추천"
                : "AI 추천 받기"}
          </button>
        </div>

        {state === "no-entries" && (
          <p className="text-sm text-muted">
            생각·메모 기록을 더 쌓으면 맞춤 도서 추천을 받을 수 있어요.
          </p>
        )}

        {state === "done" && recs.length > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border overflow-hidden">
            {recs.map((r, i) => (
              <div key={i} className="px-5 py-5 space-y-0.5">
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-muted">{r.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showError && <AiErrorModal onClose={() => setShowError(false)} />}
    </>
  );
}
