"use client";

import { useFormStatus } from "react-dom";

function Inner({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "처리 중…" : label}
    </button>
  );
}

/** 제출 전 confirm()으로 한 번 더 확인하는 버튼 (삭제 등 되돌릴 수 없는 동작용) */
export function ConfirmButton({
  action,
  label,
  message,
  className,
}: {
  action: () => void | Promise<void>;
  label: string;
  message: string;
  className: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <Inner label={label} className={className} />
    </form>
  );
}
