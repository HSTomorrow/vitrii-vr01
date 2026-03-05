import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Sync contacts with usuarios based on matching email or phone
export const syncContatosUsuarios: RequestHandler = async (req, res) => {
  try {
    console.log("[syncContatosUsuarios] Starting hourly sync...");

    // Get all contatos with email or celular
    const contatos = await prisma.contatos.findMany({
      where: {
        OR: [
          { email: { not: null } },
          { celular: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        celular: true,
        usuarioId: true,
      }
    });

    console.log(`[syncContatosUsuarios] Found ${contatos.length} contatos to check`);

    let linkedCount = 0;

    // For each contato, try to find matching usuarios
    for (const contato of contatos) {
      // Build OR conditions for matching
      const matchConditions: any[] = [];
      
      if (contato.email) {
        matchConditions.push({ email: contato.email });
      }
      if (contato.celular) {
        matchConditions.push({ telefone: contato.celular });
      }

      if (matchConditions.length === 0) continue;

      // Find matching usuarios
      const matchingUsuarios = await prisma.usracessos.findMany({
        where: {
          OR: matchConditions,
          // Don't link to the creator
          id: { not: contato.usuarioId }
        },
        select: { id: true }
      });

      console.log(`[syncContatosUsuarios] Contato ${contato.id} matches ${matchingUsuarios.length} usuarios`);

      // Create or update links
      for (const usuario of matchingUsuarios) {
        try {
          await prisma.contatos_usuarios_links.upsert({
            where: {
              contato_id_usuario_id: {
                contato_id: contato.id,
                usuario_id: usuario.id
              }
            },
            update: {
              ativo: true,
              data_vinculo: new Date()
            },
            create: {
              contato_id: contato.id,
              usuario_id: usuario.id,
              email: contato.email || null,
              celular: contato.celular || null,
              ativo: true
            }
          });
          linkedCount++;
        } catch (error) {
          console.error(`[syncContatosUsuarios] Error linking contato ${contato.id} to usuario ${usuario.id}:`, error);
        }
      }
    }

    console.log(`[syncContatosUsuarios] Sync complete. Created/updated ${linkedCount} links.`);

    res.json({
      success: true,
      message: "Sync completed",
      linkedCount
    });
  } catch (error) {
    console.error("[syncContatosUsuarios] Error:", error);
    res.status(500).json({
      error: "Erro ao sincronizar contatos com usuários"
    });
  }
};

// Get linked usuarios for a contato
export const getLinkedUsuariosForContato: RequestHandler = async (req, res) => {
  try {
    const contatoId = parseInt(req.params.contatoId);

    const links = await prisma.contatos_usuarios_links.findMany({
      where: {
        contato_id: contatoId,
        ativo: true
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error("Error getting linked usuarios:", error);
    res.status(500).json({
      error: "Erro ao buscar usuários vinculados"
    });
  }
};

// Get linked contatos for a usuario
export const getLinkedContatosForUsuario: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuário não autenticado"
      });
    }

    const links = await prisma.contatos_usuarios_links.findMany({
      where: {
        usuario_id: usuarioId,
        ativo: true
      },
      include: {
        contato: {
          select: {
            id: true,
            nome: true,
            email: true,
            celular: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error("Error getting linked contatos:", error);
    res.status(500).json({
      error: "Erro ao buscar contatos vinculados"
    });
  }
};
