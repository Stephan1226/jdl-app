import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/user";

/**
 * 이메일 확인 콜백. Supabase가 보낸 메일 링크(token_hash + type)를 검증한다.
 * 대시보드의 이메일 템플릿 redirect를 `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`로 맞춘다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // 브리지: 이메일 확인으로 세션이 처음 생기는 시점에 Prisma User를 보장.
      if (data.user) {
        await ensureUserRecord(data.user);
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", origin));
}
