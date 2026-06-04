# lib/ — 인프라·데이터·인증 레이어

## STRUCTURE
```
lib/
├── db.ts              # Prisma 7 클라이언트 (@prisma/adapter-pg)
├── user.ts            # 인증 DAL — JWT 클레임 · userId · Prisma 브리지
├── domain.ts          # 도메인 상수 · 라벨 · Zod 스키마
├── format.ts          # 날짜/형식 유틸
├── queries.ts         # 공통 쿼리 헬퍼
├── entry-data.ts      # Entry 관련 데이터 헬퍼
├── api.ts             # API 유틸
├── supabase/
│   └── server.ts      # Supabase SSR 클라이언트
├── data/
│   ├── books.ts       # Book 데이터 액세스
│   ├── entries.ts     # Entry 데이터 액세스
│   ├── goals.ts       # Goal 데이터 액세스
│   ├── insights.ts    # 인사이트 집계
│   ├── dashboard.ts   # 대시보드 데이터
│   └── search.ts      # 검색 쿼리
└── query/
    ├── client.ts      # React Query 클라이언트
    ├── fetcher.ts     # fetcher 유틸
    └── keys.ts        # query key 상수
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| DB 클라이언트 | `db.ts` | 전역 캐시, dev 핫리로드 대응 |
| 현재 유저 ID | `user.ts` `getCurrentUserId()` | 미인증 시 /login 리다이렉트 |
| 현재 유저 데이터 | `user.ts` `getCurrentUser()` | 이름은 JWT에서 — DB 조회 없음 |
| layout용 유저 | `user.ts` `getOptionalUser()` | 미인증 시 null, 리다이렉트 없음 |
| Supabase → Prisma 브리지 | `user.ts` `ensureUserRecord()` | 인증 진입점에서만 |
| Supabase SSR 클라이언트 | `supabase/server.ts` | createClient(), server-only |
| 도메인 상수·Zod | `domain.ts` | 새 type/source/status는 여기부터 |
| 도메인별 쿼리 | `data/{도메인}.ts` | userId 스코프 필수 |
| React Query 설정 | `query/` | client · fetcher · keys 분리 |

## CONVENTIONS
- **Prisma 7 드라이버 어댑터** — `PrismaPg` + `DATABASE_URL`(풀드 6543). 마이그레이션은 `DIRECT_URL`(다이렉트 5432).
- **Supabase Auth + Prisma 하이브리드** — 신원은 Supabase JWT, 데이터는 Prisma. 같은 UUID로 User upsert.
- **JWT 클레임 메모이즈** — `getSessionClaims`는 `cache()`로 한 요청 내 1회.
- **모든 쿼리 `userId` 스코프** — `findFirst({ where: { id, userId } })` 식으로 IDOR 방지.
- **도메인 상수 단일 관리** — `type`/`source`/`status`는 String 컬럼 + `domain.ts`의 Zod enum.

## ANTI-PATTERNS
- **절대 `ensureUserRecord`를 페이지/액션에서 호출 금지** — 오직 login/signup/confirm 진입점.
- **Prisma 클라이언트 재생성 금지** — `globalThis` 캐시 사용.
- **쿼리에서 `userId` 누락 금지** — 모든 read/write/delete는 userId 포함.
- **Postgres enum 사용 금지** — `lib/domain.ts`의 String + Zod 패턴 유지.
