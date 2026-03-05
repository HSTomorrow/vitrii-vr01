import prisma from "./prisma";

interface ConversationParams {
  usuarioId: number; // User creating the event
  anuncianteId: number; // Announcer owning the agenda
  evento_titulo: string;
  evento_data: Date;
  tipo: "evento" | "fila_espera";
}

/**
 * Create a conversation message for linked usuarios when an event/waiting list is created
 */
export async function createConversationForLinkedUsuarios(params: ConversationParams) {
  try {
    const { usuarioId, anuncianteId, evento_titulo, evento_data, tipo } = params;

    // Get the user and anunciante information
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { nome: true }
    });

    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: anuncianteId },
      select: { nome: true }
    });

    if (!usuario || !anunciante) {
      console.log("[createConversation] Usuario or anunciante not found");
      return;
    }

    // Get all usuarios linked to this announcer (via contatos)
    const linkedUsuarios = await prisma.contatos_usuarios_links.findMany({
      where: {
        ativo: true,
        contato: {
          anuncianteId: anuncianteId
        }
      },
      select: {
        usuario_id: true,
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      distinct: ["usuario_id"]
    });

    console.log(`[createConversation] Found ${linkedUsuarios.length} linked usuarios`);

    // Format the date
    const dataFormatada = evento_data.toLocaleDateString("pt-BR");
    const horaFormatada = evento_data.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    // Create the message content
    const tipoLabel = tipo === "evento" ? "um evento" : "uma fila de espera";
    const messageContent = `Foi criada ${tipoLabel} pelo usuário ${usuario.nome} / anunciante ${anunciante.nome} para o dia ${dataFormatada} às ${horaFormatada}. Por favor, verificar o calendário deste anunciante.`;

    // Create conversation and message for each linked usuario
    for (const linked of linkedUsuarios) {
      if (linked.usuario_id === usuarioId) {
        // Don't create conversation with the event creator
        continue;
      }

      try {
        // Check if conversation already exists
        const existingConversa = await prisma.conversas.findFirst({
          where: {
            usuarioId: linked.usuario_id,
            anuncianteId: anuncianteId,
            assunto: `Notificação de ${tipoLabel}`
          }
        });

        let conversaId: number;

        if (existingConversa) {
          conversaId = existingConversa.id;
        } else {
          // Create new conversation
          const conversa = await prisma.conversas.create({
            data: {
              usuarioId: linked.usuario_id,
              anuncianteId: anuncianteId,
              assunto: `Notificação de ${tipoLabel}`,
              tipo: "privada"
            }
          });
          conversaId = conversa.id;
        }

        // Create message from anunciante
        await prisma.mensagens.create({
          data: {
            conversaId: conversaId,
            anuncianteId: anuncianteId,
            conteudo: messageContent,
            status: "nao_lida"
          }
        });

        console.log(`[createConversation] Created message for usuario ${linked.usuario_id}`);
      } catch (error) {
        console.error(`[createConversation] Error creating conversation for usuario ${linked.usuario_id}:`, error);
      }
    }
  } catch (error) {
    console.error("[createConversation] Error:", error);
  }
}
