import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3는 네이티브 모듈이라 서버 번들에서 제외해야 한다.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // 상위 디렉토리의 떠도는 lockfile 때문에 루트가 잘못 잡히지 않도록 고정.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
