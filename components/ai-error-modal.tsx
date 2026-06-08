"use client";

import { X } from "lucide-react";
import { Card, primaryButton } from "@/components/ui";

export function AiErrorModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <Card className="space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI 서비스 오류</h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted">
            AI 기능을 현재 사용할 수 없습니다.{" "}
            <strong className="text-foreground">관리자에게 문의해 주세요.</strong>
          </p>
          <button onClick={onClose} className={primaryButton}>
            확인
          </button>
        </Card>
      </div>
    </div>
  );
}
