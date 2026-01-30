import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./server/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create and mount the API server
const apiServer = createServer();

// Mount all API routes
app.use("/api", apiServer);

// Serve static files from Vite build
const staticPath = path.join(__dirname, "dist/spa");
app.use(express.static(staticPath));

// SPA fallback - serve index.html for all non-API routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("[Server Error]", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Unknown error",
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Serving static files from: ${staticPath}`);
  console.log(
    `🗄️  Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`,
  );
  console.log("[Server] ✓ Ready to accept requests");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[Server] ❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] ❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[Server] ✓ Server closed");
    process.exit(0);
  });
});
