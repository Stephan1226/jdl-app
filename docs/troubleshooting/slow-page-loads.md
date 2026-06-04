# 배포 환경에서 페이지 로딩이 느림

> 작성: 2026-06-04 · 영역: 성능(SSR·인증·렌더링)

## TL;DR

같은 리전(Supabase·Vercel 모두 한국)인데도 페이지가 느렸던 진짜 원인은 **SSR 자체가 아니라
"페이지를 한 번 띄울 때마다 붙는 인증/신원 확인 세금"** 이었다.

- 페이지마다 Supabase Auth 네트워크 왕복 **2~3회** + Prisma `User` **쓰기(upsert) 1회**가
  실제 데이터를 가져오기도 전에 직렬로 쌓였다.
- 게다가 `loading.tsx`가 하나도 없어서, 네비게이션이 **전체 서버 렌더가 끝날 때까지** 멈춰 있었다(체감 지연).

→ **TanStack Query는 이 문제의 해법이 아니다**(아래 "왜 TanStack Query가 아닌가" 참고).
대신 ① 신원 확인을 `getClaims()`(JWT 로컬 검증)로, ② 브리지 upsert를 인증 진입점으로 1회만,
③ `loading.tsx` 스켈레톤으로 즉시 피드백 — 세 가지를 적용했다.

> ⚠️ **반드시 후속 작업 1개가 남아 있다**: Supabase 대시보드에서 **JWT 서명키를 비대칭으로 전환**.
> 이걸 안 하면 `getClaims()`가 내부적으로 `getUser()`(네트워크)로 폴백되어 **코드는 맞지만 빨라지지 않는다.**
> ("필수 후속 작업" 절 참고)

---

## 증상

- 배포 환경에서 첫 진입·페이지 이동 모두 느리게 느껴짐.
- Supabase·Vercel을 같은 리전(한국)으로 맞췄는데도 개선되지 않음.
- 처음엔 "Next SSR이라 서버에서 데이터를 받아와서 느린 것 아닌가 → TanStack Query를 도입해야 하나?" 로 의심.

## 가설과 검증

### ❌ 가설: "SSR/서버 데이터 패칭이 문제 → TanStack Query로 옮기자"

코드를 보면 **데이터 쿼리 자체는 병목이 아니다.**

- 대시보드·인사이트·검색 등은 이미 `Promise.all`로 쿼리를 병렬 실행한다
  (`app/page.tsx`, `app/insights/page.tsx`, `app/search/page.tsx`).
- 개인 기록 앱이라 데이터량도 작아 쿼리는 수~수십 ms 수준.

**TanStack Query가 답이 아닌 이유:**

1. TanStack Query는 **클라이언트 캐싱** 도구다. 쓰려면 서버 컴포넌트 → 클라이언트 컴포넌트로 바꾸고
   데이터를 노출할 **route handler(API)** 를 새로 만들어야 한다.
2. 그 API도 **똑같은 Vercel 서버리스에서, 똑같은 인증 세금 + Prisma**를 그대로 치른다.
   느림이 사라지는 게 아니라 "하이드레이션 이후"로 **이동**하고, 클라→서버 왕복이 **하나 더** 붙는다.
3. 첫 방문은 같거나 더 느려진다(JS 다운로드 → 하이드레이트 → fetch → 렌더). 이득은 "재방문 시 클라 캐시"뿐인데,
   `force-dynamic` 개인 데이터라 그건 현재 통증 지점이 아니다.
4. 의도적으로 세운 RSC + Server Actions 구조(`CLAUDE.md` 참고)를 버리게 된다.

> "미리 받아오는(prefetch)" 직감은 절반 맞다. 다만 **Next 16의 `<Link>`는 이미 기본으로 프리페치**한다.
> 안 먹히던 이유가 바로 **`loading.tsx`가 없어서**다(dynamic 라우트는 로딩 바운더리까지만 프리페치됨).

## 근본 원인 (코드 근거)

### 1. 페이지마다 인증 네트워크 왕복 2~3회

보호된 페이지 하나를 렌더링할 때 실제로 일어났던 일:

| 위치 | 호출 | 비용 |
|---|---|---|
| `proxy.ts` | `supabase.auth.getUser()` | Supabase Auth **네트워크 왕복** (`getUser()`는 매번 토큰을 원격 검증) |
| `app/layout.tsx` → `getOptionalUser()` | `supabase.auth.getUser()` | **네트워크 왕복** |
| 페이지 → `getCurrentUserId()` → `getCurrentUser()` | `supabase.auth.getUser()` + `prisma.user.upsert()` | **네트워크 왕복 + DB 쓰기** |

`getOptionalUser`와 `getCurrentUser`는 **서로 다른 `cache()`** 라서 한 요청 안에서 중복 제거가 안 됐다.
결과적으로 풀(하드) 로드 시 `getUser()` **3회 + upsert 1회**, 소프트 네비게이션 시에도 **2회 + upsert 1회**가
데이터 패칭 전에 직렬로 쌓였다.

### 2. 페이지를 "읽을" 뿐인데 매번 DB에 "쓰기"

`getCurrentUser()`(구버전)가 페이지 로드마다 `prisma.user.upsert()`를 실행했다.
브리지(Supabase 유저 → Prisma `User`)는 **유저 생애 1회**만 필요한데, 모든 읽기 요청이 쓰기를 동반했다.

### 3. `loading.tsx` 부재 → 체감 지연

로딩 바운더리가 전무해, 링크 클릭 후 **인증 세금 + 쿼리 + HTML 생성이 전부 끝날 때까지** 화면이 멈춰 있었다.

---

## 적용한 해결책

### 1. 신원 확인을 `getClaims()`(JWT 로컬 검증)로 전환

`lib/user.ts`를 `getUser()` → `getClaims()` 기반으로 재작성하고, **단일 `cache()` 함수 `getSessionClaims`** 로
통일했다. 이제 한 요청 안에서 layout·page가 **같은 1회 호출을 공유**한다.

- `getCurrentUserId()` / `getOptionalUser()` / `getCurrentUser()` 모두 `getSessionClaims()`만 사용.
- `getCurrentUser()`의 표시 이름은 JWT의 `user_metadata.name`에서 가져온다 → **DB 조회 없음**.
- `proxy.ts`도 `getClaims()`로 전환(만료 토큰 갱신은 내부 `getSession()`이 그대로 처리하므로 안전).

`getClaims()` 동작(소스 확인, `@supabase/auth-js`):

- 비대칭 서명(ES256/RS256, `kid` 있음) + WebCrypto 가용 → **`crypto.subtle`로 로컬 검증, 네트워크 0회**.
- 대칭(HS256) → 내부적으로 `getUser()`로 **폴백(네트워크 1회)**.
- 둘 다 내부에서 `getSession()`을 거치므로 **만료 토큰 자동 갱신은 유지**된다.

### 2. 브리지 upsert를 인증 진입점으로 이동 (페이지 로드마다 → 1회)

`ensureUserRecord(user)`를 만들어 **세션이 처음 생기는 지점에서만** 호출한다:

- `app/auth/actions.ts` — `login()`(로그인 성공 직후), `signup()`(이메일 확인 꺼진 즉시 로그인 분기)
- `app/auth/confirm/route.ts` — 이메일 확인(`verifyOtp`) 성공 직후

→ 페이지 읽기 경로에서 **DB 쓰기가 사라졌다.** (기존 로그인 유저는 이미 행이 있으므로 영향 없음)

### 3. `loading.tsx` 스켈레톤 추가 (즉시 피드백 + 프리페치 활성화)

- `components/skeletons.tsx` — 재사용 스켈레톤(헤더·통계·리스트·카드그리드). 색 토큰은 기존 진행바와 동일.
- `app/loading.tsx`(대시보드) + `app/{entries,insights,goals,books,search}/loading.tsx`.
- 효과: 소프트 네비게이션 시 레이아웃은 유지된 채 **스켈레톤이 즉시** 뜨고 페이지 데이터가 스트리밍된다.
  `<Link>` 프리페치가 비로소 제 역할을 한다.

> 참고(Next 16 문서): 레이아웃이 `cookies()` 등 런타임 데이터를 쓰면 그 부분은 loading이 못 가리고
> 하드 네비게이션이 잠깐 블록된다. 우리 루트 레이아웃이 `getOptionalUser()`(=cookies)를 쓰지만,
> **소프트 네비게이션 땐 레이아웃이 재실행되지 않으므로** loading은 정상 작동한다. 또한 `getClaims` 로컬화로
> 그 1회 비용도 미미해진다.

---

## ⚠️ 필수 후속 작업: Supabase JWT 서명키 비대칭 전환

`getClaims()`의 **속도 이득은 "비대칭 서명키"가 있어야 발현**된다. 현재 대칭(HS256)이면 코드가 맞아도
내부적으로 `getUser()`(네트워크)로 폴백된다.

**대시보드 절차(무중단):**

1. Supabase Dashboard → **Authentication → JWT Keys**(프로젝트에 따라 *Project Settings → JWT/Signing Keys*).
2. 새 **비대칭 키(ES256 권장)** 를 생성(Standby/추가).
3. 그 키를 **현재 키로 회전(Rotate / Promote)**. 기존 발급 토큰은 만료까지 유효 → 다운타임 없음.

**전환 확인 방법:** 로그인 후 액세스 토큰을 디코드(jwt.io 등)하면 JWT **헤더 `alg`가 `ES256`/`RS256`** 이고
`kid`가 있어야 한다(이전엔 `HS256`). 이때부터 `getClaims()`는 캐시된 JWKS로 로컬 검증한다.

---

## 측정 / 검증 방법

- **Vercel**: 대시보드 → 해당 라우트/함수의 **Duration**(또는 Observability)로 전/후 비교.
- **브라우저 DevTools → Network**: 문서/RSC 요청의 **TTFB**.
- (선택) `getSessionClaims` 주변에 `console.time`을 잠깐 걸어 인증 단계 시간만 분리 측정.
- 기대: 서명키 전환 후 페이지당 인증 네트워크 왕복 **2~3 → 0**, DB 쓰기 **1 → 0**. 소프트 네비게이션은
  스켈레톤 덕에 **즉시 반응**으로 체감.

## 남은 개선 여지 (선택)

- **PPR(Partial Prerendering)**: 정적 셸을 엣지에서 즉시 + 동적 부분만 스트리밍(Next 16).
- **Prisma 콜드 스타트**: keep-warm / Prisma Accelerate / Vercel fluid compute 검토.
- **인사이트 페이지**: 현재 전체 `entries`를 limit 없이 로드 — 지금은 문제없지만 데이터가 커지면 집계 쿼리로 전환 검토.

## 변경된 파일

- `lib/user.ts` — `getClaims` 기반 재작성, `getSessionClaims`(단일 cache), `ensureUserRecord` 추가.
- `proxy.ts` — `getUser()` → `getClaims()`.
- `app/auth/actions.ts`, `app/auth/confirm/route.ts` — 인증 진입점에서 `ensureUserRecord` 호출.
- `components/skeletons.tsx` — 신규(재사용 스켈레톤).
- `app/loading.tsx`, `app/{entries,insights,goals,books,search}/loading.tsx` — 신규(로딩 UI).
