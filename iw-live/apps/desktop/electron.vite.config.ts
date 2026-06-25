/**
 * Electron-Vite config for IntegrateWise Desktop
 * Loads the web app in a native window (dev: localhost:3000, prod: app URL)
 */
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: "dist/main",
    },
  },
  preload: {
    build: {
      outDir: "dist/preload",
    },
  },
  renderer: {
    root: "src/renderer",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: "src/renderer/index.html",
      },
    },
  },
});
