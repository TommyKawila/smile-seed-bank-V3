import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Prisma 7: no `url` in schema.prisma — URL lives in prisma.config.ts (CLI) and here at runtime.
 * PrismaClient does not accept `datasource: { url }`; with driver adapters the URL is passed via PrismaPg.
 */
function prismaClientSingleton() {
  const datasource = { url: process.env.DATABASE_URL };
  if (!datasource.url) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: datasource.url }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
globalForPrisma.prisma = prisma;
