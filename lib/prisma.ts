import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL (or POSTGRES_PRISMA_URL / POSTGRES_URL) is not set");
  }
  return url;
}

function prismaClientSingleton() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: resolveDatabaseUrl() }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
globalForPrisma.prisma = prisma;
