import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 doesn't load .env itself.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrate needs a direct connection: Neon's pooled URL goes through PgBouncer, which breaks it.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL },
});
