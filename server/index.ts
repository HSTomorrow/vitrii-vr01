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

  // Anúncios routes
  app.get("/api/anuncios", getAnuncios);
  app.get("/api/anuncios/:id", getAnuncioById);
  app.post("/api/anuncios", createAnuncio);
  app.put("/api/anuncios/:id", updateAnuncio);
  app.patch("/api/anuncios/:id/status", updateAnuncioStatus);
  app.delete("/api/anuncios/:id", deleteAnuncio);
  app.get("/api/lojas/:lojaId/produtos-para-anuncio", getProdutosParaAnuncio);

  return app;
}
