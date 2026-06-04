<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# jdl — PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-04
**Commit:** 0710aa0
**Branch:** fix/new-entry-back-button

## OVERVIEW
흩어진 개인 기록(독서·생각·목표)을 한 곳에 모으는 서비스. Next.js 16 + React 19 + TypeScript. Supabase Auth + Prisma 7(Postgres).

## STRUCTURE
```
.
├── app/              # Next.js App Router (pages · API · actions)
├── components/       # React UI components (flat)
├── lib/              # DB · auth · domain · query layer
├── prisma/           # schema.prisma · migrations · seed.mts
├── proxy.ts          # Next 16 세션 갱신·라우트 보호 (구 middleware)
└── public/           # 정적 자산
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 페이지/레이아웃 | `app/` | App Router, RSC 기본, `-view.tsx` 분리 |
| 서버 액션 | `app/{도메인}/actions.ts` | `"use server"`, 각 도메인별 1개 |
| API 라우트 | `app/api/{도메인}/route.ts` | dashboard·books·entries·goals·insights·search |
| DB 클라이언트 | `lib/db.ts` | Prisma 7 + @prisma/adapter-pg |
| 인증/유저 DAL | `lib/user.ts` | Supabase JWT → Prisma User 브리지 |
| Supabase SSR | `lib/supabase/server.ts` | 서버 컴포넌트/액션용 |
| 도메인 상수·검증 | `lib/domain.ts` | type/source/status 허용값 + Zod |
| 데이터 쿼리 | `lib/data/` | 도메인별 데이터 액세스 |
| React Query | `lib/query/` | client · fetcher · query keys |
| UI 컴포넌트 | `components/` | app-shell · cards · forms · charts |
| 세션/라우트 보호 | `proxy.ts` | Next 16: middleware → proxy |
| DB 스키마 | `prisma/schema.prisma` | 모든 모델에 userId, String enum |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `prisma` | Var | `lib/db.ts` | 전역 캐시된 PrismaClient |
| `getCurrentUserId` | Fn | `lib/user.ts` | 보호 페이지/액션의 userId |
| `getCurrentUser` | Fn | `lib/user.ts` | 유저 데이터(JWT 기반, DB 없음) |
| `getOptionalUser` | Fn | `lib/user.ts` | layout용, 미인증 시 null |
| `ensureUserRecord` | Fn | `lib/user.ts` | Supabase → Prisma User upsert |
| `proxy` | Fn | `proxy.ts` | 세션 갱신 + 미인증 리다이렉트 |
| `entryInputSchema` | Zod | `lib/domain.ts` | 기록 작성/수정 검증 |
| `goalInputSchema` | Zod | `lib/domain.ts` | 목표 작성/수정 검증 |
| `bookInputSchema` | Zod | `lib/domain.ts` | 책 작성 검증 |

## CONVENTIONS
- **paths: `@/*` → `./*`** — tsconfig 별칭, 루트 기준 임포트.
- **DB enum 대신 String + `lib/domain.ts`** — Postgres enum 없이 허용값·라벨·Zod를 코드에서 단일 관리.
- **Prisma 7 드라이버 어댑터** — `lib/db.ts`의 `PrismaPg`(`DATABASE_URL`=풀드 6543). 마이그레이션/CLI는 `prisma.config.ts`의 `DIRECT_URL`(다이렉트 5432).
- **인증 = Supabase Auth + Prisma 하이브리드** — `lib/user.ts`가 JWT 클레임으로 신원 확인, `ensureUserRecord`로 Prisma User 브리지(인증 진입점에서만).
- **모든 쿼리·뮤테이션 `userId` 스코프** — 읽기/수정/삭제 전부 `where: { id, userId }`(IDOR 방지).
- **DB 읽는 페이지 = `export const dynamic = "force-dynamic"`** — 캐싱 회피.
- **데이터 변경 후 `revalidatePath` + `redirect`** — Server Action 종료 패턴.
- **`.mts` 강제** — `prisma/seed.mts`는 ESM(생성된 클라이언트가 ESM).

## ANTI-PATTERNS (THIS PROJECT)
- **절대 `ensureUserRecord`를 페이지 로드에서 호출하지 마세요** — 오직 `app/auth/actions.ts`(login/signup)와 `app/auth/confirm/route.ts`에서 1회.
- **절대 Prisma 클라이언트를 요청마다 새로 만들지 마세요** — `lib/db.ts`가 전역 캐시.
- **쿼리에서 `userId`를 빠뜨리지 마세요** — 모든 find/update/delete는 `userId` 포함.
- **Postgres enum을 쓰지 마세요** — `String` 컬럼 + `lib/domain.ts` 관리.
- **`middleware.ts`를 만들지 마세요** — Next 16에서는 `proxy.ts`를 쓴다.
- **Server Action에서 뮤테이션 후 `redirect`를 빠뜨리지 마세요** — `revalidatePath`와 함께.

## UNIQUE STYLES
- **`-view.tsx` 병렬 배치** — 비동기 `page.tsx`가 데이터를 prefetch하고, 동기 UI는 같은 폭더의 `*-view.tsx`에 둔다.
- **`loading.tsx` 병렬 배치** — 모든 목록/상세/폼 폭더에 `loading.tsx`를 둔다.
- **도메인별 `actions.ts`** — `app/entries/actions.ts`, `app/books/actions.ts` 등. `"use server"` 한 파일.

## COMMANDS
```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # prisma generate && next build
npm run lint         # ESLint

# DB
npm run db:migrate   # prisma migrate dev (DIRECT_URL 필요)
npm run db:seed      # tsx ./prisma/seed.mts
npm run db:reset     # migrate reset --force --skip-seed && seed
npm run db:studio    # Prisma Studio
```

## NOTES
- `.env`의 DB URL 비밀번호에 `$`가 있으면 `%24`로 인코딩 — Next `@next/env`가 `$`를 변수 확장.
- 데모 로그인: `me@jdl.app` / `jdl-demo-1234`
- 클라이언트 임포트 경로: `@/app/generated/prisma/client`
- `proxy.ts`의 matcher가 정적 자산을 제외한 모든 경로에 동작 — API 경로 포함.
