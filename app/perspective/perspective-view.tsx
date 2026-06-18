"use client";

import { useState } from "react";
import {
  ArrowRight,
  Eye,
  History,
  Lightbulb,
  Loader2,
  Scale,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { AiErrorModal } from "@/components/ai-error-modal";
import { ThinkingRadar } from "@/components/thinking-radar";
import {
  Card,
  EmptyState,
  PageHeader,
  primaryButton,
  ghostButton,
} from "@/components/ui";
import type { ProfileAxis } from "@/lib/growth";

type Lenses = {
  echo: string;
  counterpoint: string;
  blindspots: string[];
  bridge: string;
};
type Forgotten = { id: string; title: string | null } | null;
type State = "idle" | "loading" | "done" | "error";

export function PerspectiveView({
  entryCount,
  axes,
}: {
  entryCount: number;
  axes: ProfileAxis[];
}) {
  const [state, setState] = useState<State>("idle");
  const [lenses, setLenses] = useState<Lenses | null>(null);
  const [forgotten, setForgotten] = useState<Forgotten>(null);
  const [showError, setShowError] = useState(false);

  async function run() {
    setState("loading");
    try {
      const res = await fetch("/api/perspective", { method: "POST" });
      const data = (await res.json()) as {
        lenses?: Lenses;
        forgotten?: Forgotten;
        error?: string;
      };
      if (data.error || !data.lenses) {
        setState("error");
        setShowError(true);
        return;
      }
      setLenses(data.lenses);
      setForgotten(data.forgotten ?? null);
      setState("done");
    } catch {
      setState("error");
      setShowError(true);
    }
  }

  if (entryCount === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="다른 시야"
          description="내 기록을 근거로, 내가 보지 못한 각도를 비춰봅니다."
        />
        <EmptyState
          title="아직 비춰볼 기록이 없어요"
          description="기록이 쌓이면 AI가 당신의 사고가 쏠린 방향과 놓친 관점을 짚어줍니다."
          action={
            <Link href="/entries/new" className={primaryButton}>
              첫 기록 쓰기
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="다른 시야"
          description="개인 기록은 같은 관심사·관점으로 쏠리기 쉽습니다. AI가 내 기록을 근거로 놓친 각도를 비춥니다."
          action={
            <button
              onClick={run}
              disabled={state === "loading"}
              className={state === "done" ? ghostButton : primaryButton}
            >
              {state === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {state === "loading"
                ? "비추는 중..."
                : state === "done"
                  ? "다시 비추기"
                  : "다른 시야로 보기"}
            </button>
          }
        />

        {/* 사고 프로필 육각형 — 항상 보이는 결정적 지표 */}
        <Card>
          <h2 className="text-sm font-semibold text-muted">내 사고 프로필</h2>
          <p className="mt-1 mb-2 text-xs text-muted">
            기록을 6개 영역으로 나눠 본 균형. 좁은 쪽이 내가 덜 비춘 각도예요.
          </p>
          <ThinkingRadar axes={axes} />
        </Card>

        {state === "idle" && (
          <EmptyState
            title="AI로 더 깊이 들여다보기"
            description="위 프로필을 바탕으로, 반복하는 관점을 비추고 반대 시각과 한 번도 던지지 않은 질문을 제안합니다. 버튼을 눌러보세요."
          />
        )}

        {state === "loading" && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="text-sm text-muted">기록 속 사고의 결을 읽는 중...</p>
          </div>
        )}

        {state === "done" && lenses && (
          <div className="space-y-4">
            {lenses.echo && (
              <LensCard icon={Eye} title="거울 — 지금 당신의 시야">
                <p className="text-sm leading-relaxed">{lenses.echo}</p>
              </LensCard>
            )}

            {lenses.counterpoint && (
              <LensCard icon={Scale} title="반대 관점">
                <p className="text-sm leading-relaxed">{lenses.counterpoint}</p>
              </LensCard>
            )}

            {lenses.blindspots.length > 0 && (
              <LensCard icon={Lightbulb} title="사각지대 — 던져보지 않은 질문">
                <ul className="space-y-2.5">
                  {lenses.blindspots.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </LensCard>
            )}

            {lenses.bridge && (
              <LensCard icon={History} title="재발견 — 잊고 있던 기록">
                <p className="text-sm leading-relaxed">{lenses.bridge}</p>
                {forgotten && (
                  <Link
                    href={`/entries/${forgotten.id}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    {forgotten.title ?? "그 기록 보기"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </LensCard>
            )}

            <p className="px-1 text-xs text-muted">
              AI가 당신의 기록을 분석해 생성한 관점입니다. 정답이 아니라, 한 번 더 생각해볼 거리예요.
            </p>
          </div>
        )}
      </div>

      {showError && <AiErrorModal onClose={() => setShowError(false)} />}
    </>
  );
}

function LensCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-accent">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </Card>
  );
}
