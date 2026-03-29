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

function databaseHostFromConnectionString(url: string): string | undefined {
  try {
    return new URL(url.replace(/^postgres(ql)?:/i, "http:")).hostname;
  } catch {
    return url.split("@")[1]?.split(":")[0];
  }
}

function prismaClientSingleton() {
  const connectionString = resolveDatabaseUrl();
  const dbHost = databaseHostFromConnectionString(connectionString);
  console.log("🛠️ Current DB Host:", dbHost);
  console.log("🛠️ Using PGBouncer:", connectionString.includes("pgbouncer=true"));

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
globalForPrisma.prisma = prisma;
