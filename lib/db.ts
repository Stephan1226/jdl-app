import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient() {
  // Prisma 7은 드라이버 어댑터 방식. Supabase Postgres에 풀드(Supavisor/pgbouncer) 연결로 붙는다.
  // DATABASE_URL = 풀드(6543, ?pgbouncer=true). 마이그레이션용 DIRECT_URL은 prisma.config.ts에서 쓴다.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// dev 핫리로드 때마다 새 클라이언트가 만들어지지 않도록 전역에 캐시한다.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
