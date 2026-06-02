import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg 드라이버는 서버 번들에서 제외한다(네이티브/동적 require 회피).
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  // 상위 디렉토리의 떠도는 lockfile 때문에 루트가 잘못 잡히지 않도록 고정.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
