"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * 진짜 "뒤로 가기" — 고정 링크가 아니라 온 곳으로 돌아간다.
 * 직접 URL 진입 등 앱 내 히스토리가 없으면 fallback 경로로 보낸다.
 */
export function BackButton({
  fallback = "/",
  label = "뒤로",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
