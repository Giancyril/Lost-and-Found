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
        // Optional: If your Render backend DOES NOT have /api in its routes
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});