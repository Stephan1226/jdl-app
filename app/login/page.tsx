"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { Card, inputClass, labelClass, primaryButton } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight">
          jdl<span className="text-accent">.</span>
        </span>
        <p className="mt-1 text-sm text-muted">흩어진 기록을 한 곳에</p>
      </div>

      <Card>
        <h1 className="text-lg font-semibold">로그인</h1>
        <form action={action} className="mt-5 space-y-4">
          <div>
            <label className={labelClass} htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`${primaryButton} w-full`}
          >
            {pending ? "로그인 중…" : "로그인"}
          </button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
