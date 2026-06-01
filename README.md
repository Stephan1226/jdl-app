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
- **Prisma 7** + **better-sqlite3** 드라이버 어댑터 / **SQLite**
- **recharts** (시각화) · **zod** (검증) · **date-fns** (날짜) · **lucide-react** (아이콘)

## 빠른 시작

```bash
npm install
cp .env.example .env        # DATABASE_URL 설정
npm run db:migrate          # 스키마 → DB (마이그레이션 적용 + 클라이언트 생성)
npm run db:seed             # 데모 데이터 (책 3 · 기록 12 · 목표 3 · 태그 5)
npm run dev                 # http://localhost:3000
```

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
  entries/              기록 CRUD (목록·작성·상세·수정 + actions.ts)
  books/                독서 (목록·상세 + actions.ts)
  goals/                목표 CRUD + actions.ts
  search/               검색
  insights/             인사이트(시각화)
  generated/prisma/     Prisma 7 생성 클라이언트 (gitignore)
components/             app-shell · ui · badges · 폼 · 카드 · 차트
lib/
  db.ts                 Prisma 클라이언트 (better-sqlite3 어댑터)
  domain.ts             종류/출처/상태 상수 · 라벨 · Zod 스키마 (단일 출처)
  user.ts               단일 사용자 헬퍼 (멀티유저 확장 지점)
  queries.ts · format.ts · entry-data.ts
prisma/
  schema.prisma · seed.mts · migrations/
```

## 데이터 모델

`User` → `Book` · `Entry` · `Tag` · `Goal`
- `Entry` — 중심 단위. `bookId`(독후감), `goalId`(목표 연결), `tags`(다대다), `source`/`mood`/`occurredAt`.
- 책/목표 삭제 시 연결된 기록은 `SetNull`로 **보존**됩니다.

## 설계 메모 (이어서 개발할 때)

- **SQLite는 Prisma enum 미지원** → `type`/`source`/`status`는 `String`. 허용값·라벨·검증은 전부 `lib/domain.ts`에서 관리(단일 출처).
- **Prisma 7은 드라이버 어댑터 방식** → 런타임 연결은 `lib/db.ts`의 `PrismaBetterSqlite3`. 클라이언트는 `app/generated/prisma`로 생성됨(import: `@/app/generated/prisma/client`).
- **시드는 `.mts`** — 생성된 클라이언트가 ESM이라 ESM으로 강제해야 함.
- **단일 사용자** — `lib/user.ts`의 `getCurrentUser()`가 확장 지점. 멀티유저 전환 시 이 함수만 세션 기반으로 바꾸면 됨.
- DB를 읽는 페이지는 `export const dynamic = "force-dynamic"`.

## 로드맵 (다음 단계 후보)

- [ ] 인증 / 멀티유저 (NextAuth 등)
- [ ] 외부 기록 가져오기(import) — `source`/`sourceRef` 활용 (노션·Goodreads 등)
- [ ] 마크다운 리치 에디터
- [ ] 목표 진행도 자동 집계(연결된 기록 기반)
- [ ] 배포 (SQLite → Postgres 전환은 `datasource` provider 교체)
