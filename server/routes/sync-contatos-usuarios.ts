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

    // Extract all emails and celulares from contatos
    const emails = contatos.map(c => c.email).filter((e): e is string => e !== null);
    const celulares = contatos.map(c => c.celular).filter((c): c is string => c !== null);

    // Performance optimization: Single query for all matching usuarios instead of per-contact queries (prevents N+1)
    const matchingUsuarios = await prisma.usracessos.findMany({
      where: {
        OR: [
          { email: { in: emails } },
          { telefone: { in: celulares } }
        ]
      },
      select: { id: true, email: true, telefone: true }
    });

    console.log(`[syncContatosUsuarios] Found ${matchingUsuarios.length} usuarios to potentially link`);

    // Create a map for faster lookups
    const usuariosMap = new Map(matchingUsuarios.map(u => [u.email || u.telefone, u]));

    // Process each contato and find matches in memory
    for (const contato of contatos) {
      const matchingUserIds = new Set<number>();

      // Check email match
      if (contato.email && usuariosMap.has(contato.email)) {
        const usuario = usuariosMap.get(contato.email);
        if (usuario && usuario.id !== contato.usuarioId) {
          matchingUserIds.add(usuario.id);
        }
      }

      // Check celular match
      if (contato.celular && usuariosMap.has(contato.celular)) {
        const usuario = usuariosMap.get(contato.celular);
        if (usuario && usuario.id !== contato.usuarioId) {
          matchingUserIds.add(usuario.id);
        }
      }

      if (matchingUserIds.size === 0) continue;

      console.log(`[syncContatosUsuarios] Contato ${contato.id} matches ${matchingUserIds.size} usuarios`);

      // Batch upsert links for this contato (avoid sequential updates)
      try {
        const upsertPromises = Array.from(matchingUserIds).map(usuarioId =>
          prisma.contatos_usuarios_links.upsert({
            where: {
              contato_id_usuario_id: {
                contato_id: contato.id,
                usuario_id: usuarioId
              }
            },
            update: {
              ativo: true,
              data_vinculo: new Date()
            },
            create: {
              contato_id: contato.id,
              usuario_id: usuarioId,
              email: contato.email || null,
              celular: contato.celular || null,
              ativo: true
            }
          })
        );
        await Promise.all(upsertPromises);
        linkedCount += matchingUserIds.size;
      } catch (error) {
        console.error(`[syncContatosUsuarios] Error linking contato ${contato.id}:`, error);
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
