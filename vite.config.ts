import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Strip console/debugger from production builds only (dev keeps them).
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Only split what every page needs anyway, so an app-code deploy
        // doesn't invalidate the React runtime's cache entry. Deliberately
        // NOT listing recharts here: forcing it into a named chunk pulls it
        // into the entry preload graph, which would undo the lazy-loading of
        // the analytics pages that are its only consumers.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  // Use absolute asset paths for Capacitor (served from https://localhost).
  // This avoids blank screens if the app is opened on a non-root route.
  base: '/',
}));
