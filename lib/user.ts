import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * 인증/유저 진입점(DAL — Data Access Layer).
 *
 * jdl은 인증을 Supabase Auth에, 데이터를 Prisma에 둔 하이브리드다.
 * 여기서 Supabase 세션의 유저를 **같은 id(Supabase UUID)로 Prisma User에 upsert**해 브리지한다.
 * 덕분에 기존 데이터 계층(모든 쿼리의 userId 스코프)과 호출부는 그대로 동작한다.
 *
 * 멀티유저 전환의 단일 지점: 페이지/액션은 여전히 getCurrentUser()/getCurrentUserId()만 부른다.
 * React cache()로 한 요청 안에서는 Supabase 조회·upsert가 1회로 메모이즈된다.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metaName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";

  return prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email ?? undefined },
    create: {
      id: user.id, // = Supabase auth UUID (브리지 키)
      email: user.email ?? `${user.id}@no-email.local`,
      name: metaName || user.email?.split("@")[0] || "사용자",
    },
  });
});

export async function getCurrentUserId() {
  return (await getCurrentUser()).id;
}

/**
 * 비보호 영역(layout/AppShell 등)용. 미인증이어도 리다이렉트하지 않고 null을 반환한다.
 * Prisma 조회 없이 세션 유저 정보만 가볍게 돌려준다.
 */
export const getOptionalUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});
