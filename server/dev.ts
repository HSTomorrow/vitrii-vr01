import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createServer as createExpressServer } from "./index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDev() {
  const app = express();
  const port = process.env.PORT || 8080;

  // Create the Express API server
  const apiApp = createExpressServer();

  // Add API routes FIRST (before Vite middleware)
  app.use(apiApp);

  // Create Vite dev server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Add Vite middleware after API routes
  app.use(vite.middlewares);

  // Handle SPA fallback for client routes
  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    try {
      const html = await vite.transformIndexHtml(
        req.originalUrl,
        fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf-8"),
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      res.status(404).end("Not Found");
    }
  });

  app.listen(port, () => {
    console.log(`🚀 Dev server running on http://localhost:${port}`);
  });
}

setupDev().catch(console.error);
