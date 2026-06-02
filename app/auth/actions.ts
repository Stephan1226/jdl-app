"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | undefined;

const loginSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력해 주세요"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  email: z.email("올바른 이메일 주소를 입력해 주세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }, // user_metadata.name → DAL에서 Prisma User.name으로 브리지
  });
  if (error) {
    return { error: error.message };
  }

  // 이메일 인증이 켜져 있으면 세션이 없고 확인 메일이 발송된다(설정해 둔 SMTP 사용).
  if (!data.session) {
    return {
      message: "확인 메일을 보냈어요. 메일의 링크를 눌러 가입을 완료해 주세요.",
    };
  }

  // 이메일 인증이 꺼져 있으면 즉시 로그인 상태가 된다.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
