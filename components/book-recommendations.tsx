"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { AiErrorModal } from "@/components/ai-error-modal";
import { ghostButton, primaryButton } from "@/components/ui";

export type BookRec = { title: string; reason: string };

/** 서버에서 주입하는 캐시된 추천(없으면 null). */
export type InitialBookRecs = {
  recommendations: BookRec[];
  stale: boolean;
} | null;

type State = "idle" | "loading" | "done" | "no-entries" | "error";

export function BookRecommendations({
  initial,
  hasEntries,
}: {
  initial: InitialBookRecs;
  hasEntries: boolean;
}) {
  const hasCache = initial !== null;
  const [state, setState] = useState<State>(
    hasCache ? "done" : hasEntries ? "idle" : "no-entries",
  );
  const [recs, setRecs] = useState<BookRec[]>(initial?.recommendations ?? []);
  const [stale, setStale] = useState(initial?.stale ?? false);
  const [showError, setShowError] = useState(false);

  async function regenerate() {
    setState("loading");
    try {
      const res = await fetch("/api/books/recommendations", { method: "POST" });
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
      setStale(false);
      setState("done");
    } catch {
      setState("error");
      setShowError(true);
    }
  }

  const loading = state === "loading";
  const showRecs = state === "done" && recs.length > 0;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">지금 읽으면 좋을 책</h2>
          <button
            onClick={regenerate}
            disabled={loading || state === "no-entries"}
            className={showRecs ? ghostButton : primaryButton}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "분석 중..." : showRecs ? "다시 추천" : "AI 추천 받기"}
          </button>
        </div>

        {state === "no-entries" && (
          <p className="text-sm text-muted">
            생각·메모 기록을 더 쌓으면 맞춤 도서 추천을 받을 수 있어요.
          </p>
        )}

        {showRecs && stale && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <p className="text-sm text-foreground/80">
              새 기록이 추가됐어요. 새 기록에 맞춘 추천을 다시 받을까요?
            </p>
            <button onClick={regenerate} disabled={loading} className={primaryButton}>
              <RefreshCw className="h-4 w-4" /> 다시 추천
            </button>
          </div>
        )}

        {showRecs && (
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
