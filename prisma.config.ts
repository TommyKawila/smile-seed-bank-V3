// prisma.config.ts
import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// บังคับให้โหลดจาก .env.local ให้ตรงกับที่บอสมี
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env["DATABASE_URL"], // ดึงจาก .env.local ที่โหลดมาด้านบน
  },
});