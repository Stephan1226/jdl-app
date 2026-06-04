import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// 인증 없이 접근 가능한 경로(로그인/회원가입/이메일 인증 콜백).
const PUBLIC_PATHS = ["/login", "/signup", "/auth"];

const isPublic = (path: string) =>
  PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Next 16: `middleware`는 `proxy`로 이름이 바뀌었다(Node.js 런타임).
 * 여기서 (1) Supabase 세션 쿠키를 갱신하고 (2) 미인증 사용자를 /login으로 보낸다.
 * ⚠️ proxy만으로는 Server Action을 막지 못한다 — 인가는 lib/user.ts(DAL)와 각 액션에서도 검증한다.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // 세션 검증 + 토큰 갱신 — 절대 제거 금지.
  // getClaims()는 (비대칭 JWT 서명키 사용 시) JWT를 네트워크 없이 로컬 검증하고,
  // 내부 getSession()이 만료 세션을 재발급한다(대칭/HS256이면 getUser()로 폴백 = 네트워크 1회).
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;

  // 갱신된 쿠키를 보존한 채 리다이렉트하기 위한 헬퍼.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const res = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      res.cookies.set(cookie);
    }
    return res;
  };

  if (!user && !isPublic(path)) {
    return redirectTo("/login");
  }
  if (user && (path === "/login" || path === "/signup")) {
    return redirectTo("/");
  }

  return supabaseResponse;
}

export const config = {
  // 정적 자산을 제외한 모든 경로에서 실행(Server Action 경로를 빠뜨리지 않도록 api는 굳이 제외하지 않음).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
