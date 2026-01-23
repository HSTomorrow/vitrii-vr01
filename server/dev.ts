import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createExpressServer } from "./index";

async function setupDev() {
  const app = express();
  const port = process.env.PORT || 8080;

  // Create Vite dev server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  // Add Vite middleware
  app.use(vite.middlewares);

  // Add Express API routes before Vite's SPA fallback
  const apiApp = createExpressServer();
  app.use(apiApp);

  // SPA fallback - serve index.html for all non-API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile("index.html", { root: "./dist/spa" }, (err) => {
        if (err) next();
      });
    } else {
      next();
    }
  });

  app.listen(port, () => {
    console.log(`🚀 Dev server running on http://localhost:${port}`);
  });
}

setupDev().catch(console.error);
