import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate node_modules into vendor chunks
          if (id.includes("node_modules")) {
            // React ecosystem
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            // UI and styling
            if (id.includes("radix") || id.includes("class-variance") || id.includes("clsx")) {
              return "vendor-ui";
            }
            // Forms and validation
            if (id.includes("react-hook-form") || id.includes("zod")) {
              return "vendor-forms";
            }
            // Query and data
            if (id.includes("react-query") || id.includes("@tanstack")) {
              return "vendor-query";
            }
            // Charts
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            // Utilities
            if (id.includes("date-fns") || id.includes("next-themes") || id.includes("framer-motion")) {
              return "vendor-utils";
            }
            // Icons and other
            return "vendor-other";
          }
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));
