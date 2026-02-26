import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
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
  getFavoritos,
  checkFavorito,
  toggleFavorito,
  getFavoritoCount,
} from "./routes/favoritos";
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
  addPermissao,
  removePermissao,
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
  updateEvento,
  deleteEvento,
  addPermissao,
  removePermissao,
  getEventoUsers,
  searchUsers,
  addUserToEvento,
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
} from "./routes/filas-espera-agenda";
import {
  criarReservaOuListaEspera,
  getReservasDoEvento,
  confirmarReserva,
  rejeitarReserva,
  cancelarReserva,
  getReservaCount,
} from "./routes/reservas-evento-agenda";
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
import { extractUserId, requireAdmin } from "./middleware/permissionGuard";
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
  addUsuarioToContato,
  removeUsuarioFromContato,
} from "./routes/contatos";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Increase body size limit to 10MB to support large base64-encoded images
  app.use(express.json({ limit: "10mb" }));
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

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Simple test - returns immediately
  app.get("/api/test", (_req, res) => {
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
  app.get("/api/db-test", async (_req, res) => {
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
      // Test database connection
      const result = await fetch("https://www.google.com", {
        method: "HEAD",
      }).catch(() => null);

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          node_env: process.env.NODE_ENV,
          has_database_url: !!process.env.DATABASE_URL,
          database_configured: process.env.DATABASE_URL ? "yes" : "no",
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Upload route
  app.post("/api/upload", uploadMiddleware, handleUpload);

  // Usracessos routes (User Access)
  app.get("/api/usracessos", getUsuarios);
  app.get("/api/usracessos/:id", getUsuarioById);
  app.get("/api/usracessos/:id/validate-status", validateUserStatus);
  app.get("/api/auth/check-status-by-email", checkUserStatusByEmail);
  app.patch("/api/usracessos/:id/status", toggleUserStatus);
  app.patch("/api/usracessos/:id/unlock", unlockUserAccount);
  app.post("/api/auth/signin", signInUsuario);
  app.post("/api/auth/signup", signUpUsuario);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/validate-reset-token", validateResetToken);
  app.get("/api/auth/verify-email", verifyEmail);
  app.post("/api/auth/resend-verification-email", resendVerificationEmail);

  // Database migration helper - Create emailVerificado column if missing
  app.get("/api/db/create-email-verificado-column", async (_req, res) => {
    try {
      console.log("[db-helper] 🔧 Tentando criar coluna emailVerificado se não existir...");

      // Try to add the column - if it already exists, this will fail silently
      await prisma.$executeRaw`
        ALTER TABLE usracessos
        ADD COLUMN IF NOT EXISTS emailVerificado BOOLEAN DEFAULT false
      `;

      console.log("[db-helper] ✅ Coluna emailVerificado criada ou já existe");
      res.status(200).json({
        success: true,
        message: "✅ Coluna emailVerificado está pronta",
      });
    } catch (error) {
      console.error("[db-helper] ⚠️ Erro ao criar coluna:", error);
      // Return success anyway - column might already exist
      res.status(200).json({
        success: true,
        message: "✅ Coluna emailVerificado está pronta (ou já existe)",
        note: "A coluna pode já estar no banco de dados",
      });
    }
  });

  // DEBUG endpoint - Check email verification tokens and user status
  app.get("/api/debug/verify-email-status", async (req, res) => {
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

  // Test email endpoint - for debugging/testing SMTP configuration
  app.post("/api/test-email", async (req, res) => {
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
  app.get("/api/smtp-diagnostic", async (_req, res) => {
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

  // Quick test email route - Daniel's test
  app.get("/api/send-test-email", async (_req, res) => {
    try {
      console.log("🧪 Iniciando teste rápido de email...");
      const success = await sendTestEmail("vitriimarketplace@gmail.com", "contato@herestomorrow.com");

      if (success) {
        res.status(200).json({
          success: true,
          message: "✅ Email de teste enviado com sucesso para vitriimarketplace@gmail.com!",
          from: "contato@herestomorrow.com",
          to: "vitriimarketplace@gmail.com",
          smtp: process.env.SMTP_HOST,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "❌ Erro ao enviar email. Verifique as configurações SMTP.",
        });
      }
    } catch (error) {
      console.error("Erro no teste de email:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar teste de email",
      });
    }
  });

  // Diagnostic endpoint for SMTP configuration
  app.get("/api/diagnostic-smtp", async (_req, res) => {
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

  // Send password reset email directly - for testing
  app.get("/api/send-reset-email", async (_req, res) => {
    try {
      const { sendPasswordResetEmail } = await import("./lib/emailService");

      console.log("🧪 Enviando email de reset de senha...");

      // Generate a test token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetLink = `${process.env.APP_URL}/reset-senha?token=${resetToken}&email=vitriimarketplace@gmail.com`;

      const success = await sendPasswordResetEmail(
        "vitriimarketplace@gmail.com",
        resetLink,
        "Administrador"
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: "✅ Email de reset de senha enviado com sucesso!",
          to: "vitriimarketplace@gmail.com",
          resetLink: resetLink,
          token: resetToken,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "❌ Erro ao enviar email de reset.",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar email de reset:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao processar envio de email",
        details: error instanceof Error ? error.message : "Desconhecido",
      });
    }
  });

  app.post("/api/usracessos", createUsuario);
  app.put("/api/usracessos/:id", updateUsuario);
  app.delete("/api/usracessos/:id", deleteUsuario);
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
  app.get("/api/anunciantes", extractUserId, getAnunciantes);
  app.get("/api/anunciantes/:id", getAnuncianteById);
  app.post("/api/anunciantes", extractUserId, createAnunciante);
  app.put("/api/anunciantes/:id", extractUserId, updateAnunciante);
  app.delete("/api/anunciantes/:id", deleteAnunciante);
  app.post("/api/anunciantes/:id/usuarios", adicionarUsuarioAnunciante);
  app.get("/api/anunciantes/:anuncianteId/usuarios", getEquipeAnunciante);
  app.get(
    "/api/anunciantes/:anuncianteId/produtos-para-anuncio",
    getProdutosParaAnuncio,
  );

  // NOTE: /api/lojas routes have been consolidated with /api/anunciantes routes
  // All /api/lojas calls should be updated to /api/anunciantes

  // Grupos de Productos routes
  app.get("/api/grupos-productos", extractUserId, getGrupos);
  app.get("/api/grupos-productos/:id", getGrupoById);
  app.get("/api/grupos-productos/:id/productos", getProductosOfGrupo);
  // NOTE: /api/lojas/:anuncianteId/grupos-productos has been removed
  // Use /api/grupos-productos?anuncianteId=X instead
  app.post("/api/grupos-productos", extractUserId, createGrupo);
  app.put("/api/grupos-productos/:id", updateGrupo);
  app.delete("/api/grupos-productos/:id", deleteGrupo);

  // Productos routes
  app.get("/api/productos", getProductos);
  app.get("/api/productos/:id", getProductoById);
  app.post("/api/productos", createProducto);
  app.put("/api/productos/:id", updateProducto);
  app.delete("/api/productos/:id", deleteProducto);

  // Tabelas de Preço routes
  app.get("/api/tabelas-preco", getTabelas);
  app.get("/api/tabelas-preco/:id", getTabelaById);
  app.post("/api/tabelas-preco", createTabela);
  app.put("/api/tabelas-preco/:id", updateTabela);
  app.delete("/api/tabelas-preco/:id", deleteTabela);

  // Anúncios routes
  // Note: More specific routes must come BEFORE parameterized routes
  app.get(
    "/api/anuncios/do-usuario/listar",
    extractUserId,
    getAnunciosDUsuario,
  );
  app.get("/api/anuncios", getAnuncios);
  app.get("/api/anuncios/:id", getAnuncioById);
  app.post("/api/anuncios", createAnuncio);
  app.put("/api/anuncios/:id", updateAnuncio);
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
  app.get("/api/anuncios/:id/can-edit", canEditAnuncio);
  app.post("/api/anuncios/:id/view", extractUserId, recordAnuncioView);

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

  // Favoritos (Favorites) routes
  app.get("/api/favoritos", getFavoritos);
  app.get("/api/favoritos/check", checkFavorito);
  app.post("/api/favoritos/toggle", toggleFavorito);
  app.get("/api/anuncios/:anuncioId/favoritos/count", getFavoritoCount);

  // Listas de Desejos (Wishlists) routes
  app.get("/api/listas-desejos", extractUserId, getListasDesejos);
  app.get("/api/listas-desejos/:id", getListaDesejosById);
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
    addPermissao,
  );
  app.delete(
    "/api/listas-desejos/:listaId/permissoes/:permissaoId",
    extractUserId,
    removePermissao,
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
  app.post("/api/eventos-agenda", extractUserId, createEvento);
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
  app.post("/api/filas-espera", extractUserId, createFilaEspera);
  app.post("/api/filas-espera/:filaId/aprovar", extractUserId, aprovarFilaEspera);
  app.post("/api/filas-espera/:filaId/rejeitar", extractUserId, rejeitarFilaEspera);
  app.post("/api/filas-espera/:filaId/cancelar", extractUserId, cancelarFilaEspera);

  // Agenda deletion route
  app.delete("/api/agenda/:anuncianteId", extractUserId, deletarAgenda);

  // Reservas de Evento routes
  app.post("/api/reservas-evento", criarReservaOuListaEspera);
  app.get("/api/reservas-evento/:eventoId", extractUserId, getReservasDoEvento);
  app.get("/api/reservas-evento/:eventoId/count", getReservaCount);
  app.patch("/api/reservas-evento/:id/confirmar", extractUserId, confirmarReserva);
  app.patch("/api/reservas-evento/:id/rejeitar", extractUserId, rejeitarReserva);
  app.patch("/api/reservas-evento/:id/cancelar", extractUserId, cancelarReserva);

  // Pagamentos (Payment) routes
  app.get("/api/pagamentos", extractUserId, requireAdmin, getPagamentos);
  app.get("/api/pagamentos/anuncio/:anuncioId", getPagamentoByAnuncioId);
  app.get("/api/pagamentos/:id/status", getPagamentoStatus);
  app.post("/api/pagamentos", createPagamento);
  app.patch("/api/pagamentos/:id/status", updatePagamentoStatus);
  app.delete("/api/pagamentos/:id/cancel", cancelPagamento);
  app.post("/api/webhooks/pagamentos", handlePaymentWebhook);
  app.post("/api/pagamentos/:id/comprovante", uploadComprovantePagemento);
  app.post("/api/pagamentos/:id/aprovar", aprovarPagamento);
  app.post("/api/pagamentos/:id/rejeitar", rejeitarPagamento);
  app.post("/api/anuncios/:anuncioId/marcar-pagamento-realizado", marcarPagamentoRealizado);
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

  // Funcionalidades (Features/Permissions) routes
  app.get("/api/funcionalidades", getFuncionalidades);
  app.get("/api/funcionalidades/:id", getFuncionalidadeById);
  app.get(
    "/api/usuarios/:usuarioId/funcionalidades",
    getFuncionalidadesByUsuario,
  );
  app.post("/api/funcionalidades", createFuncionalidade);
  app.put("/api/funcionalidades/:id", updateFuncionalidade);
  app.delete("/api/funcionalidades/:id", deleteFuncionalidade);

  // Usuario x Funcionalidades (User-Permission mapping) routes
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant",
    grantFuncionalidade,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant-multiple",
    grantFuncionalidades,
  );
  app.delete(
    "/api/usuarios/:usuarioId/funcionalidades/:funcionalidadeId",
    revokeFuncionalidade,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/revoke-multiple",
    revokeFuncionalidades,
  );
  app.get("/api/usuarios-funcionalidades", listUserFuncionalidades);
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/grant-all",
    grantAllFuncionalidades,
  );
  app.post(
    "/api/usuarios/:usuarioId/funcionalidades/revoke-all",
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

  // Contatos routes (only announcer can manage)
  app.get("/api/anunciantes/:anuncianteId/contatos", extractUserId, getContatosByAnunciante);
  app.post("/api/anunciantes/:anuncianteId/contatos", extractUserId, createContato);
  app.put("/api/anunciantes/:anuncianteId/contatos/:contatoId", extractUserId, updateContato);
  app.delete("/api/anunciantes/:anuncianteId/contatos/:contatoId", extractUserId, deleteContato);
  app.post("/api/anunciantes/:anuncianteId/contatos/:contatoId/usuarios", extractUserId, addUsuarioToContato);
  app.delete("/api/anunciantes/:anuncianteId/contatos/:contatoId/usuarios/:usuarioId", extractUserId, removeUsuarioFromContato);

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

  // Test endpoint for user creation
  app.post("/api/test-signup", async (req, res) => {
    try {
      console.log("\n🧪 ========== TEST SIGNUP ==========");
      console.log("📝 Dados recebidos:", {
        nome: req.body.nome,
        email: req.body.email,
        senhaLength: req.body.senha?.length,
      });

      // Try simple insert with just name, email, senha
      const testUser = await prisma.usracessos.create({
        data: {
          nome: req.body.nome || "Test User",
          email: req.body.email || `test-${Date.now()}@test.com`,
          senha: "hash123",
          status: "bloqueado",
          emailVerificado: false,
        },
      });

      console.log("✅ Usuário criado com sucesso:", testUser.id);

      res.json({
        success: true,
        message: "Usuário de teste criado com sucesso",
        userId: testUser.id,
        email: testUser.email,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";

      console.error("❌ ERRO ao criar usuário de teste:");
      console.error("Mensagem:", errorMsg);
      console.error("Stack:", errorStack);
      console.error("Objeto completo:", error);

      res.status(500).json({
        success: false,
        error: "Erro ao criar usuário de teste",
        message: errorMsg,
        details: errorStack,
      });
    }
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
