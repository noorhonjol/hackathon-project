import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In docker-compose the backend service is reachable at http://backend:8000.
// The Vite dev server (running inside the frontend container) proxies /api there,
// so the browser only ever talks to the frontend origin — no CORS juggling.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Caddy proxies to Vite with the original Host header; allow it so the dev
    // server's host check (Vite 5.4.x) doesn't 403 the request.
    allowedHosts: ["localhost", "127.0.0.1"],
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
});