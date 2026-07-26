import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Bump when Prisma schema requires client regen (dev hot-reload bust). */
const PRISMA_SCHEMA_REV = 202607261600;

type GlobalPrisma = {
  prisma?: PrismaClient;
  prismaSchemaRev?: number;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

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

function productsModelHasMerchKind(): boolean {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === "products");
  return model?.fields.some((f) => f.name === "product_kind") ?? false;
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

function resolvePrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  const stale =
    process.env.NODE_ENV === "development" &&
    existing &&
    (globalForPrisma.prismaSchemaRev !== PRISMA_SCHEMA_REV ||
      !("homepage_hero_cta_buttons" in existing) ||
      !productsModelHasMerchKind());

  if (stale) {
    console.warn("[prisma] Stale client detected — reinitializing after schema change");
    const client = prismaClientSingleton();
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaRev = PRISMA_SCHEMA_REV;
    return client;
  }

  if (!existing) {
    const client = prismaClientSingleton();
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaRev = PRISMA_SCHEMA_REV;
    return client;
  }

  return existing;
}

export const prisma = resolvePrismaClient();
