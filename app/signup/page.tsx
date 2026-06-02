"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { Card, inputClass, labelClass, primaryButton } from "@/components/ui";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold tracking-tight">
          jdl<span className="text-accent">.</span>
        </span>
        <p className="mt-1 text-sm text-muted">흩어진 기록을 한 곳에</p>
      </div>

      <Card>
        <h1 className="text-lg font-semibold">회원가입</h1>

        {state?.message ? (
          <p className="mt-4 text-sm leading-relaxed">{state.message}</p>
        ) : (
          <form action={action} className="mt-5 space-y-4">
            <div>
              <label className={labelClass} htmlFor="name">
                이름
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                className={inputClass}
                placeholder="표시할 이름"
              />
            </div>
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
                비밀번호{" "}
                <span className="font-normal text-muted">(8자 이상)</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
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
              {pending ? "가입 중…" : "가입하기"}
            </button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
