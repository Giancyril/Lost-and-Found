import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [react(), flowbiteReact()],

  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Warn when a chunk exceeds 600 KB (default is 500)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Core React runtime ─────────────────────────────────────────────
          if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")) {
            return "react-core";
          }

          // ── Routing ───────────────────────────────────────────────────────
          if (id.includes("node_modules/react-router") ||
              id.includes("node_modules/@remix-run/")) {
            return "router";
          }

          // ── Redux / state management ───────────────────────────────────────
          if (id.includes("node_modules/@reduxjs/") ||
              id.includes("node_modules/react-redux/") ||
              id.includes("node_modules/immer/")) {
            return "redux";
          }

          // ── Charts (heavy — recharts + dependencies) ───────────────────────
          if (id.includes("node_modules/recharts") ||
              id.includes("node_modules/d3-") ||
              id.includes("node_modules/victory-")) {
            return "charts";
          }

          // ── 3D / Map (heaviest deps) ───────────────────────────────────────
          if (id.includes("node_modules/three/") ||
              id.includes("node_modules/@react-three/") ||
              id.includes("node_modules/leaflet") ||
              id.includes("node_modules/react-leaflet")) {
            return "3d-map";
          }

          // ── Flowbite UI ────────────────────────────────────────────────────
          if (id.includes("node_modules/flowbite")) {
            return "flowbite";
          }

          // ── Icons ─────────────────────────────────────────────────────────
          if (id.includes("node_modules/react-icons/") ||
              id.includes("node_modules/lucide-react/") ||
              id.includes("node_modules/@heroicons/")) {
            return "icons";
          }

          // ── Misc utilities ─────────────────────────────────────────────────
          if (id.includes("node_modules/date-fns/") ||
              id.includes("node_modules/gsap/") ||
              id.includes("node_modules/dompurify/") ||
              id.includes("node_modules/react-toastify/") ||
              id.includes("node_modules/react-hook-form/") ||
              id.includes("node_modules/socket.io-client/")) {
            return "utils";
          }

          // ── Scanner libs ───────────────────────────────────────────────────
          if (id.includes("node_modules/jsqr/") ||
              id.includes("node_modules/quagga/") ||
              id.includes("node_modules/barcode-detector/")) {
            return "scanner";
          }
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});