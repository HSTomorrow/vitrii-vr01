import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

console.log("[Prisma] Initializing Prisma Client...");
console.log(
  "[Prisma] DATABASE_URL:",
  process.env.DATABASE_URL
    ? "SET (length: " + process.env.DATABASE_URL.length + ")"
    : "NOT SET",
);
console.log("[Prisma] NODE_ENV:", process.env.NODE_ENV);
console.log(
  "[Prisma] Platform:",
  process.env.NETLIFY_FUNCTION_NAME ? "Netlify" : "Standalone",
);

if (!process.env.DATABASE_URL) {
  console.error("[Prisma] ⚠️  WARNING: DATABASE_URL is not set!");
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: [
      {
        emit: "stdout",
        level: "error",
      },
      {
        emit: "stdout",
        level: "warn",
      },
    ],
  });

console.log("[Prisma] ✓ Prisma Client created successfully");

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
