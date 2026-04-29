import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import flowbiteReact from "flowbite-react/plugin/vite";

export default defineConfig({
  plugins: [react(), flowbiteReact()],
  server: {
    proxy: {
      '/api': {
        // Change this from localhost:5000 to your Render backend URL
        target: 'https://lost-and-found-jqmn.onrender.com', 
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