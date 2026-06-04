# app/ — Next.js App Router

## STRUCTURE
```
app/
├── page.tsx                    # 대시보드
├── layout.tsx                  # 루트 레이아웃 (AppShell · Providers)
├── providers.tsx               # React Query Provider
├── login/ · signup/            # 인증 페이지
├── auth/                       # 인증 액션(actions.ts) · 이메일 확인(confirm/route.ts)
├── api/                        # API 라우트 (books·entries·goals·insights·search·dashboard)
├── entries/                    # 기록 CRUD (index·new·[id]·[id]/edit + actions.ts)
├── books/                      # 독서 (index·[id] + actions.ts)
├── goals/                      # 목표 CRUD (index·new·[id]·[id]/edit + actions.ts)
├── search/                     # 검색 페이지
└── insights/                   # 인사이트 시각화
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 신규 도메인 추가 | `app/{도메인}/` | `(index)/page.tsx`, `new/page.tsx`, `[id]/page.tsx` 패턴 따르기 |
| 서버 액션 | `app/{도메인}/actions.ts` | `"use server"` 한 파일, 뮤테이션 + revalidatePath + redirect |
| API 엔드포인트 | `app/api/{도메인}/route.ts` | GET handler, userId 스코프 필수 |
| 로딩 상태 | `{경로}/loading.tsx` | 목록·상세·폼 모두에 병렬 배치 |
| 클라이언트 UI | `{경로}/*-view.tsx` | async page.tsx가 prefetch, view가 렌더링 |

## CONVENTIONS
- **`-view.tsx` 분리** — `page.tsx`는 async 서버 컴포넌트로 데이터 prefetch, UI는 같은 폭더의 `*-view.tsx`에.
- **`loading.tsx` 병렬** — `(index)/`, `[id]/`, `new/`, `[id]/edit/` 모두 `loading.tsx` 포함.
- **DB 읽는 페이지 = `force-dynamic`** — `export const dynamic = "force-dynamic"` 필수.
- **도메인별 `actions.ts`** — `entries/actions.ts`, `books/actions.ts`, `goals/actions.ts`. 각각 `"use server"`.
- **액션 종료 패턴** — 뮤테이션 후 `revalidatePath("/entries")` → `redirect(\`/entries/\${id}\`)`.
- **API 라우트 = `route.ts`** — `app/api/{도메인}/route.ts`, GET만. 인증은 `getCurrentUserId()`.

## ANTI-PATTERNS
- **`ensureUserRecord`를 여기서 호출 금지** — 오직 `app/auth/actions.ts`와 `app/auth/confirm/route.ts`.
- **페이지에서 직접 Prisma 쿼리하지 마세요** — `lib/data/`나 `lib/queries.ts`를 거쳐라.
- **`middleware.ts` 금지** — Next 16에서는 `proxy.ts`(루트)를 쓴다.
