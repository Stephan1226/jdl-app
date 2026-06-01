import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createPrismaClient() {
  // Prisma 7은 드라이버 어댑터 방식. 로컬 SQLite 파일에 better-sqlite3로 연결한다.
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
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
