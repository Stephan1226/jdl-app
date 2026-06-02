import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(Server Component / Server Action / Route Handler)용 Supabase 클라이언트.
 * Next 16의 async `cookies()`에 getAll/setAll로 세션 쿠키를 연결한다.
 * 세션 갱신(만료 토큰 재발급)은 proxy.ts가 담당한다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서는 쿠키 쓰기가 막힐 수 있다. proxy.ts가 세션을 갱신하므로 무시 가능.
          }
        },
      },
    },
  );
}
