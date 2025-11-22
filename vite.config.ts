import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import prerender from "vite-plugin-prerender";

export default defineConfig({
  plugins: [
    react(),

    // ⚡ Pré-renderização das páginas
    prerender({
      staticDir: "dist", // pasta final gerada
      routes: ["/", "/login", "/cadastro"],     // adicione aqui outras rotas: "/sobre", "/contato", etc.
    })
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    outDir: "dist",
    sourcemap: true
  }
});
