import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl?.startsWith("file:")) {
    // Local dev: SQLite
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const Database = require("better-sqlite3");
    const db = new Database(dbUrl.replace("file:", ""));
    const adapter = new PrismaBetterSqlite3(db);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // Production: PostgreSQL (Neon)
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
