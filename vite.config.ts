import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Split large vendor libraries out of the main bundle so each chunk
        // stays under the 500 kB warning limit and caches independently.
        manualChunks(id) {
          // Rollup's shared CommonJS helper goes with React, the chunk everything else already depends on.
          // Not in vendor: React needs the helper too, so vendor <-> react would load in a cycle (black screen).
          // Not left alone either: it would land in the lazy pdf.js chunk and load pdf.js at startup.
          if (id.includes("commonjsHelpers")) return "react";
          if (!id.includes("node_modules")) return;
          // pdf.js is only imported when a JD PDF is opened, so keep it out of the vendor chunk loaded at start
          if (/[\\/]node_modules[\\/]pdfjs-dist[\\/]/.test(id)) return "pdfjs";
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id)) return "charts";
          if (/[\\/]node_modules[\\/](react-markdown|remark-[^\\/]+|rehype-[^\\/]+|micromark[^\\/]*|mdast-[^\\/]+|hast-[^\\/]+|unified|unist-[^\\/]+|vfile[^\\/]*)[\\/]/.test(id)) return "markdown";
          if (/[\\/]node_modules[\\/]@capacitor/.test(id) || /[\\/]node_modules[\\/]@capgo[\\/]/.test(id) || /[\\/]node_modules[\\/]@capacitor-community[\\/]/.test(id)) return "capacitor";
          return "vendor";
        },
      },
    },
  },
  // Use absolute asset paths for Capacitor (served from https://localhost).
  // This avoids blank screens if the app is opened on a non-root route.
  base: '/',
}));
