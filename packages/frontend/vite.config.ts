import { TanStackRouterVite as tanStackRouter } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

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
  plugins: [
    tsconfigPaths(),
    topLevelAwait(),
    wasm(),
    react(),
    tanStackRouter(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
});
