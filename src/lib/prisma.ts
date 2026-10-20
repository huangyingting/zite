import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

const createPrismaClient = () => {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return new PrismaClient();
  }
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
