@AGENTS.md

# GitHub 레포
**레포명: `Stephan1226/jdl-app`** — `gh` CLI 사용 시 항상 `--repo Stephan1226/jdl-app` 옵션을 붙인다.

# jdl — 프로젝트 규칙

흩어진 개인 기록(독서·생각·목표)을 한 곳에 모으는 서비스. 자세한 내용은 [README](README.md).

핵심 설계: **모든 것은 `Entry`**. 검색·시각화·목표는 Entry 데이터를 다른 각도로 비추는 레이어.

코드 작성 시 주의:

- **`type`/`source`/`status`는 `String` 컬럼.** (Postgres enum 대신) 허용값·라벨·검증은 전부 `lib/domain.ts`(상수 + Zod)에서 관리한다. 새 값/종류는 여기부터 추가.
- **DB = Supabase Postgres, Prisma 7 드라이버 어댑터.** 런타임 클라이언트는 `lib/db.ts`(`@prisma/adapter-pg`, `DATABASE_URL`=풀드 6543). 마이그레이션/CLI는 `prisma.config.ts`의 `DIRECT_URL`(다이렉트 5432). 생성물은 `app/generated/prisma`(import: `@/app/generated/prisma/client`).
- 스키마 변경 후 `npm run db:migrate`(`DIRECT_URL` 필요). 시드는 `prisma/seed.mts`(ESM 필수) — `npm run db:seed`. ⚠️ `.env`의 DB URL 비밀번호에 `$`가 있으면 `%24`로 인코딩(Next의 `@next/env`가 `$`를 변수로 확장해 망가뜨림).
- **인증 = Supabase Auth(멀티유저).** `lib/user.ts`의 `getCurrentUser()`가 Supabase 세션 유저를 **같은 id로 Prisma `User`에 upsert**(브리지). 페이지/액션은 `getCurrentUserId()`만 호출 — 이게 멀티유저 진입점. Supabase 서버 클라이언트는 `lib/supabase/server.ts`, 세션 갱신·라우트 보호는 루트 `proxy.ts`(※ Next 16에서 `middleware`→`proxy` 개명, Node 런타임). 인증 액션은 `app/auth/actions.ts`.
- **인가는 앱 코드의 `userId` 스코프.** 읽기는 `findFirst({ where: { id, userId } })`, 수정/삭제도 `userId`를 포함해 남의 데이터 접근 차단(IDOR 방지). 새 쿼리/뮤테이션도 반드시 `userId` 스코프.
- 데이터 변경(서버 액션)은 `revalidatePath` 후 `redirect`. DB 읽는 페이지는 `force-dynamic`. Server Action은 각 도메인 폴더의 `actions.ts`(`"use server"`)에 둔다.

# 검증 절차

사용자에게 검증을 요청할 때는 반드시 아래 순서를 따른다:

1. **`.env` 복사** — 메인 레포의 `.env`를 워크트리로 복사한다.
   ```
   cp /Users/stephankim/projects/graduation/jdl/.env {워크트리 경로}/.env
   ```
2. **Prisma 클라이언트 생성** — 워크트리는 생성물이 없으므로 반드시 먼저 실행한다.
   ```
   cd {워크트리 경로} && npx prisma generate
   ```
3. **개발 서버 실행** — 워크트리 디렉터리에서 백그라운드로 서버를 켠다.
   ```
   cd {워크트리 경로} && npm run dev
   ```
4. **접속 요청** — 사용자에게 `http://localhost:3000` 접속을 요청하고 확인할 경로(예: `/growth`)를 안내한다.
