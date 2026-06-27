import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

async function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const factory = new PrismaNeonHttp(connectionString, { arrayMode: true, fullResults: true });
  const adapter = (await factory.connect()) as any;
  
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

// Since createPrismaClient returns a Promise, we await it.
// Next.js Server Components/API routes support top-level await.
export const prisma = globalForPrisma.prisma || await createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
