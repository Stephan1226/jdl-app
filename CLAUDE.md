@AGENTS.md

# jdl — 프로젝트 규칙

흩어진 개인 기록(독서·생각·목표)을 한 곳에 모으는 서비스. 자세한 내용은 [README](README.md).

핵심 설계: **모든 것은 `Entry`**. 검색·시각화·목표는 Entry 데이터를 다른 각도로 비추는 레이어.

코드 작성 시 주의:

- **SQLite는 Prisma enum 미지원.** `type`/`source`/`status`는 `String` 컬럼이고, 허용값·라벨·검증은 전부 `lib/domain.ts`(상수 + Zod)에서 관리한다. 새 값/종류는 여기부터 추가.
- **Prisma 7 = 드라이버 어댑터 방식.** 런타임 클라이언트는 `lib/db.ts`(better-sqlite3 어댑터). 생성물은 `app/generated/prisma`(import: `@/app/generated/prisma/client`).
- 스키마 변경 후 `npm run db:migrate`. 시드는 `prisma/seed.mts`(ESM 필수) — `npm run db:seed`.
- **단일 사용자.** 모든 쿼리는 `getCurrentUserId()`(`lib/user.ts`)로 스코프. 멀티유저 확장 시 이 헬퍼만 교체.
- 데이터 변경(서버 액션)은 `revalidatePath` 후 `redirect`. DB 읽는 페이지는 `force-dynamic`.
- Server Action은 각 도메인 폴더의 `actions.ts`(`"use server"`)에 둔다.
