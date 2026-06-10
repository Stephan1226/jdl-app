"use client";

import { Check, Trash2, X } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { dangerButton, ghostButton } from "@/components/ui";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/** 목록 일괄 선택 상태 — 카드를 꾹 누르면 start(id)로 진입, exit()로 종료 */
export function useBulkSelect() {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const start = useCallback((id?: string) => {
    setActive(true);
    setSelected(new Set(id ? [id] : []));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setSelected(new Set());
  }, []);

  return { active, selected, start, toggle, setAll, exit };
}

/**
 * 카드 래퍼 — 꾹 누르면(500ms) onLongPress, 선택 모드에서는 클릭이
 * 내부 링크 이동 대신 onToggle로 흡수된다. 10px 이상 움직이면 스크롤로
 * 판단하고 롱프레스를 취소한다.
 */
export function SelectableItem({
  selectionMode,
  selected,
  onLongPress,
  onToggle,
  children,
  className = "",
}: {
  selectionMode: boolean;
  selected: boolean;
  onLongPress: () => void;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false); // 롱프레스 직후 따라오는 click을 무시하는 플래그

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }

  function handlePointerDown(e: ReactPointerEvent) {
    if (e.button !== 0) return; // 좌클릭·터치만
    fired.current = false;
    origin.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      fired.current = true;
      navigator.vibrate?.(10);
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!origin.current || !timer.current) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) cancel();
  }

  function handleClickCapture(e: ReactMouseEvent) {
    if (fired.current) {
      // 롱프레스를 끝낸 클릭 — 링크 이동·토글 모두 막는다
      e.preventDefault();
      e.stopPropagation();
      fired.current = false;
      return;
    }
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }
  }

  return (
    <div
      className={`relative rounded-2xl [-webkit-touch-callout:none] ${
        selectionMode ? "select-none" : ""
      } ${selected ? "ring-2 ring-accent" : ""} ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onClickCapture={handleClickCapture}
      onContextMenu={(e) => {
        // 터치 롱프레스의 기본 컨텍스트 메뉴가 선택 모드를 방해하지 않게
        if (selectionMode || fired.current || timer.current) e.preventDefault();
      }}
    >
      {children}
      {selectionMode && (
        <span
          aria-hidden
          className={`absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm transition ${
            selected
              ? "border-accent bg-accent text-accent-fg"
              : "border-border bg-card"
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      )}
    </div>
  );
}

/** 선택 모드 하단 고정 툴바 — 개수 · 전체 선택/해제 · 삭제 · 종료 */
export function SelectionToolbar({
  count,
  total,
  unit,
  confirmMessage,
  onToggleAll,
  onDelete,
  onExit,
}: {
  count: number;
  total: number;
  unit: string;
  confirmMessage: string;
  onToggleAll: () => void;
  onDelete: () => Promise<void>;
  onExit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const allSelected = total > 0 && count === total;

  return (
    <div className="fixed inset-x-0 bottom-5 z-20 px-4">
      <div className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
        <span className="whitespace-nowrap px-1 text-sm font-medium">
          {count}
          {unit} 선택
        </span>
        <button type="button" className={ghostButton} onClick={onToggleAll}>
          {allSelected ? "전체 해제" : "전체 선택"}
        </button>
        <button
          type="button"
          className={dangerButton}
          disabled={count === 0 || pending}
          onClick={() => {
            if (!window.confirm(confirmMessage)) return;
            startTransition(async () => {
              await onDelete();
            });
          }}
        >
          <Trash2 className="h-4 w-4" />
          {pending ? "삭제 중…" : "삭제"}
        </button>
        <button
          type="button"
          aria-label="선택 모드 종료"
          className={`${ghostButton} px-2.5`}
          onClick={onExit}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
