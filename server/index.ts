import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./lib/prisma";
import { sendTestEmail, testSmtpConnection } from "./lib/emailService";
import {
  getAnuncios,
  getAnuncioById,
  createAnuncio,
  updateAnuncio,
  updateAnuncioStatus,
  overrideAnuncioStatus,
  deleteAnuncio,
  inactivateAnuncio,
  activateAnuncio,
  getProdutosParaAnuncio,
  canEditAnuncio,
  recordAnuncioView,
  getAnunciosDUsuario,
  toggleDestaqueAnuncio,
  getAnuncioFotos,
  addAnuncioFoto,
  deleteAnuncioFoto,
  reorderAnuncioFotos,
} from "./routes/anuncios";
import { updateAnuncioOrdem } from "./routes/anuncios-ordem";
import {
  getAnunciantes,
  getAnuncianteById,
  createAnunciante,
  updateAnunciante,
  deleteAnunciante,
  adicionarUsuarioAnunciante,
  getEquipeAnunciante,
  getAnunciantesByUsuario,
} from "./routes/anunciantes";
import {
  getGrupos,
  getGrupoById,
  getProductosOfGrupo,
  createGrupo,
  updateGrupo,
  deleteGrupo,
} from "./routes/grupos-productos";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
} from "./routes/productos";
import {
  getTabelas,
  getTabelaById,
  createTabela,
  updateTabela,
  deleteTabela,
} from "./routes/tabelas-preco";
import {
  getUsuarios,
  getUsuarioById,
  validateUserStatus,
  toggleUserStatus,
  unlockUserAccount,
  signInUsuario,
  signUpUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  forgotPassword,
  resetPassword,
  validateResetToken,
  verifyEmail,
  checkUserStatusByEmail,
  getUsuariosComSenha,
  adminResetUserPassword,
  adminUpdateUserProfile,
  updateMaxAnunciosAtivos,
  updateLocalidadePadrao,
  changePassword,
  resendVerificationEmail,
  recalculateAdCountersAdmin,
} from "./routes/usuarios";
import {
  getEquipes,
  getEquipeById,
  createEquipe,
  updateEquipe,
  deleteEquipe,
  adicionarMembro,
  removerMembro,
  atualizarMembro,
  getUsuariosDisponiveis,
  getMembrosDisponiveis,
} from "./routes/equipes-venda";
import {
  getListasDesejos,
  getListaDesejosById,
  createListaDesejos,
  updateListaDesejos,
  deleteListaDesejos,
  addItemLivre,
  addItemAnuncio,
  updateItemListaDesejos,
  deleteItemListaDesejos,
  addPermissao as addPermissaoListaDesejos,
  removePermissao as removePermissaoListaDesejos,
  listarUsuariosListaDesejosParaAnuncio,
} from "./routes/listas_desejos";
import {
  getAgendas,
  getAgendaById,
  createAgenda,
  updateAgendaStatus,
  deleteAgenda,
  addToWaitlist,
  getWaitlist,
  removeFromWaitlist,
  promoteFromWaitlist,
} from "./routes/agendas";
import {
  getEventosByAnunciante,
  getEventosVisivelsPara,
  createEvento,
  createEventoVisitante,
  updateEvento,
  deleteEvento,
  addPermissao,
  removePermissao,
  getEventoUsers,
  searchUsers,
  addUserToEvento,
  getAgendaPrivacyStatus,
  canUserEditEvento,
  isUserAnunciante,
} from "./routes/eventos-agenda";
import {
  getFilasEsperaParaAnunciante,
  getFilasEsperaPorUsuario,
  createFilaEspera,
  aprovarFilaEspera,
  rejeitarFilaEspera,
  cancelarFilaEspera,
  atualizarStatusEvento,
  deletarAgenda,
  getFilasEsperaVisivelsPara,
  addFilaPermissao,
  removeFilaPermissao,
  getWaitingListCount,
  canUserEditFila,
} from "./routes/filas-espera-agenda";
import {
  criarReservaOuListaEspera,
  getReservasDoEvento,
  confirmarReserva,
  rejeitarReserva,
  cancelarReserva,
  getReservaCount,
  getPendingAppointmentsCount,
} from "./routes/reservas-evento-agenda";
import {
  getHorariosAgenda,
  saveHorariosAgenda,
  isTimeWithinSchedule,
} from "./routes/agendas-horarios";
import {
  getPagamentoByAnuncioId,
  createPagamento,
  updatePagamentoStatus,
  getPagamentoStatus,
  handlePaymentWebhook,
  cancelPagamento,
  uploadComprovantePagemento,
  aprovarPagamento,
  rejeitarPagamento,
  confirmarPagamento,
  getPagamentos,
  marcarPagamentoRealizado,
} from "./routes/pagamentos";
import {
  getConversas,
  getConversaById,
  createConversa,
  deleteConversa,
} from "./routes/conversas";
import {
  getMensagensConversa,
  createMensagem,
  markMensagemAsRead,
  markConversaAsRead,
  getUnreadCount,
  deleteMensagem,
  getUnreadMessagesCount,
} from "./routes/mensagens";
import {
  getFuncionalidades,
  getFuncionalidadeById,
  getFuncionalidadesByUsuario,
  createFuncionalidade,
  updateFuncionalidade,
  deleteFuncionalidade,
} from "./routes/funcionalidades";
import {
  grantFuncionalidade,
  grantFuncionalidades,
  revokeFuncionalidade,
  revokeFuncionalidades,
  listUserFuncionalidades,
  grantAllFuncionalidades,
  revokeAllFuncionalidades,
} from "./routes/usuario-funcionalidades";
import { uploadMiddleware, handleUpload } from "./routes/upload";
import {
  getLocalidades,
  getLocalidadeById,
  createLocalidade,
  updateLocalidade,
  deleteLocalidade,
  getAnunciantesForLocalidade,
  addAnuncianteToLocalidade,
  removeAnuncianteFromLocalidade,
} from "./routes/localidades";
import { extractUserId, requireAdmin, optionalAuth } from "./middleware/permissionGuard";
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "./routes/banners";
import {
  getContatosByAnunciante,
  createContato,
  updateContato,
  deleteContato,
  checkDuplicateContato,
} from "./routes/contatos";
import {
  syncContatosUsuarios,
  getLinkedUsuariosForContato,
  getLinkedContatosForUsuario,
} from "./routes/sync-contatos-usuarios";
import categoriasRouter from "./routes/categorias";
import reservasAnuncioRouter from "./routes/reservas-anuncio";
import {
  listarContratos,
  criarContrato,
  atualizarContrato,
  atualizarStatusContrato,
  criarReajuste,
  anexarDocumentoContrato,
  listarLancamentos,
  obterLancamentoDoEvento,
  listarLancamentosDoAnuncio,
  criarLancamento,
  atualizarLancamento,
  gerarPixLancamento,
  anexarComprovanteLancamento,
  marcarLancamentoPago,
  cancelarLancamento,
  obterReciboPublico,
  enviarReciboPorEmail,
  adminListarLancamentos,
  adminListarContratos,
  lancarMesContrato,
  lancarLoteContratos,
} from "./routes/financeiro";
import {
  obterDashboard,
  reprocessarDashboard,
  obterDashboardSomatorio,
} from "./routes/dashboard";

export function createServer() {
  const app = express();

  // Middleware
  // In production, restrict cross-origin requests to our own configured origin(s).
  // ALLOWED_ORIGINS accepts a comma-separated list; falls back to APP_URL if unset.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors(
      process.env.NODE_ENV === "production" && allowedOrigins.length > 0
        ? { origin: allowedOrigins }
        : undefined,
    ),
  );
  app.use((req, res, next) => {
    // Prevents browsers from MIME-sniffing uploaded/static files into an
    // executable content type (e.g. serving a spoofed image as HTML).
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  // Increase body size limit to 10MB to support large base64-encoded images
  app.use(
    express.json({
      limit: "10mb",
      // Keep the raw bytes around so the payment webhook can verify its HMAC signature.
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Cache control headers
  app.use((req, res, next) => {
    // Disable cache for HTML, JSON, and index files
    if (req.path.endsWith(".html") || req.path === "/" || req.path.endsWith(".json")) {
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      });
    }
    // Long cache for asset files (JS, CSS, etc.)
    else if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/i.test(req.path)) {
      res.set({
        "Cache-Control": "public, max-age=31536000, immutable",
      });
    }
    next();
  });

  app.use(express.static("public"));

  // Guard middleware for debug endpoints - only allow in development
  const guardDebugEndpoints = (_req: any, res: any, next: any) => {
    if (process.env.NODE_ENV !== "development") {
      console.warn(`⚠️ Debug endpoint access attempted in ${process.env.NODE_ENV} environment`);
      return res.status(403).json({
        success: false,
        error: "Debug endpoints are only available in development",
      });
    }
    next();
  };

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Simple test - returns immediately (dev only)
  app.get("/api/test", guardDebugEndpoints, (_req, res) => {
    res.json({
      status: "ok",
      message: "Server is responding",
      database_url_set: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV,
    });
  });

  // Health check for Fly.io and monitoring
  // This endpoint is lightweight for frequent polling
  app.get("/health", async (_req, res) => {
    try {
      res.set("Content-Type", "application/json");
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Health Check] Error:", error);
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Quick database test
  app.get("/api/db-test", guardDebugEndpoints, async (_req, res) => {
    try {
      const count = await prisma.anuncios.count();
      const anuncios = await prisma.anuncios.findMany({ take: 5 });
      res.json({
        status: "ok",
        total_ads: count,
        sample_ads: anuncios,
      });
    } catch (error) {
      console.error("[db-test] Error:", error);
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Health check and diagnostics
  app.get("/api/health", async (_req, res) => {
    try {
      // Test database connection with a simple query
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: {
          node_env: process.env.NODE_ENV,
          has_database_url: !!process.env.DATABASE_URL,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Upload route
  app.post("/api/upload", extractUserId, uploadMiddleware, handleUpload);

  // Usracessos routes (User Access)
  app.get("/api/usracessos", extractUserId, requireAdmin, getUsuarios);
  app.get("/api/usracessos/:id", extractUserId, getUsuarioById);
  app.get("/api/usracessos/:id/validate-status", validateUserStatus);
  app.get("/api/auth/check-status-by-email", checkUserStatusByEmail);
  app.patch("/api/usracessos/:id/status", extractUserId, requireAdmin, toggleUserStatus);
  app.patch("/api/usracessos/:id/unlock", extractUserId, requireAdmin, unlockUserAccount);
  app.post("/api/auth/signin", signInUsuario);
  app.post("/api/auth/signup", signUpUsuario);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/validate-reset-token", validateResetToken);
  app.get("/api/auth/verify-email", verifyEmail);
  app.post("/api/auth/resend-verification-email", resendVerificationEmail);
  app.post("/api/admin/recalculate-ad-counters", extractUserId, recalculateAdCountersAdmin);

  // DEBUG endpoint - Check email verification tokens and user status
  app.get("/api/debug/verify-email-status", guardDebugEndpoints, async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email é obrigatório",
        });
      }

      console.log("[debug/verify-email-status] 🔍 Verificando status de verificação para:", email);

      // Get user
      const usuario = await prisma.usracessos.findUnique({
        where: { email: email as string },
        select: {
          id: true,
          email: true,
          status: true,
          emailVerificado: true,
          dataCriacao: true,
        },
      });

      // Get verification tokens for this user
      let verificacaoTokens: any[] = [];
      if (usuario) {
        verificacaoTokens = await prisma.emailVerificationToken.findMany({
          where: { usuarioId: usuario.id },
          select: {
            id: true,
            token: true,
            expiresAt: true,
            createdAt: true,
          },
        });
      }

      console.log("[debug/verify-email-status] Resultados:", {
        usuarioEncontrado: !!usuario,
        tokensEncontrados: verificacaoTokens.length,
      });

      res.status(200).json({
        success: true,
        data: {
          usuario: usuario || { error: "Usuário não encontrado" },
          verificacaoTokens: verificacaoTokens.map(t => ({
            id: t.id,
            tokenPreview: t.token.substring(0, 20) + "...",
            expiresAt: t.expiresAt,
            createdAt: t.createdAt,
            expirado: t.expiresAt < new Date(),
          })),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[debug/verify-email-status] ❌ ERRO:", errorMessage);
      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  // Test email endpoint - for debugging/testing SMTP configuration (dev only)
  app.post("/api/test-email", guardDebugEndpoints, async (req, res) => {
    try {
      const { toEmail, fromEmail } = req.body;

      if (!toEmail) {
        return res.status(400).json({
          success: false,
          error: "Email de destino (toEmail) é obrigatório",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(toEmail)) {
        return res.status(400).json({
          success: false,
          error: "Formato de email inválido",
        });
      }

      const success = await sendTestEmail(toEmail, fromEmail);

      if (!success) {
        return res.status(500).json({
          success: false,
          error: "Erro ao enviar email de teste. Verifique as configurações SMTP.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Email de teste enviado com sucesso!",
        details: {
          from: fromEmail || process.env.MAIL_FROM,
          to: toEmail,
          smtp: process.env.SMTP_HOST,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Erro no endpoint de teste de email:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar solicitação de teste de email",
      });
    }
  });

  // SMTP Diagnostic endpoint
  app.get("/api/smtp-diagnostic", guardDebugEndpoints, async (_req, res) => {
    try {
      console.log("🧪 Iniciando diagnóstico SMTP...");

      const config = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.MAIL_FROM,
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_PORT),
      };

      const connectionTest = await testSmtpConnection();

      res.status(200).json({
        success: connectionTest,
        message: connectionTest
          ? "✅ SMTP conectado com sucesso!"
          : "❌ Falha ao conectar ao SMTP",
        configuration: config,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no diagnóstico SMTP:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao executar diagnóstico SMTP",
        details: error instanceof Error ? error.message : "Desconhecido",
      });
    }
  });

  // Diagnostic endpoint for SMTP configuration
  app.get("/api/diagnostic-smtp", guardDebugEndpoints, async (_req, res) => {
    try {
      console.log("\n🔍 ========== DIAGNOSTIC SMTP ==========");

      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: {
          node_env: process.env.NODE_ENV,
          smtp_host: process.env.SMTP_HOST,
          smtp_port: process.env.SMTP_PORT,
          smtp_secure: process.env.SMTP_SECURE,
          smtp_user: process.env.SMTP_USER,
          mail_from: process.env.MAIL_FROM,
          app_url: process.env.APP_URL,
        },
        tests: {} as any,
      };

      console.log("📋 Environment variables:");
      console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
      console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
      console.log(`   SMTP_SECURE: ${process.env.SMTP_SECURE}`);
      console.log(`   SMTP_USER: ${process.env.SMTP_USER ? "✅ Definido" : "❌ Não definido"}`);
      console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? "✅ Definido" : "❌ Não definido"}`);

      // Test 1: Check if all required env vars are set
      console.log("\n📌 Test 1: Verificando variáveis de ambiente...");
      const requiredVars = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "MAIL_FROM",
      ];

      const missingVars = requiredVars.filter(
        (v) => !process.env[v as keyof typeof process.env]
      );

      if (missingVars.length === 0) {
        diagnostics.tests.env_vars = { status: "✅ OK", message: "Todas as variáveis estão definidas" };
        console.log("✅ Todas as variáveis de ambiente estão definidas");
      } else {
        diagnostics.tests.env_vars = {
          status: "❌ FALHA",
          missing: missingVars,
        };
        console.log(`❌ Variáveis faltantes: ${missingVars.join(", ")}`);
      }

      // Test 2: Test SMTP Connection
      console.log("\n📌 Test 2: Testando conexão SMTP...");
      try {
        const { testSmtpConnection } = await import("./lib/emailService");
        const connectionOk = await testSmtpConnection();

        if (connectionOk) {
          diagnostics.tests.smtp_connection = {
            status: "✅ OK",
            message: "Conexão SMTP verificada com sucesso",
          };
          console.log("✅ Conexão SMTP verificada com sucesso");
        } else {
          diagnostics.tests.smtp_connection = {
            status: "❌ FALHA",
            message: "Não foi possível verificar a conexão SMTP",
          };
          console.log("❌ Falha ao verificar conexão SMTP");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        diagnostics.tests.smtp_connection = {
          status: "❌ ERRO",
          error: errorMsg,
        };
        console.error(`❌ Erro ao testar SMTP: ${errorMsg}`);
      }

      // Test 3: Validate email format
      console.log("\n📌 Test 3: Validando formato de emails...");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const smtpUser = process.env.SMTP_USER || "";
      const mailFrom = process.env.MAIL_FROM || "";

      const validSmtpUser = emailRegex.test(smtpUser);
      const validMailFrom = emailRegex.test(mailFrom);

      if (validSmtpUser && validMailFrom) {
        diagnostics.tests.email_format = {
          status: "✅ OK",
          smtp_user: { value: smtpUser, valid: validSmtpUser },
          mail_from: { value: mailFrom, valid: validMailFrom },
        };
        console.log(`✅ SMTP_USER válido: ${smtpUser}`);
        console.log(`✅ MAIL_FROM válido: ${mailFrom}`);
      } else {
        diagnostics.tests.email_format = {
          status: "❌ FALHA",
          smtp_user: { value: smtpUser, valid: validSmtpUser },
          mail_from: { value: mailFrom, valid: validMailFrom },
        };
        if (!validSmtpUser) console.log(`❌ SMTP_USER inválido: ${smtpUser}`);
        if (!validMailFrom) console.log(`❌ MAIL_FROM inválido: ${mailFrom}`);
      }

      // Test 4: DNS Resolution
      console.log("\n📌 Test 4: Testando resolução DNS...");
      try {
        const { promises: dnsPromises } = await import("dns");
        const smtpHost = process.env.SMTP_HOST;
        const addresses = await dnsPromises.resolve4(smtpHost);
        diagnostics.tests.dns_resolution = {
          status: "✅ OK",
          host: smtpHost,
          resolved_ips: addresses,
        };
        console.log(`✅ DNS resolvido para ${smtpHost}:`);
        addresses.forEach((ip) => console.log(`   - ${ip}`));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        diagnostics.tests.dns_resolution = {
          status: "❌ FALHA",
          error: errorMsg,
        };
        console.log(`❌ Erro ao resolver DNS: ${errorMsg}`);
      }

      // Test 5: Port connectivity (simple check)
      console.log("\n📌 Test 5: Verificando port...");
      const smtpPort = parseInt(process.env.SMTP_PORT || "465");
      const smtpHost = process.env.SMTP_HOST || "";
      diagnostics.tests.port_info = {
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true" ? "SSL" : "TLS",
        message: "Nota: Conexão real testada em Test 2",
      };
      console.log(`   Host: ${smtpHost}`);
      console.log(`   Port: ${smtpPort}`);
      console.log(`   Security: ${process.env.SMTP_SECURE === "true" ? "SSL" : "TLS"}`);

      console.log("\n========== DIAGNOSTIC COMPLETO ==========\n");

      res.json({
        success: true,
        diagnostics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro no diagnóstico SMTP:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao executar diagnóstico",
        details: error instanceof Error ? error.message : "Desconhecido",
      });
    }
  });

  // DEBUG: Manually link a user to an anunciante (for fixing broken relationships) - dev only
  app.post("/api/debug/link-user-to-anunciante", guardDebugEndpoints, async (req, res) => {
    try {
      const { usuarioId, anuncianteId, papel = "gerente" } = req.body;

      if (!usuarioId || !anuncianteId) {
        return res.status(400).json({
          success: false,
          error: "usuarioId and anuncianteId are required",
        });
      }

      console.log(`\n🔗 DEBUG: Linking user ${usuarioId} to anunciante ${anuncianteId}...`);

      // Check if user exists
      const usuario = await prisma.usracessos.findUnique({
        where: { id: usuarioId },
        select: { id: true, email: true, nome: true },
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: `User ${usuarioId} not found`,
        });
      }

      // Check if anunciante exists
      const anunciante = await prisma.anunciantes.findUnique({
        where: { id: anuncianteId },
        select: { id: true, nome: true },
      });

      if (!anunciante) {
        return res.status(404).json({
          success: false,
          error: `Anunciante ${anuncianteId} not found`,
        });
      }

      // Check if linkage already exists
      const existingLink = await prisma.usuarios_anunciantes.findFirst({
        where: {
          usuarioId: usuarioId,
          anuncianteId: anuncianteId,
        },
      });

      if (existingLink) {
        return res.status(409).json({
          success: false,
          error: `User ${usuarioId} is already linked to anunciante ${anuncianteId}`,
          data: existingLink,
        });
      }

      // Create the linkage
      const linkagem = await prisma.usuarios_anunciantes.create({
        data: {
          usuarioId: usuarioId,
          anuncianteId: anuncianteId,
          papel: papel,
        },
      });

      console.log(`✅ Linkage created successfully:`, linkagem);

      res.status(201).json({
        success: true,
        message: `Successfully linked user ${usuario.nome} to anunciante ${anunciante.nome}`,
        data: {
          usuario,
          anunciante,
          linkagem,
        },
      });
    } catch (error) {
      console.error(`❌ Error linking user to anunciante:`, error);
      res.status(500).json({
        success: false,
        error: "Erro ao linkar usuário ao anunciante",
        details: error instanceof Error ? error.message : "Desconhecido",
      });
    }
  });

  // DEBUG: Check anunciantes data for a specific user (dev only)
  app.get("/api/debug/anunciantes/:usuarioId", guardDebugEndpoints, async (req, res) => {
    try {
      const usuarioId = parseInt(req.params.usuarioId);

      console.log(`\n🔍 ========== DEBUG ANUNCIANTES FOR USER ${usuarioId} ==========`);

      // 1. Check if user exists
      console.log(`\n1️⃣  Verificando usuário ${usuarioId}...`);
      const usuario = await prisma.usracessos.findUnique({
        where: { id: usuarioId },
        select: { id: true, email: true, nome: true, tipoUsuario: true },
      });

      if (!usuario) {
        console.log(`❌ Usuário ${usuarioId} não encontrado`);
        return res.status(404).json({
          success: false,
          error: `Usuário ${usuarioId} não encontrado`,
        });
      }

      console.log(`✅ Usuário encontrado:`, usuario);

      // 2. Check user-anunciante relationships
      console.log(`\n2️⃣  Verificando relacionamentos usuarios_anunciantes para usuário ${usuarioId}...`);
      const userLinks = await prisma.usuarios_anunciantes.findMany({
        where: { usuarioId: usuarioId },
        include: {
          anunciantes: {
            select: {
              id: true,
              nome: true,
              status: true,
              cnpj: true,
              email: true,
            },
          },
        },
      });

      console.log(`✅ Found ${userLinks.length} relacionamentos:`);
      userLinks.forEach((link) => {
        console.log(`   - Anunciante ID ${link.anuncianteId}: ${link.anunciantes.nome} (Papel: ${link.papel})`);
      });

      // 3. Test the query that getAnunciantesByUsuario uses
      console.log(`\n3️⃣  Testando query de getAnunciantesByUsuario...`);
      const anunciantes = await prisma.anunciantes.findMany({
        where: {
          usuarios_anunciantes: {
            some: {
              usuarioId: usuarioId,
            },
          },
        },
        select: {
          id: true,
          nome: true,
          status: true,
          tipo: true,
          email: true,
          cnpj: true,
        },
      });

      console.log(`✅ Query retornou ${anunciantes.length} anunciantes:`, anunciantes);

      res.status(200).json({
        success: true,
        debug: {
          usuario,
          usuario_anunciante_links: {
            count: userLinks.length,
            data: userLinks.map((link) => ({
              usuarioId: link.usuarioId,
              anuncianteId: link.anuncianteId,
              papel: link.papel,
              anunciante: link.anunciantes,
            })),
          },
          anunciantes_from_query: {
            count: anunciantes.length,
            data: anunciantes,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ Erro no debug de anunciantes:`, error);
      res.status(500).json({
        success: false,
        error: "Erro ao executar debug de anunciantes",
        details: error instanceof Error ? error.message : "Desconhecido",
      });
    }
  });

  app.post("/api/usracessos", extractUserId, requireAdmin, createUsuario);
  app.put("/api/usracessos/:id", extractUserId, updateUsuario);
  app.delete("/api/usracessos/:id", extractUserId, requireAdmin, deleteUsuario);
  app.patch("/api/usracessos/:id/localidade-padrao", extractUserId, updateLocalidadePadrao);
  app.patch("/api/usracessos/:id/change-password", extractUserId, changePassword);

  // Admin routes for user management
  app.put(
    "/api/admin/usracessos/:id/max-anuncios",
    extractUserId,
    requireAdmin,
    updateMaxAnunciosAtivos,
  );

  // Admin routes for user password management
  app.get(
    "/api/admin/usracessos-com-senha",
    extractUserId,
    requireAdmin,
    getUsuariosComSenha,
  );
  app.post(
    "/api/admin/usracessos/:usuarioId/reset-password",
    extractUserId,
    requireAdmin,
    adminResetUserPassword,
  );
  app.put(
    "/api/admin/usracessos/:id/profile",
    extractUserId,
    requireAdmin,
    adminUpdateUserProfile,
  );

  // Anunciantes routes (formerly Lojas)
  // Note: More specific routes must come BEFORE parameterized routes
  app.get(
    "/api/anunciantes/do-usuario/listar",
    extractUserId,
    getAnunciantesByUsuario,
  );
  app.get("/api/anunciantes", optionalAuth, getAnunciantes);
  app.get("/api/anunciantes/:id", getAnuncianteById);
  app.post("/api/anunciantes", extractUserId, createAnunciante);
  app.put("/api/anunciantes/:id", extractUserId, updateAnunciante);
  app.delete("/api/anunciantes/:id", extractUserId, requireAdmin, deleteAnunciante);
  app.post("/api/anunciantes/:id/usuarios", extractUserId, adicionarUsuarioAnunciante);
  app.get("/api/anunciantes/:anuncianteId/usuarios", getEquipeAnunciante);
  app.get(
    "/api/anunciantes/:anuncianteId/produtos-para-anuncio",
    getProdutosParaAnuncio,
  );

  // NOTE: /api/lojas routes have been consolidated with /api/anunciantes routes
  // All /api/lojas calls should be updated to /api/anunciantes

  // Grupos de Productos routes
  app.get("/api/grupos-productos", optionalAuth, getGrupos);
  app.get("/api/grupos-productos/:id", getGrupoById);
  app.get("/api/grupos-productos/:id/productos", getProductosOfGrupo);
  // NOTE: /api/lojas/:anuncianteId/grupos-productos has been removed
  // Use /api/grupos-productos?anuncianteId=X instead
  app.post("/api/grupos-productos", extractUserId, createGrupo);
  app.put("/api/grupos-productos/:id", extractUserId, updateGrupo);
  app.delete("/api/grupos-productos/:id", extractUserId, deleteGrupo);

  // Productos routes
  app.get("/api/productos", getProductos);
  app.get("/api/productos/:id", getProductoById);
  app.post("/api/productos", extractUserId, createProducto);
  app.put("/api/productos/:id", extractUserId, updateProducto);
  app.delete("/api/productos/:id", extractUserId, deleteProducto);

  // Tabelas de Preço routes
  app.get("/api/tabelas-preco", getTabelas);
  app.get("/api/tabelas-preco/:id", getTabelaById);
  app.post("/api/tabelas-preco", extractUserId, createTabela);
  app.put("/api/tabelas-preco/:id", extractUserId, updateTabela);
  app.delete("/api/tabelas-preco/:id", extractUserId, deleteTabela);

  // Anúncios routes
  // Note: More specific routes must come BEFORE parameterized routes
  app.get(
    "/api/anuncios/do-usuario/listar",
    extractUserId,
    getAnunciosDUsuario,
  );
  app.get("/api/anuncios", getAnuncios);
  app.get("/api/anuncios/:id", getAnuncioById);
  app.post("/api/anuncios", extractUserId, createAnuncio);
  app.put("/api/anuncios/:id", extractUserId, updateAnuncio);
  app.patch("/api/anuncios/:id/status", updateAnuncioStatus);
  app.patch(
    "/api/anuncios/:id/override-status",
    extractUserId,
    requireAdmin,
    overrideAnuncioStatus,
  );
  app.patch(
    "/api/anuncios/:id/destaque",
    extractUserId,
    requireAdmin,
    toggleDestaqueAnuncio,
  );
  app.patch(
    "/api/anuncios/:id/ordem",
    extractUserId,
    requireAdmin,
    updateAnuncioOrdem,
  );
  app.patch("/api/anuncios/:id/inactivate", inactivateAnuncio);
  app.patch("/api/anuncios/:id/activate", activateAnuncio);
  app.delete("/api/anuncios/:id", deleteAnuncio);
  app.get("/api/anuncios/:id/can-edit", optionalAuth, canEditAnuncio);
  app.post("/api/anuncios/:id/view", optionalAuth, recordAnuncioView);

  // Anúncio Photos routes
  app.get("/api/anuncios/:id/fotos", getAnuncioFotos);
  app.post("/api/anuncios/:id/fotos", extractUserId, addAnuncioFoto);
  app.delete(
    "/api/anuncios/:id/fotos/:fotoId",
    extractUserId,
    deleteAnuncioFoto,
  );
  app.patch(
    "/api/anuncios/:id/fotos/reorder",
    extractUserId,
    reorderAnuncioFotos,
  );

  // Equipes de Venda routes
  app.get("/api/equipes-venda", extractUserId, getEquipes);
  app.get("/api/equipes-venda/:id", extractUserId, getEquipeById);
  app.post("/api/equipes-venda", extractUserId, createEquipe);
  app.put("/api/equipes-venda/:id", extractUserId, updateEquipe);
  app.delete("/api/equipes-venda/:id", deleteEquipe);
  app.post("/api/equipes-venda/:id/membros", extractUserId, adicionarMembro);
  app.put(
    "/api/equipes-venda/:id/membros/:membroId",
    extractUserId,
    atualizarMembro,
  );
  app.delete(
    "/api/equipes-venda/:id/membros/:membroId",
    extractUserId,
    removerMembro,
  );
  app.get(
    "/api/equipes-venda/:id/usuarios-disponiveis",
    getUsuariosDisponiveis,
  );
  app.get(
    "/api/equipes-venda/:equipeId/membros-disponiveis",
    getMembrosDisponiveis,
  );

  // Listas de Desejos (Wishlists) routes
  app.get("/api/listas-desejos", extractUserId, getListasDesejos);
  app.get("/api/listas-desejos/:id", optionalAuth, getListaDesejosById);
  app.post("/api/listas-desejos", extractUserId, createListaDesejos);
  app.put("/api/listas-desejos/:id", extractUserId, updateListaDesejos);
  app.delete("/api/listas-desejos/:id", extractUserId, deleteListaDesejos);

  // Wishlist items routes
  app.post(
    "/api/listas-desejos/:listaId/itens/livre",
    extractUserId,
    addItemLivre,
  );
  app.post(
    "/api/listas-desejos/:listaId/itens/anuncio",
    extractUserId,
    addItemAnuncio,
  );
  app.put(
    "/api/listas-desejos/:listaId/itens/:itemId",
    extractUserId,
    updateItemListaDesejos,
  );
  app.delete(
    "/api/listas-desejos/:listaId/itens/:itemId",
    extractUserId,
    deleteItemListaDesejos,
  );

  // Wishlist permissions routes
  app.post(
    "/api/listas-desejos/:listaId/permissoes",
    extractUserId,
    addPermissaoListaDesejos,
  );
  app.delete(
    "/api/listas-desejos/:listaId/permissoes/:permissaoId",
    extractUserId,
    removePermissaoListaDesejos,
  );

  // GET users who added ad to wishlists (owner or admin only)
  app.get(
    "/api/anuncios/:anuncioId/usuarios-lista-desejos",
    extractUserId,
    listarUsuariosListaDesejosParaAnuncio,
  );

  // Agendas (Service Schedule) routes
  app.get("/api/agendas", getAgendas);
  app.get("/api/agendas/:id", getAgendaById);
  app.post("/api/agendas", createAgenda);
  app.patch("/api/agendas/:id/status", updateAgendaStatus);
  app.delete("/api/agendas/:id", deleteAgenda);

  // Waitlist routes
  app.post("/api/agendas/waitlist/add", addToWaitlist);
  app.get("/api/agendas/:agendaId/waitlist", getWaitlist);
  app.delete("/api/agendas/waitlist/:waitlistId", removeFromWaitlist);
  app.post("/api/agendas/:agendaId/waitlist/promote", promoteFromWaitlist);

  // Eventos de Agenda do Anunciante routes
  app.get("/api/eventos-agenda/anunciante/:anuncianteId", extractUserId, getEventosByAnunciante);
  app.get("/api/eventos-agenda/visiveis/:anuncianteId", getEventosVisivelsPara);
  app.get("/api/eventos-agenda/:anuncianteId/privacy-status", extractUserId, getAgendaPrivacyStatus);
  app.get("/api/eventos-agenda/:anuncianteId/is-announcer", extractUserId, isUserAnunciante);
  app.get("/api/eventos-agenda/:eventoId/can-edit", extractUserId, canUserEditEvento);
  app.post("/api/eventos-agenda", extractUserId, createEvento);
  app.post("/api/eventos-agenda/visitante/criar", optionalAuth, createEventoVisitante); // Allows guests, links to account if logged in
  app.put("/api/eventos-agenda/:id", extractUserId, updateEvento);
  app.delete("/api/eventos-agenda/:id", extractUserId, deleteEvento);
  app.post("/api/eventos-agenda/:id/permissoes", extractUserId, addPermissao);
  app.delete("/api/eventos-agenda/:id/permissoes/:usuarioId", extractUserId, removePermissao);
  app.patch("/api/eventos-agenda/:eventoId/status", extractUserId, atualizarStatusEvento);
  app.get("/api/eventos-agenda/:id/usuarios", extractUserId, getEventoUsers);
  app.post("/api/eventos-agenda/:id/usuarios", extractUserId, addUserToEvento);

  // Search usuarios route
  app.get("/api/usuarios/search", extractUserId, searchUsers);

  // Filas de Espera para Eventos routes
  app.get("/api/filas-espera/anunciante/:anuncianteId", extractUserId, getFilasEsperaParaAnunciante);
  app.get("/api/filas-espera/usuario", extractUserId, getFilasEsperaPorUsuario);
  app.get("/api/filas-espera/visiveis/:anuncianteId", extractUserId, getFilasEsperaVisivelsPara);
  app.get("/api/filas-espera/:filaId/can-edit", extractUserId, canUserEditFila);
  app.post("/api/filas-espera", extractUserId, createFilaEspera);
  app.post("/api/filas-espera/:filaId/aprovar", extractUserId, aprovarFilaEspera);
  app.post("/api/filas-espera/:filaId/rejeitar", extractUserId, rejeitarFilaEspera);
  app.post("/api/filas-espera/:filaId/cancelar", extractUserId, cancelarFilaEspera);
  app.post("/api/filas-espera/permissoes/add", extractUserId, addFilaPermissao);
  app.post("/api/filas-espera/permissoes/remove", extractUserId, removeFilaPermissao);

  // Agenda deletion route
  app.delete("/api/agenda/:anuncianteId", extractUserId, deletarAgenda);

  // Agendas Horários routes (schedule management)
  app.get("/api/agendas-horarios", getHorariosAgenda);
  app.post("/api/agendas-horarios", saveHorariosAgenda);
  app.get("/api/agendas-horarios/check-time", isTimeWithinSchedule);

  // Reservas de Evento routes
  app.post("/api/reservas-evento", optionalAuth, criarReservaOuListaEspera);
  app.get("/api/reservas-evento/:eventoId", extractUserId, getReservasDoEvento);
  app.get("/api/reservas-evento/:eventoId/count", getReservaCount);
  app.patch("/api/reservas-evento/:id/confirmar", extractUserId, confirmarReserva);
  app.patch("/api/reservas-evento/:id/rejeitar", extractUserId, rejeitarReserva);
  app.patch("/api/reservas-evento/:id/cancelar", extractUserId, cancelarReserva);

  // Pagamentos (Payment) routes
  app.get("/api/pagamentos", extractUserId, requireAdmin, getPagamentos);
  app.get("/api/pagamentos/anuncio/:anuncioId", extractUserId, getPagamentoByAnuncioId);
  app.get("/api/pagamentos/:id/status", extractUserId, getPagamentoStatus);
  app.post("/api/pagamentos", extractUserId, createPagamento);
  app.patch("/api/pagamentos/:id/status", extractUserId, updatePagamentoStatus);
  app.delete("/api/pagamentos/:id/cancel", extractUserId, cancelPagamento);
  app.post("/api/webhooks/pagamentos", handlePaymentWebhook); // Keep public for external webhooks, but handler must validate signatures
  app.post("/api/pagamentos/:id/comprovante", extractUserId, uploadComprovantePagemento);
  app.post("/api/pagamentos/:id/aprovar", extractUserId, requireAdmin, aprovarPagamento);
  app.post("/api/pagamentos/:id/rejeitar", extractUserId, requireAdmin, rejeitarPagamento);
  app.post("/api/anuncios/:anuncioId/marcar-pagamento-realizado", extractUserId, marcarPagamentoRealizado);
  app.patch(
    "/api/pagamentos/:id/confirmar",
    extractUserId,
    requireAdmin,
    confirmarPagamento,
  );

  // Conversas (Chat Conversations) routes
  app.get("/api/conversas", getConversas);
  app.get("/api/conversas/:id", getConversaById);
  app.post("/api/conversas", createConversa);
  app.delete("/api/conversas/:id", deleteConversa);

  // Mensagens (Chat Messages) routes
  app.get("/api/conversas/:conversaId/mensagens", getMensagensConversa);
  app.post("/api/mensagens", createMensagem);
  app.patch("/api/mensagens/:id/read", markMensagemAsRead);
  app.patch("/api/conversas/:conversaId/read", markConversaAsRead);
  app.get("/api/usuarios/:usuarioId/mensagens/unread", getUnreadCount);
  app.delete("/api/mensagens/:id", deleteMensagem);
  app.get("/api/mensagens/unread-count", extractUserId, getUnreadMessagesCount);

  // Dashboard endpoints - Get stats for user dashboard
  app.get("/api/reservas-evento/pending-count", extractUserId, getPendingAppointmentsCount);
  app.get("/api/filas-espera/user-count", extractUserId, getWaitingListCount);

  // Funcionalidades (Features/Permissions) routes
  // Granting/revoking permissions is admin-only: these define what any user account can do,
  // so leaving them unguarded is a direct privilege-escalation path.
  app.get("/api/funcionalidades", getFuncionalidades);
  app.get("/api/funcionalidades/:id", getFuncionalidadeById);
  app.get(
    "/api/usuarios/:usuarioId/funcionalidades",
    extractUserId,
    getFuncionalidadesByUsuario,
  );
  app.post("/api/funcionalidades", extractUserId, requireAdmin, createFuncionalidade);
  app.put("/api/funcionalidades/:id", extractUserId, requireAdmin, updateFuncionalidade);
  app.delete("/api/funcionalidades/:id", extractUserId, requireAdmin, deleteFuncionalidade);

  // Usuario x Funcionalidades (User-Permission mapping) routes
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant",
    extractUserId,
    requireAdmin,
    grantFuncionalidade,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant-multiple",
    extractUserId,
    requireAdmin,
    grantFuncionalidades,
  );
  app.delete(
    "/api/usuarios/:usuarioId/funcionalidades/:funcionalidadeId",
    extractUserId,
    requireAdmin,
    revokeFuncionalidade,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/revoke-multiple",
    extractUserId,
    requireAdmin,
    revokeFuncionalidades,
  );
  app.get("/api/usuarios-funcionalidades", extractUserId, requireAdmin, listUserFuncionalidades);
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant-all",
    extractUserId,
    requireAdmin,
    grantAllFuncionalidades,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/revoke-all",
    extractUserId,
    requireAdmin,
    revokeAllFuncionalidades,
  );

  // Banners routes
  app.get("/api/banners", getBanners);
  app.get("/api/banners/:id", getBannerById);
  app.post("/api/banners", extractUserId, requireAdmin, createBanner);
  app.put("/api/banners/:id", extractUserId, requireAdmin, updateBanner);
  app.delete("/api/banners/:id", extractUserId, requireAdmin, deleteBanner);
  app.post("/api/banners/reorder", extractUserId, requireAdmin, reorderBanners);

  // Localidades routes (admin only)
  app.get("/api/localidades", getLocalidades);
  app.get("/api/localidades/:id", getLocalidadeById);
  app.post("/api/localidades", extractUserId, requireAdmin, createLocalidade);
  app.put("/api/localidades/:id", extractUserId, requireAdmin, updateLocalidade);
  app.delete("/api/localidades/:id", extractUserId, requireAdmin, deleteLocalidade);
  app.get("/api/localidades/:id/anunciantes", getAnunciantesForLocalidade);
  app.post("/api/localidades/:id/anunciantes", extractUserId, requireAdmin, addAnuncianteToLocalidade);
  app.delete("/api/localidades/:id/anunciantes/:anuncianteId", extractUserId, requireAdmin, removeAnuncianteFromLocalidade);

  // Contatos routes (user-based contacts, shared across announcers)
  app.get("/api/contatos", extractUserId, getContatosByAnunciante); // Returns user's contacts (or all if admin)
  app.post("/api/contatos", extractUserId, createContato);
  app.post("/api/contatos/check-duplicates", extractUserId, checkDuplicateContato);
  app.put("/api/contatos/:contatoId", extractUserId, updateContato);
  app.delete("/api/contatos/:contatoId", extractUserId, deleteContato);

  // Backwards compatibility: old announcer-based routes redirect to new user-based routes
  app.get("/api/anunciantes/:anuncianteId/contatos", extractUserId, getContatosByAnunciante);
  app.post("/api/anunciantes/:anuncianteId/contatos", extractUserId, createContato);
  app.put("/api/anunciantes/:anuncianteId/contatos/:contatoId", extractUserId, updateContato);
  app.delete("/api/anunciantes/:anuncianteId/contatos/:contatoId", extractUserId, deleteContato);

  // Categorias routes (admin CRUD, public read)
  app.use("/api/categorias", categoriasRouter);

  // Reservas de Anuncio routes
  app.use("/api", reservasAnuncioRouter);

  // Sync contatos-usuarios (hourly synchronization)
  app.post("/api/sync/contatos-usuarios", syncContatosUsuarios);
  app.get("/api/contatos/:contatoId/usuarios", extractUserId, getLinkedUsuariosForContato);
  app.get("/api/usuarios/contatos-linked", extractUserId, getLinkedContatosForUsuario);

  // Contratos financeiros (mensalidades, reajustes, documentos)
  app.get("/api/contratos-financeiros/anunciante/:anuncianteId", extractUserId, listarContratos);
  app.post("/api/contratos-financeiros", extractUserId, criarContrato);
  app.put("/api/contratos-financeiros/:id", extractUserId, atualizarContrato);
  app.patch("/api/contratos-financeiros/:id/status", extractUserId, atualizarStatusContrato);
  app.post("/api/contratos-financeiros/:id/reajuste", extractUserId, criarReajuste);
  app.post("/api/contratos-financeiros/:id/documentos", extractUserId, anexarDocumentoContrato);
  app.post("/api/contratos-financeiros/lancar-lote", extractUserId, lancarLoteContratos);
  app.post("/api/contratos-financeiros/:id/lancar", extractUserId, lancarMesContrato);

  // Lançamentos financeiros (cobranças de agenda, mensalidade e avulsas)
  app.get("/api/lancamentos-financeiros/anunciante/:anuncianteId", extractUserId, listarLancamentos);
  app.get("/api/lancamentos-financeiros/evento/:eventoId", extractUserId, obterLancamentoDoEvento);
  app.get("/api/lancamentos-financeiros/anuncio/:anuncioId", extractUserId, listarLancamentosDoAnuncio);
  app.post("/api/lancamentos-financeiros", extractUserId, criarLancamento);
  app.patch("/api/lancamentos-financeiros/:id", extractUserId, atualizarLancamento);
  app.post("/api/lancamentos-financeiros/:id/pix", extractUserId, gerarPixLancamento);
  app.post("/api/lancamentos-financeiros/:id/comprovante", extractUserId, anexarComprovanteLancamento);
  app.patch("/api/lancamentos-financeiros/:id/pagar", extractUserId, marcarLancamentoPago);
  app.patch("/api/lancamentos-financeiros/:id/cancelar", extractUserId, cancelarLancamento);
  app.post("/api/lancamentos-financeiros/:id/enviar-recibo", extractUserId, enviarReciboPorEmail);

  // Recibo público (sem autenticação - o contato/cliente não tem login na plataforma)
  app.get("/api/lancamentos-financeiros/recibo/:token", obterReciboPublico);

  // Financeiro - visão administrativa (Vitrii audita qualquer anunciante)
  app.get("/api/admin/lancamentos-financeiros", extractUserId, requireAdmin, adminListarLancamentos);
  app.get("/api/admin/contratos-financeiros", extractUserId, requireAdmin, adminListarContratos);

  // Dashboard (cache pré-computado — nunca agrega ao vivo; "somatorio" tem que vir antes
  // de ":anuncianteId" para não ser engolido pela rota de parâmetro)
  app.get("/api/dashboard/somatorio", extractUserId, obterDashboardSomatorio);
  app.get("/api/dashboard/:anuncianteId", extractUserId, obterDashboard);
  app.post("/api/dashboard/:anuncianteId/reprocessar", extractUserId, reprocessarDashboard);

  // Check APP_URL configuration
  app.get("/api/check-app-url", (_req, res) => {
    const appUrl = process.env.APP_URL || "https://app.vitrii.com.br";
    res.json({
      success: true,
      appUrl,
      appUrlFromEnv: process.env.APP_URL || "NOT SET",
      fallback: "https://app.vitrii.com.br",
      isLocalhost: appUrl.includes("localhost"),
    });
  });

  // Global error handling middleware for this sub-app
  // Must be added AFTER all routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[API Error]", {
      message: err.message,
      stack: err.stack?.substring(0, 500),
      status: err.status || 500,
    });

    res.status(err.status || 500).json({
      success: false,
      error: "Erro no servidor",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Erro interno do servidor",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack?.substring(0, 300),
      }),
    });
  });

  return app;
}
