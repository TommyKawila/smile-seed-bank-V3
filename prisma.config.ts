import { config } from "dotenv";
import { defineConfig } from "@prisma/config";

config();
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },
});
