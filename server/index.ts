import "dotenv/config";
import express from "express";
import cors from "cors";
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
  signInUsuario,
  signUpUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getUsuariosComSenha,
  adminResetUserPassword,
  adminUpdateUserProfile,
  updateMaxAnunciosAtivos,
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
  getPagamentoByAnuncioId,
  createPagamento,
  updatePagamentoStatus,
  getPagamentoStatus,
  handlePaymentWebhook,
  cancelPagamento,
  uploadComprovantePagemento,
  aprovarPagamento,
  rejeitarPagamento,
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
import { extractUserId, requireAdmin } from "./middleware/permissionGuard";
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "./routes/banners";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Increase body size limit to 10MB to support large base64-encoded images
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
  app.post("/api/auth/signin", signInUsuario);
  app.post("/api/auth/signup", signUpUsuario);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/reset-password", resetPassword);
  app.get("/api/auth/validate-reset-token", validateResetToken);

  app.post("/api/usracessos", createUsuario);
  app.put("/api/usracessos/:id", updateUsuario);
  app.delete("/api/usracessos/:id", deleteUsuario);

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
  app.post("/api/anunciantes", createAnunciante);
  app.put("/api/anunciantes/:id", extractUserId, updateAnunciante);
  app.delete("/api/anunciantes/:id", deleteAnunciante);
  app.post("/api/anunciantes/:id/usuarios", adicionarUsuarioAnunciante);
  app.get("/api/anunciantes/:anuncianteId/usuarios", getEquipeAnunciante);
  app.get(
    "/api/anunciantes/:anuncianteId/produtos-para-anuncio",
    getProdutosParaAnuncio,
  );

  // Backward compatibility routes (still using /api/lojas)
  app.get("/api/lojas", extractUserId, getAnunciantes);
  app.get("/api/lojas/:id", getAnuncianteById);
  app.post("/api/lojas", createAnunciante);
  app.put("/api/lojas/:id", extractUserId, updateAnunciante);
  app.delete("/api/lojas/:id", deleteAnunciante);
  app.get(
    "/api/lojas/:anuncianteId/produtos-para-anuncio",
    getProdutosParaAnuncio,
  );

  // Grupos de Productos routes
  app.get("/api/grupos-productos", extractUserId, getGrupos);
  app.get("/api/grupos-productos/:id", getGrupoById);
  app.get("/api/grupos-productos/:id/productos", getProductosOfGrupo);
  app.get(
    "/api/lojas/:anuncianteId/grupos-productos",
    extractUserId,
    (req, res) => {
      // Delegate to getGrupos with anuncianteId query param
      req.query.anuncianteId = req.params.anuncianteId;
      return getGrupos(req, res);
    },
  );
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

  // Pagamentos (Payment) routes
  app.get("/api/pagamentos/anuncio/:anuncioId", getPagamentoByAnuncioId);
  app.get("/api/pagamentos/:id/status", getPagamentoStatus);
  app.post("/api/pagamentos", createPagamento);
  app.patch("/api/pagamentos/:id/status", updatePagamentoStatus);
  app.delete("/api/pagamentos/:id/cancel", cancelPagamento);
  app.post("/api/webhooks/pagamentos", handlePaymentWebhook);
  app.post("/api/pagamentos/:id/comprovante", uploadComprovantePagemento);
  app.post("/api/pagamentos/:id/aprovar", aprovarPagamento);
  app.post("/api/pagamentos/:id/rejeitar", rejeitarPagamento);

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
