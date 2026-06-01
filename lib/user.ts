import { prisma } from "@/lib/db";

/**
 * jdl은 현재 단일 사용자 서비스다. seed로 만든 기본 사용자를 사용한다.
 * 멀티유저로 확장할 때는 이 헬퍼만 세션 기반으로 바꾸면 나머지 코드는 그대로 둘 수 있다.
 */
export const DEFAULT_USER_EMAIL = "me@jdl.app";

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
  });
  if (!user) {
    throw new Error(
      "기본 사용자가 없습니다. `npm run db:seed`로 시드 데이터를 먼저 넣어 주세요.",
    );
  }
  return user;
}

export async function getCurrentUserId() {
  return (await getCurrentUser()).id;
}
