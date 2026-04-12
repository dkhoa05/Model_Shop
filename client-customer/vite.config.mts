import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/** Backend mặc định — proxy `/api` và `/uploads` khi dùng `VITE_API_BASE=/api` */
const API_TARGET = process.env.VITE_API_TARGET || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    base: "/"
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/uploads": { target: API_TARGET, changeOrigin: true }
    }
  }
});

