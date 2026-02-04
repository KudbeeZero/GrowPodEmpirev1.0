import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks by package
          if (id.includes("node_modules")) {
            // Extract package name from node_modules path
            const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (match) {
              const packageName = match[1];
              
              // Group common large libraries into separate chunks
              if (packageName.includes("@radix-ui")) {
                return "vendor-radix-ui";
              }
              if (packageName.includes("@tanstack")) {
                return "vendor-tanstack";
              }
              if (packageName === "algosdk") {
                return "vendor-algorand";
              }
              if (packageName.includes("framer-motion")) {
                return "vendor-framer";
              }
              if (packageName.includes("recharts")) {
                return "vendor-charts";
              }
              if (packageName === "react" || packageName === "react-dom") {
                return "vendor-react";
              }
              
              // Group other vendors together
              return "vendor-other";
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 KB to reduce warnings
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
