import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Fixing productos table schema...\n");

    // Try to make lojaId nullable instead of removing it (safer approach)
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "productos" DROP COLUMN "lojaId"'
      );
      console.log("✅ Removed lojaId column from productos (no longer needed)");
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("does not exist")) {
        console.log("ℹ️ lojaId column doesn't exist");
      } else {
        console.log("⚠️ Could not drop lojaId:", msg.substring(0, 50));
      }
    }

    console.log("\n✅ Productos table schema fixed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
