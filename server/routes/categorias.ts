import { Router, Request, Response } from "express";
import { prisma } from "@/lib/prisma";

const router = Router();

// Middleware to check if user is admin
const checkAdminAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const user = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({ error: "Only admins can manage categories" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("[Categorias] Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Initialize table if it doesn't exist
async function initializeCategoriaTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(100) UNIQUE NOT NULL,
        icone VARCHAR(100) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS categorias_ativo_idx ON categorias(ativo);
      CREATE INDEX IF NOT EXISTS categorias_descricao_idx ON categorias(descricao);
    `);
    console.log("[Categorias] Table initialized successfully");
  } catch (error) {
    console.error("[Categorias] Error initializing table:", error);
  }
}

// Initialize table on startup
initializeCategoriaTable();

// GET all categories (public - for form dropdowns)
router.get("/", async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.$queryRaw<any[]>`
      SELECT id, descricao, icone, ativo, "dataCriacao", "dataAtualizacao"
      FROM categorias
      WHERE ativo = true
      ORDER BY descricao ASC
    `;

    res.json(categorias);
  } catch (error) {
    console.error("[Categorias] GET error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET all categories for admin (including inactive)
router.get("/admin/all", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const categorias = await prisma.$queryRaw<any[]>`
      SELECT id, descricao, icone, ativo, "dataCriacao", "dataAtualizacao"
      FROM categorias
      ORDER BY descricao ASC
    `;

    res.json(categorias);
  } catch (error) {
    console.error("[Categorias] Admin GET error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET category by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categoria = await prisma.$queryRaw<any[]>`
      SELECT id, descricao, icone, ativo, "dataCriacao", "dataAtualizacao"
      FROM categorias
      WHERE id = ${parseInt(id)}
    `;

    if (!categoria || categoria.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(categoria[0]);
  } catch (error) {
    console.error("[Categorias] GET by ID error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

// POST - Create new category (admin only)
router.post("/", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { descricao, icone } = req.body;

    if (!descricao || !icone) {
      return res.status(400).json({
        error: "descricao and icone are required",
      });
    }

    // Check if category already exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM categorias WHERE LOWER(descricao) = LOWER(${descricao})
    `;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: "Category with this name already exists",
      });
    }

    const result = await prisma.$executeRaw`
      INSERT INTO categorias (descricao, icone, ativo, "dataCriacao", "dataAtualizacao")
      VALUES (${descricao}, ${icone}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    // Fetch the created category
    const newCategoria = await prisma.$queryRaw<any[]>`
      SELECT id, descricao, icone, ativo, "dataCriacao", "dataAtualizacao"
      FROM categorias
      WHERE descricao = ${descricao}
      ORDER BY id DESC
      LIMIT 1
    `;

    res.status(201).json(newCategoria[0]);
  } catch (error) {
    console.error("[Categorias] POST error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT - Update category (admin only)
router.put("/:id", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { descricao, icone, ativo } = req.body;

    if (!descricao || icone === undefined) {
      return res.status(400).json({
        error: "descricao and icone are required",
      });
    }

    // Check if category exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM categorias WHERE id = ${parseInt(id)}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Check for duplicate name (excluding current category)
    const duplicate = await prisma.$queryRaw<any[]>`
      SELECT id FROM categorias 
      WHERE LOWER(descricao) = LOWER(${descricao}) 
      AND id != ${parseInt(id)}
    `;

    if (duplicate && duplicate.length > 0) {
      return res.status(409).json({
        error: "Category with this name already exists",
      });
    }

    await prisma.$executeRaw`
      UPDATE categorias
      SET descricao = ${descricao}, icone = ${icone}, ativo = ${ativo}, "dataAtualizacao" = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
    `;

    // Fetch updated category
    const updated = await prisma.$queryRaw<any[]>`
      SELECT id, descricao, icone, ativo, "dataCriacao", "dataAtualizacao"
      FROM categorias
      WHERE id = ${parseInt(id)}
    `;

    res.json(updated[0]);
  } catch (error) {
    console.error("[Categorias] PUT error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE - Delete category (admin only)
router.delete("/:id", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM categorias WHERE id = ${parseInt(id)}
    `;

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    await prisma.$executeRaw`
      DELETE FROM categorias WHERE id = ${parseInt(id)}
    `;

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("[Categorias] DELETE error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
