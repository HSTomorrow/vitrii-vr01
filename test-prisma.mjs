import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing Prisma connection...");
    const count = await prisma.usracesso.count();
    console.log("✅ Success! Current users:", count);
  } catch (e) {
    console.error("❌ Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
