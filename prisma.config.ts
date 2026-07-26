import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "@prisma/config";
import { resolveDirectDbUrl } from "./lib/db-direct-url";

config();
config({ path: resolve(process.cwd(), ".env.local"), override: true });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: resolveDirectDbUrl(),
  },
});
