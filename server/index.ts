import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getAnuncios,
  getAnuncioById,
  createAnuncio,
  updateAnuncio,
  updateAnuncioStatus,
  deleteAnuncio,
  getProdutosParaAnuncio,
} from "./routes/anuncios";
import {
  getLojas,
  getLojaById,
  createLoja,
  updateLoja,
  deleteLoja,
} from "./routes/lojas";
import {
  getUsuarios,
  getUsuarioById,
  signInUsuario,
  signUpUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "./routes/usuarios";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Usuários routes
  app.get("/api/usuarios", getUsuarios);
  app.get("/api/usuarios/:id", getUsuarioById);
  app.post("/api/auth/signin", signInUsuario);
  app.post("/api/auth/signup", signUpUsuario);
  app.post("/api/usuarios", createUsuario);
  app.put("/api/usuarios/:id", updateUsuario);
  app.delete("/api/usuarios/:id", deleteUsuario);

  // Lojas routes
  app.get("/api/lojas", getLojas);
  app.get("/api/lojas/:id", getLojaById);
  app.post("/api/lojas", createLoja);
  app.put("/api/lojas/:id", updateLoja);
  app.delete("/api/lojas/:id", deleteLoja);
  app.get("/api/lojas/:lojaId/produtos-para-anuncio", getProdutosParaAnuncio);

  // Anúncios routes
  app.get("/api/anuncios", getAnuncios);
  app.get("/api/anuncios/:id", getAnuncioById);
  app.post("/api/anuncios", createAnuncio);
  app.put("/api/anuncios/:id", updateAnuncio);
  app.patch("/api/anuncios/:id/status", updateAnuncioStatus);
  app.delete("/api/anuncios/:id", deleteAnuncio);

  return app;
}
