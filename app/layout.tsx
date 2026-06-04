import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/app/providers";
import { getOptionalUser } from "@/lib/user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "jdl — 흩어진 기록을 한 곳에",
  description:
    "독서·생각·목표 기록을 한 곳에 모으고, 정리·검색하고, 시각화로 인사이트를 얻는 개인 기록 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalUser();
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <AppShell userEmail={user?.email ?? null}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
