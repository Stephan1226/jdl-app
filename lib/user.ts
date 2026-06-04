import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * 인증/유저 진입점(DAL — Data Access Layer).
 *
 * jdl은 인증을 Supabase Auth에, 데이터를 Prisma에 둔 하이브리드다.
 * 신원 확인은 getClaims()로 한다 — Supabase에서 **비대칭 JWT 서명키**를 켜면
 * JWT를 네트워크 왕복 없이 로컬 검증한다(대칭/HS256이면 내부적으로 getUser()로 폴백 = 네트워크 1회).
 * 따라서 서명키 전환 시 페이지/액션의 신원 확인은 DB·네트워크 0회가 된다.
 *
 * Prisma User 브리지(같은 id로 upsert)는 **인증 진입점에서 1회만** 한다:
 * app/auth/actions.ts(login·signup), app/auth/confirm/route.ts(이메일 확인). 페이지 로드마다 쓰지 않는다.
 *
 * 멀티유저 전환의 단일 지점: 페이지/액션은 여전히 getCurrentUserId()만 부른다.
 * getSessionClaims는 React cache()로 한 요청 안에서 1회로 메모이즈된다(layout + page가 공유).
 */

type SessionClaims = {
  sub: string;
  email?: string;
  user_metadata?: { name?: unknown } | null;
};

/** 세션 JWT의 검증된 클레임. 미인증이면 null. 한 요청 내 1회 메모이즈. */
const getSessionClaims = cache(async (): Promise<SessionClaims | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return data.claims;
});

/** 보호 페이지/액션의 멀티유저 스코프 키. 미인증이면 /login으로. */
export async function getCurrentUserId(): Promise<string> {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  return claims.sub;
}

/** 표시용 유저(대시보드 인사말 등). 이름은 JWT user_metadata에서 — DB 조회 없음. */
export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string | null;
}> {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  return {
    id: claims.sub,
    name: displayName(claims.user_metadata, claims.email),
    email: claims.email ?? null,
  };
}

/** 비보호 영역(layout/AppShell 등)용. 미인증이어도 리다이렉트하지 않고 null. */
export async function getOptionalUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const claims = await getSessionClaims();
  return claims ? { id: claims.sub, email: claims.email ?? null } : null;
}

/**
 * Supabase 세션 유저를 Prisma User에 보장(브리지 키 = Supabase auth UUID).
 * **인증 진입점에서만** 호출한다 — 로그인/가입/이메일확인 시 1회. 모든 페이지 로드가 아님.
 */
export async function ensureUserRecord(user: {
  id: string;
  email?: string | null;
  user_metadata?: { name?: unknown } | null;
}): Promise<void> {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email ?? undefined },
    create: {
      id: user.id,
      email: user.email ?? `${user.id}@no-email.local`,
      name: displayName(user.user_metadata, user.email),
    },
  });
}

function displayName(
  metadata: { name?: unknown } | null | undefined,
  email: string | null | undefined,
): string {
  const metaName = typeof metadata?.name === "string" ? metadata.name.trim() : "";
  return metaName || email?.split("@")[0] || "사용자";
}
