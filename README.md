# jdl

> 흩어진 개인 기록을 한 곳에. 독서·생각·목표 기록을 **모으고 · 정리/검색하고 · 시각화해 인사이트를 얻고 · 목표로 이어가는** 개인 기록 서비스.

책을 읽고 남긴 독후감이 종이에도, 노트 앱에도, 외부 서비스에도 흩어져 있습니다. jdl은 이렇게 파편화된 기록을 하나의 환경에서 관리하도록 돕습니다.

## 네 개의 기둥

1. **통합 기록** — 독서·생각·노트·목표 기록을 한 곳에. 각 기록은 *출처(직접/종이/노트앱/외부서비스)* 를 가져서 어디서 모았는지 추적됩니다.
2. **정리 & 검색** — 태그·종류·출처·기간·전문(제목/내용) 검색.
3. **인사이트 시각화** — 월별 기록량, 감정 추이, 종류·출처 분포, 자주 쓰는 태그.
4. **목표 관리** — 목표 설정 → 기록 연결 → 진행도/상태 추적.

### 핵심 설계: "모든 것은 기록(Entry)"

네 기둥은 따로 노는 기능이 아니라 **하나의 `Entry`** 위에 얹힌 레이어입니다. 기록 하나에 *내용 · 출처 · 시점 · 종류 · 감정 · 책/목표 연결 · 태그* 가 붙고, 검색·시각화·목표는 그 데이터를 다른 각도로 비춥니다. 그래서 나중에 "운동 기록", "여행 기록" 같은 종류를 추가해도 구조가 흔들리지 않습니다.

## 기술 스택

- **Next.js 16** (App Router · React Server Components · Server Actions · Turbopack)
- **React 19** / **TypeScript**
- **Tailwind CSS v4**
- **Supabase** — 인증(Supabase Auth · `@supabase/ssr`) · DB(Postgres)
- **Prisma 7** + **@prisma/adapter-pg** 드라이버 어댑터
- **recharts** (시각화) · **zod** (검증) · **date-fns** (날짜) · **lucide-react** (아이콘)

## 빠른 시작

```bash
npm install
cp .env.example .env        # Supabase URL/키 + DATABASE_URL(풀드)·DIRECT_URL(다이렉트) 채우기
npm run db:migrate          # 스키마 → Supabase Postgres (DIRECT_URL 사용)
npm run db:seed             # 데모 유저(me@jdl.app) + 데모 데이터 (책 3 · 기록 12 · 목표 3 · 태그 5)
npm run dev                 # http://localhost:3000
```

> `.env` 값은 `.env.example` 참고. **DB URL 비밀번호에 `$`가 있으면 `%24`로 인코딩**하세요 — Next의 `@next/env`가 `$`를 변수로 확장합니다. 데모 로그인: `me@jdl.app` / `jdl-demo-1234`.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` / `start` | 프로덕션 빌드 / 실행 |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | 시드 데이터 주입 (`prisma/seed.mts`) |
| `npm run db:reset` | DB 리셋 후 재시드 |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

## 프로젝트 구조

```
app/
  page.tsx              대시보드
  login/ · signup/      인증 페이지
  auth/                 인증 액션(actions.ts) · 이메일 확인(confirm/route.ts)
  entries/              기록 CRUD (목록·작성·상세·수정 + actions.ts)
  books/                독서 (목록·상세 + actions.ts)
  goals/                목표 CRUD + actions.ts
  search/               검색
  insights/             인사이트(시각화)
  generated/prisma/     Prisma 7 생성 클라이언트 (gitignore)
components/             app-shell · ui · badges · 폼 · 카드 · 차트
lib/
  db.ts                 Prisma 클라이언트 (@prisma/adapter-pg → Supabase Postgres)
  supabase/server.ts    Supabase 서버 클라이언트 (쿠키 세션)
  user.ts               현재 유저(DAL) — Supabase 세션 ↔ Prisma User 브리지
  domain.ts             종류/출처/상태 상수 · 라벨 · Zod 스키마 (단일 출처)
  queries.ts · format.ts · entry-data.ts
proxy.ts                세션 갱신 + 라우트 보호 (Next 16: 구 middleware)
prisma/
  schema.prisma · seed.mts · migrations/
```

## 데이터 모델

`User` → `Book` · `Entry` · `Tag` · `Goal` (모든 데이터는 `userId`로 스코프)
- `User.id`는 **Supabase Auth 유저 UUID와 동일** — 로그인 시 `lib/user.ts`에서 upsert로 브리지.
- `Entry` — 중심 단위. `bookId`(독후감), `goalId`(목표 연결), `tags`(다대다), `source`/`mood`/`occurredAt`.
- 책/목표 삭제 시 연결된 기록은 `SetNull`로 **보존**됩니다.

## 설계 메모 (이어서 개발할 때)

- **`type`/`source`/`status`는 `String`** (Postgres enum 대신). 허용값·라벨·검증은 전부 `lib/domain.ts`에서 관리(단일 출처).
- **Prisma 7 드라이버 어댑터** → 런타임 연결은 `lib/db.ts`의 `PrismaPg`(`DATABASE_URL`=풀드 6543). 마이그레이션/CLI는 `prisma.config.ts`의 `DIRECT_URL`(다이렉트 5432). 클라이언트는 `app/generated/prisma`로 생성(import: `@/app/generated/prisma/client`).
- **인증 = Supabase Auth(멀티유저)** — `lib/user.ts`의 `getCurrentUser()`가 Supabase 세션 유저를 같은 id로 Prisma `User`에 upsert해 브리지. 페이지/액션은 `getCurrentUserId()`만 호출. 세션 갱신·보호는 루트 `proxy.ts`(Next 16에서 구 `middleware`).
- **인가** — 모든 쿼리·뮤테이션을 `userId`로 스코프(읽기·수정·삭제 전부, IDOR 방지).
- **시드는 `.mts`** — 생성된 클라이언트가 ESM이라 ESM으로 강제해야 함. service role 키로 데모 유저 생성.
- **`.env` 주의** — DB URL 비밀번호의 `$`는 `%24`로 인코딩(Next `@next/env`의 `$` 변수 확장 회피).
- DB를 읽는 페이지는 `export const dynamic = "force-dynamic"`.

## 로드맵 (다음 단계 후보)

- [x] 인증 / 멀티유저 — Supabase Auth + Prisma 하이브리드
- [ ] 외부 기록 가져오기(import) — `source`/`sourceRef` 활용 (노션·Goodreads 등)
- [ ] 마크다운 리치 에디터
- [ ] 목표 진행도 자동 집계(연결된 기록 기반)
- [ ] 배포 (Vercel 등) — DB는 이미 Supabase Postgres
