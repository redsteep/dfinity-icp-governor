/// <reference types="vitest" />

import { TanStackRouterVite as tanStackRouter } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

dotenv.config();

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tanStackRouter(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment({ BACKEND_CANISTER_ID: "" }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "setupTests.ts",
    cache: { dir: "../node_modules/.vitest" },
  },
});
