import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mcpPlugin(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Heavy export libs — only loaded via dynamic import in src/lib/lazyExportLibs.ts.
          if (id.includes("xlsx-js-style") || id.includes("/xlsx/")) return "vendor-xlsx";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("dompurify")) return "vendor-pdf";
          // Charts (used in dashboards/reports).
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          // Animation lib (used widely but big).
          if (id.includes("framer-motion")) return "vendor-motion";
          // Radix primitives — share one chunk across the app.
          if (id.includes("@radix-ui/")) return "vendor-radix";
          // React core stays in the main vendor chunk to avoid double-loading.
        },
      },
    },
  },
}));

