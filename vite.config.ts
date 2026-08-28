import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// DACE Transport - Maintained and hosted by Nano Spark Team
// Made by Shanvas and team with the help of Antigravity
export default defineConfig({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
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
