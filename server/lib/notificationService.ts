import { sendEmail } from "./emailService";
import prisma from "./prisma";

interface NotificationOptions {
  recipientEmail: string;
  recipientName: string;
  type: "reservation_created" | "product_fully_reserved" | "reservation_cancelled";
  anuncioId: number;
  anuncioTitulo: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  usuarioTelefone?: string;
  usuarioWhatsapp?: string;
}

/**
 * Send reservation notification email
 */
export async function notifyReservationCreated(
  options: Omit<NotificationOptions, "type">
): Promise<boolean> {
  try {
    const {
      recipientEmail,
      recipientName,
      anuncioId,
      anuncioTitulo,
      usuarioNome,
      usuarioEmail,
      usuarioTelefone,
      usuarioWhatsapp,
    } = options;

    const subject = `Nova reserva para: ${anuncioTitulo}`;

    const htmlContent = `
      <h2>Nova Reserva Recebida! 🎉</h2>
      <p>Olá <strong>${recipientName}</strong>,</p>
      
      <p>Um usuário reservou seu produto:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>${anuncioTitulo}</h3>
        <p><strong>Anúncio ID:</strong> #${anuncioId}</p>
      </div>
      
      <h3>Dados do Usuário</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Nome:</strong> ${usuarioNome || "N/A"}</li>
        <li><strong>Email:</strong> ${usuarioEmail || "N/A"}</li>
        ${usuarioTelefone ? `<li><strong>Telefone:</strong> ${usuarioTelefone}</li>` : ""}
        ${usuarioWhatsapp ? `<li><strong>WhatsApp:</strong> ${usuarioWhatsapp}</li>` : ""}
      </ul>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <strong>Próximos passos:</strong><br>
        1. Entre no painel de gerenciamento de reservas<br>
        2. Veja todos os usuários que reservaram seu produto<br>
        3. Finalize a venda ou cancele reservas conforme necessário
      </p>
      
      <a href="${process.env.APP_URL || "https://vitrii.com.br"}/anuncio/${anuncioId}" 
         style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">
        Ver Anúncio
      </a>
    `;

    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[NotificationService] Reservation notification sent to ${recipientEmail} for anuncio #${anuncioId}`
    );
    return true;
  } catch (error) {
    console.error("[NotificationService] Failed to send reservation notification:", error);
    return false;
  }
}

/**
 * Send notification when product becomes fully reserved
 */
export async function notifyProductFullyReserved(options: Omit<NotificationOptions, "type">): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, anuncioId, anuncioTitulo } = options;

    const subject = `🔴 Produto RESERVADO: ${anuncioTitulo}`;

    const htmlContent = `
      <h2>Produto Totalmente Reservado! 🔴</h2>
      <p>Olá <strong>${recipientName}</strong>,</p>
      
      <p>Seu produto foi completamente reservado:</p>
      
      <div style="background-color: #ffe6e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h3>${anuncioTitulo}</h3>
        <p style="color: #dc3545; font-weight: bold;">Status: RESERVADO</p>
        <p style="margin: 0; color: #666;">Anúncio ID: #${anuncioId}</p>
      </div>
      
      <p><strong>O que isso significa?</strong></p>
      <ul>
        <li>Sua quantidade total de itens foi reservada por usuários</li>
        <li>O anúncio agora está com status "RESERVADO"</li>
        <li>Você pode concluir a negociação com os usuários interessados</li>
      </ul>
      
      <p><strong>Próximas ações:</strong></p>
      <ol>
        <li>Acesse o painel de gerenciamento de reservas</li>
        <li>Contate os usuários que reservaram</li>
        <li>Finalize a negociação</li>
        <li>Marque o anúncio como "vendido" quando concluído</li>
      </ol>
      
      <a href="${process.env.APP_URL || "https://vitrii.com.br"}/anuncio/${anuncioId}" 
         style="display: inline-block; background-color: #dc3545; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">
        Gerenciar Reservas
      </a>
    `;

    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[NotificationService] Product fully reserved notification sent to ${recipientEmail} for anuncio #${anuncioId}`
    );
    return true;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to send product reserved notification:",
      error
    );
    return false;
  }
}

/**
 * Send notification when a reservation is cancelled
 */
export async function notifyReservationCancelled(options: Omit<NotificationOptions, "type">): Promise<boolean> {
  try {
    const {
      recipientEmail,
      recipientName,
      anuncioId,
      anuncioTitulo,
      usuarioNome,
    } = options;

    const subject = `Reserva Cancelada: ${anuncioTitulo}`;

    const htmlContent = `
      <h2>Reserva Cancelada</h2>
      <p>Olá <strong>${recipientName}</strong>,</p>
      
      <p>Uma reserva foi cancelada para seu anúncio:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>${anuncioTitulo}</h3>
        <p>Usuário: ${usuarioNome || "Desconhecido"}</p>
        <p style="margin: 0; color: #666;">Anúncio ID: #${anuncioId}</p>
      </div>
      
      <p>A quantidade de itens disponíveis para este anúncio agora aumentou.</p>
      
      <a href="${process.env.APP_URL || "https://vitrii.com.br"}/anuncio/${anuncioId}" 
         style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px;">
        Ver Anúncio
      </a>
    `;

    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    console.log(
      `[NotificationService] Reservation cancelled notification sent to ${recipientEmail}`
    );
    return true;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to send cancellation notification:",
      error
    );
    return false;
  }
}

/**
 * Get anunciante contact info for notifications
 */
export async function getAnuncianteContactInfo(anuncianteId: number) {
  try {
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: anuncianteId },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    return anunciante;
  } catch (error) {
    console.error("[NotificationService] Failed to fetch anunciante contact info:", error);
    return null;
  }
}

/**
 * Send in-app notification (placeholder for future WebSocket implementation)
 */
export async function createInAppNotification(
  usuarioId: number,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error",
  relatedEntityId?: number
) {
  try {
    // Placeholder for future in-app notifications database table
    console.log(
      `[NotificationService] In-app notification for user #${usuarioId}: ${title} - ${message}`
    );
    // TODO: Implement database storage for in-app notifications
    // TODO: Implement WebSocket broadcasting for real-time notifications
    return true;
  } catch (error) {
    console.error("[NotificationService] Failed to create in-app notification:", error);
    return false;
  }
}
