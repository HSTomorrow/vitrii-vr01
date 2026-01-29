import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Log environment variables for debugging
if (process.env.NODE_ENV === "production" || process.env.NETLIFY_FUNCTION_NAME) {
  console.log("[Prisma] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log("[Prisma] NODE_ENV:", process.env.NODE_ENV);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
