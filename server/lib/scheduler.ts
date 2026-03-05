import prisma from "./prisma";

/**
 * Sync contatos with usuarios based on matching email or phone
 * This should be called every hour
 */
export async function syncContatosUsuariosHourly() {
  try {
    console.log("[Scheduler] Starting hourly contatos-usuarios sync...");

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

    console.log(`[Scheduler] Found ${contatos.length} contatos to check`);

    let linkedCount = 0;
    let skippedCount = 0;

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

      if (matchConditions.length === 0) {
        skippedCount++;
        continue;
      }

      // Find matching usuarios
      const matchingUsuarios = await prisma.usracessos.findMany({
        where: {
          OR: matchConditions,
          // Don't link to the creator
          id: { not: contato.usuarioId }
        },
        select: { id: true }
      });

      if (matchingUsuarios.length === 0) {
        skippedCount++;
        continue;
      }

      console.log(`[Scheduler] Contato ${contato.id} matches ${matchingUsuarios.length} usuarios`);

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
          console.error(`[Scheduler] Error linking contato ${contato.id} to usuario ${usuario.id}:`, error);
        }
      }
    }

    console.log(`[Scheduler] Sync complete. Created/updated ${linkedCount} links. Skipped ${skippedCount}`);
    return {
      success: true,
      linkedCount,
      skippedCount
    };
  } catch (error) {
    console.error("[Scheduler] Error during sync:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Initialize scheduler to run hourly
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing hourly scheduler...");

  // Run immediately on startup
  syncContatosUsuariosHourly().catch(error => {
    console.error("[Scheduler] Error on startup sync:", error);
  });

  // Then run every hour (3600000 ms = 1 hour)
  setInterval(() => {
    syncContatosUsuariosHourly().catch(error => {
      console.error("[Scheduler] Error in scheduled sync:", error);
    });
  }, 3600000); // 1 hour

  console.log("[Scheduler] Hourly scheduler initialized");
}
