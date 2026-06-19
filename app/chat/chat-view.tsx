"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Loader2, Plus, SendHorizonal, Sparkles, X } from "lucide-react";
import { AiErrorModal } from "@/components/ai-error-modal";
import { MarkdownMessage } from "@/components/markdown-message";
import { PageHeader, ghostButton } from "@/components/ui";

type Msg = { role: "user" | "assistant"; content: string };
type Session = { id: string; messages: Msg[] };
type Store = { sessions: Session[]; activeId: string };

const STORAGE_KEY = "jdl-chat-v1";
const EMPTY: Store = { sessions: [], activeId: "" };

const SUGGESTIONS = [
  "내 기록을 보면 요즘 내 관심사가 뭐야?",
  "최근에 내가 자주 한 생각을 요약해줘",
  "지금 내가 놓치고 있는 게 있을까?",
];

/* ── localStorage 외부 스토어 ───────────────────────────────────────────
   대화는 DB가 아닌 이 브라우저에만 저장한다. useSyncExternalStore로 구독해
   SSR(빈 스냅샷)과 하이드레이션 불일치 없이 읽고, 변경은 writeStore로 반영한다. */
let cacheRaw: string | null = null;
let cache: Store = EMPTY;
const listeners = new Set<() => void>();

function readSnapshot(): Store {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache; // 스냅샷 참조 안정화(React 요구사항)
  cacheRaw = raw;
  try {
    cache = raw ? (JSON.parse(raw) as Store) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function getServerSnapshot(): Store {
  return EMPTY;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // 다른 탭의 변경도 반영
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function writeStore(next: Store) {
  cache = next;
  cacheRaw = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, cacheRaw);
  listeners.forEach((l) => l());
}

function update(fn: (s: Store) => Store) {
  writeStore(fn(readSnapshot()));
}

/** 기존 세션과 겹치지 않는 다음 id(시간/난수 없이 결정적). */
function nextId(sessions: Session[]) {
  const max = sessions.reduce((m, s) => {
    const n = Number(s.id.replace(/\D/g, ""));
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, -1);
  return `s${max + 1}`;
}

const sessionTitle = (s: Session) =>
  s.messages.find((m) => m.role === "user")?.content.slice(0, 20) || "새 대화";

export function ChatView() {
  const store = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);
  const { sessions, activeId } = store;
  const active = sessions.find((s) => s.id === activeId);
  const messages = active?.messages ?? [];

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showError, setShowError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  function newChat() {
    update((s) => {
      // 빈 세션이 이미 있으면 새로 만들지 않고 그곳으로 전환(빈 세션 누적 방지).
      const existingEmpty = s.sessions.find((x) => x.messages.length === 0);
      if (existingEmpty) return { ...s, activeId: existingEmpty.id };
      const id = nextId(s.sessions);
      return { sessions: [{ id, messages: [] }, ...s.sessions], activeId: id };
    });
    setInput("");
  }

  function selectSession(id: string) {
    update((s) => ({ ...s, activeId: id }));
  }

  function deleteSession(id: string) {
    update((s) => {
      const remaining = s.sessions.filter((x) => x.id !== id);
      if (remaining.length === 0) return EMPTY;
      return {
        sessions: remaining,
        activeId: id === s.activeId ? remaining[0].id : s.activeId,
      };
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // 활성 세션 확보(없으면 즉석 생성).
    const cur = readSnapshot();
    let aid = cur.activeId;
    let act = cur.sessions.find((s) => s.id === aid);
    let sessionsBase = cur.sessions;
    if (!act) {
      aid = nextId(cur.sessions);
      act = { id: aid, messages: [] };
      sessionsBase = [act, ...cur.sessions];
    }
    const base = act.messages;
    const next = [...base, { role: "user" as const, content: trimmed }];

    writeStore({
      sessions: sessionsBase.map((s) => (s.id === aid ? { ...s, messages: next } : s)),
      activeId: aid,
    });
    setInput("");
    setSending(true);

    const rollback = () =>
      update((s) => ({
        ...s,
        sessions: s.sessions.map((x) => (x.id === aid ? { ...x, messages: base } : x)),
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.error || !data.reply) {
        rollback();
        setInput(trimmed);
        setShowError(true);
        return;
      }
      const reply = data.reply;
      update((s) => ({
        ...s,
        sessions: s.sessions.map((x) =>
          x.id === aid ? { ...x, messages: [...next, { role: "assistant", content: reply }] } : x,
        ),
      }));
    } catch {
      rollback();
      setInput(trimmed);
      setShowError(true);
    } finally {
      setSending(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <>
      {/* 전체 높이를 채우는 세로 플렉스 — 입력 바를 항상 하단에 고정한다. */}
      <div className="flex min-h-[calc(100dvh-12rem)] flex-col gap-4 md:min-h-[calc(100dvh-5rem)]">
        <div className="shrink-0 space-y-4">
          <PageHeader
            title="기록 채팅"
            description="내 모든 기록을 근거로 무엇이든 물어보세요. (대화는 이 브라우저에만 저장돼요)"
            action={
              <button onClick={newChat} className={ghostButton}>
                <Plus className="h-4 w-4" /> 새 채팅
              </button>
            }
          />

          {sessions.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sessions.map((s) => {
                const on = s.id === activeId;
                return (
                  <div
                    key={s.id}
                    className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
                      on
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-card text-foreground/70 hover:border-accent/30"
                    }`}
                  >
                    <button
                      onClick={() => selectSession(s.id)}
                      className="max-w-[10rem] truncate"
                    >
                      {sessionTitle(s)}
                    </button>
                    <button
                      onClick={() => deleteSession(s.id)}
                      aria-label="세션 삭제"
                      className="text-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 메시지 영역 — 남는 공간을 채워 입력 바를 바닥으로 밀어낸다. */}
        {empty ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-accent" />
              <p className="mt-3 text-base font-medium">무엇이 궁금하세요?</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                쌓아온 기록을 바탕으로 답해드려요. 예시로 시작해 보세요.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground/80 transition hover:border-accent/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "whitespace-pre-wrap bg-accent text-accent-fg"
                      : "border border-border bg-card"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> 기록을 살펴보는 중...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="sticky bottom-4 flex shrink-0 items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="기록에 대해 무엇이든 물어보세요…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={sending || input.trim() === ""}
            aria-label="보내기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition hover:opacity-90 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>

      {showError && <AiErrorModal onClose={() => setShowError(false)} />}
    </>
  );
}
