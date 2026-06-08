## 개요
> 이 PR이 해결하는 문제나 추가하는 기능을 한두 줄로 설명하세요.

## 변경 유형
- [ ] `fix` — 버그 수정
- [ ] `feat` — 새 기능
- [ ] `refactor` — 동작 변경 없는 코드 개선
- [ ] `chore` — 설정·의존성·문서 등 잡일

## 주요 변경사항
- 

## 체크리스트
- [ ] `userId` 스코프가 모든 쿼리·뮤테이션에 포함되어 있다
- [ ] 데이터 변경 Server Action에 `revalidatePath` + `redirect`가 있다
- [ ] DB 읽는 페이지에 `export const dynamic = "force-dynamic"`이 있다
- [ ] 새 도메인 값/종류는 `lib/domain.ts`에만 추가했다
- [ ] Postgres enum을 추가하지 않았다
- [ ] `middleware.ts`를 만들지 않았다 (`proxy.ts` 사용)

## 테스트 방법
> 검증한 경로(골든패스 + 엣지케이스)를 간략히 적어주세요.

## 스크린샷 (UI 변경 시)
