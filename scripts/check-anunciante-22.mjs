import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: 22 },
    });

    if (anunciante) {
      console.log("✓ Anunciante with ID 22 found:");
      console.log(JSON.stringify(anunciante, null, 2));
    } else {
      console.log(
        "✗ Anunciante with ID 22 not found. Listing all anunciantes:",
      );
      const all = await prisma.anunciantes.findMany();
      all.forEach((a) => {
        console.log(`- ID: ${a.id}, Nome: ${a.nome}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
