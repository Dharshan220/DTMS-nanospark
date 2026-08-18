import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// DACE Transport - Maintained and hosted by Nano Spark Team
// Made by Shanvas and team with the help of Antigravity
export default defineConfig({
  base: process.env.VERCEL ? "/" : "/resum/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
