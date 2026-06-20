<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# jdl — PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-20
**Commit:** d7a6f32
**Branch:** main

## OVERVIEW
흩어진 개인 기록(독서·생각·목표)을 한 곳에 모으는 서비스. Next.js 16 + React 19 + TypeScript. Supabase Auth + Prisma 7(Postgres). AI 기능(채팅·추천·인사이트·시야·성장)은 OpenRouter를 통해 제공.

## STRUCTURE
```
.
├── app/              # Next.js App Router (pages · API · actions)
├── components/       # React UI components (flat)
├── lib/              # DB · auth · domain · query · AI layer
├── prisma/           # schema.prisma · migrations · seed.mts
├── proxy.ts          # Next 16 세션 갱신·라우트 보호 (구 middleware)
└── public/           # 정적 자산
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 페이지/레이아웃 | `app/` | App Router, RSC 기본, `-view.tsx` 분리 |
| 서버 액션 | `app/{도메인}/actions.ts` | `"use server"`, 각 도메인별 1개 |
| API 라우트 | `app/api/{도메인}/route.ts` | dashboard·books·entries·goals·insights·search·chat·perspective·growth·books/recommendations·goals/[id]/suggestions |
| DB 클라이언트 | `lib/db.ts` | Prisma 7 + @prisma/adapter-pg |
| 인증/유저 DAL | `lib/user.ts` | Supabase JWT → Prisma User 브리지 |
| Supabase SSR | `lib/supabase/server.ts` | 서버 컴포넌트/액션용 |
| 도메인 상수·검증 | `lib/domain.ts` | type/source/status 허용값 + Zod |
| 데이터 쿼리 | `lib/data/` | books·chat·dashboard·entries·goals·growth·insights·perspective·recommendations·search·search-books |
| React Query | `lib/query/` | client · fetcher · query keys |
| AI 클라이언트 | `lib/openrouter.ts` | OpenRouter API 래퍼 |
| 성장 계산 | `lib/growth.ts` | 잔디·배지·레벨 계산 로직 |
| UI 컴포넌트 | `components/` | app-shell · cards · forms · charts · AI UI · bulk-select |
| 세션/라우트 보호 | `proxy.ts` | Next 16: middleware → proxy |
| DB 스키마 | `prisma/schema.prisma` | 모든 모델에 userId, String enum |

## APP ROUTES
| Route | Description |
|-------|-------------|
| `/` | 대시보드 |
| `/entries` | 기록 목록 (일괄 선택·삭제 지원) |
| `/entries/new` | 기록 작성 |
| `/entries/[id]` | 기록 상세 |
| `/entries/[id]/edit` | 기록 수정 |
| `/books` | 책 목록 (일괄 선택·삭제, 중복 방지) |
| `/books/[id]` | 책 상세 + AI 도서 추천 |
| `/goals` | 목표 목록 |
| `/goals/new` | 목표 작성 |
| `/goals/[id]` | 목표 상세 + AI 다음 액션 제안 |
| `/goals/[id]/edit` | 목표 수정 |
| `/chat` | AI 기록 채팅 (기록 기반 대화) |
| `/insights` | 인사이트 & 분석 차트 |
| `/perspective` | 시야 — 편향 해소 AI |
| `/growth` | 성장 — 잔디·배지·레벨 게임화 UI |
| `/search` | 통합 검색 |

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
| `openrouter` | Fn | `lib/openrouter.ts` | OpenRouter AI API 호출 래퍼 |
| `calcGrowth` | Fn | `lib/growth.ts` | 잔디·배지·레벨 계산 |
| `getRecommendations` | Fn | `lib/data/recommendations.ts` | AI 추천 캐시 조회/갱신 |

## DB MODELS (Prisma)
| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | id, email, name | Supabase Auth ↔ Prisma 브리지 |
| `Entry` | id, userId, type, content, mood, occurredAt, bookId, goalId | 핵심 모델 — 모든 것은 Entry |
| `Book` | id, userId, title, author, isbn, coverUrl, totalPages | isbn 중복 방지 |
| `Tag` | id, userId, name, color | (userId, name) unique |
| `TagsOnEntries` | entryId, tagId, assignedAt | M:N 조인 |
| `Goal` | id, userId, title, status, targetValue, currentValue, unit, startDate, targetDate | status: ACTIVE·ACHIEVED·PAUSED·ABANDONED |
| `Recommendation` | id, userId, kind, goalId, payload(JSON), sourceCount, sourceLatest | AI 추천 캐시; kind: BOOK·GOAL_NEXT_ACTION |

## CONVENTIONS
- **paths: `@/*` → `./*`** — tsconfig 별칭, 루트 기준 임포트.
- **DB enum 대신 String + `lib/domain.ts`** — Postgres enum 없이 허용값·라벨·Zod를 코드에서 단일 관리.
- **Prisma 7 드라이버 어댑터** — `lib/db.ts`의 `PrismaPg`(`DATABASE_URL`=풀드 6543). 마이그레이션/CLI는 `prisma.config.ts`의 `DIRECT_URL`(다이렉트 5432).
- **인증 = Supabase Auth + Prisma 하이브리드** — `lib/user.ts`가 JWT 클레임으로 신원 확인, `ensureUserRecord`로 Prisma User 브리지(인증 진입점에서만).
- **모든 쿼리·뮤테이션 `userId` 스코프** — 읽기/수정/삭제 전부 `where: { id, userId }`(IDOR 방지).
- **DB 읽는 페이지 = `export const dynamic = "force-dynamic"`** — 캐싱 회피.
- **데이터 변경 후 `revalidatePath` + `redirect`** — Server Action 종료 패턴.
- **`.mts` 강제** — `prisma/seed.mts`는 ESM(생성된 클라이언트가 ESM).
- **AI 추천 캐시 stale 판정** — `sourceCount`·`sourceLatest` 비교로 재생성 여부 결정; 직접 AI 호출 전 반드시 캐시 확인.
- **일괄 선택/삭제** — `components/bulk-select.tsx`; entries·books 목록에서 사용.

## ANTI-PATTERNS (THIS PROJECT)
- **절대 `ensureUserRecord`를 페이지 로드에서 호출하지 마세요** — 오직 `app/auth/actions.ts`(login/signup)와 `app/auth/confirm/route.ts`에서 1회.
- **절대 Prisma 클라이언트를 요청마다 새로 만들지 마세요** — `lib/db.ts`가 전역 캐시.
- **쿼리에서 `userId`를 빠뜨리지 마세요** — 모든 find/update/delete는 `userId` 포함.
- **Postgres enum을 쓰지 마세요** — `String` 컬럼 + `lib/domain.ts` 관리.
- **`middleware.ts`를 만들지 마세요** — Next 16에서는 `proxy.ts`를 쓴다.
- **Server Action에서 뮤테이션 후 `redirect`를 빠뜨리지 마세요** — `revalidatePath`와 함께.
- **AI 추천을 캐시 없이 매번 호출하지 마세요** — `lib/data/recommendations.ts`의 캐시 레이어를 반드시 경유.

## UNIQUE STYLES
- **`-view.tsx` 병렬 배치** — 비동기 `page.tsx`가 데이터를 prefetch하고, 동기 UI는 같은 폴더의 `*-view.tsx`에 둔다.
- **`loading.tsx` 병렬 배치** — 모든 목록/상세/폼 폴더에 `loading.tsx`를 둔다.
- **도메인별 `actions.ts`** — `app/entries/actions.ts`, `app/books/actions.ts` 등. `"use server"` 한 파일.
- **AI 응답 스트리밍** — `/api/chat` 등 AI 스트림 엔드포인트는 `ReadableStream` 반환; 클라이언트는 `fetch` + `reader` 패턴.

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

## WORKFLOW (에이전트용)
작업 전 반드시 아래 순서를 따른다:

1. **메인 레포 확인** — `git branch --show-current`로 현재 레포(`jdl`)가 `main` 브랜치인지 확인한다.
   - `main`이 아니면 `git checkout main`으로 이동한다.
2. **풀** — `git pull`로 최신 변경사항을 받는다.
3. **워크트리 생성** — `git worktree`로 메인 레포와 격리된 작업 디렉터리를 만든다.
   - 브랜치명 패턴: `{유형}/{간략한-설명}` (예: `fix/login-error`, `feat/dark-mode`, `refactor/api-layer`)
   - 유형: `fix`(버그), `feat`(기능), `refactor`(리팩터), `chore`(설정/잡일)
   - 명령:
     ```
     git worktree add -b {브랜치명} ../jdl-{유형}-{간략한-설명} HEAD
     ```
     - 브랜치명의 `/`는 디렉터리명에서 `-`로 치환한다.
     - 예: `fix/login-error` → `git worktree add -b fix/login-error ../jdl-fix-login-error HEAD`
   - 생성된 워크트리 디렉터리로 이동하여 작업한다.
4. **작업 시작** — 워크트리 디렉터리에서 작업을 진행한다. (메인 레포는 건드리지 않는다)
5. **완료 후** — 에이전트가 스스로 PR을 만들지 않는다. 대신 **사용자에게 검증 요청**을 보낸다.
6. **PR 생성** — 사용자가 "PR 만들어"라고 명령하면 워크트리 디렉터리에서 푸시 후 `gh pr create`로 PR을 생성한다.
   ```
   git push -u origin {브랜치명}
   gh pr create --title "..."
   ```

## NOTES
- `.env`의 DB URL 비밀번호에 `$`가 있으면 `%24`로 인코딩 — Next `@next/env`가 `$`를 변수 확장.
- 데모 로그인: `me@jdl.app` / `jdl-demo-1234`
- 클라이언트 임포트 경로: `@/app/generated/prisma/client`
- `proxy.ts`의 matcher가 정적 자산을 제외한 모든 경로에 동작 — API 경로 포함.
- `git worktree`로 생성한 작업 디렉터리는 PR 머지 후 `git worktree remove ../jdl-{...}`로 정리한다.
- AI 기능은 환경변수 `OPENROUTER_API_KEY` 필요 — `.env`에 설정.
