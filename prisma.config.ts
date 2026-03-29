import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL, // สำหรับ Runtime (Port 6543 + pgbouncer)
    directUrl: process.env.DIRECT_URL, // สำหรับ Migration & Admin Tasks (Port 5432)
  },
});
