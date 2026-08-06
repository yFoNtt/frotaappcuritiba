import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Valores públicos do backend (protegidos por RLS). Servem apenas como
// fallback caso o build seja gerado sem o .env — evita a tela
// "Configuração ausente" em produção.
const FALLBACK_SUPABASE_URL = "https://bohycsldnskyuwsdxrqt.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODQ1OTIsImV4cCI6MjA4NDE2MDU5Mn0.6Op1rKmqr8bmfXlM_iCPC1yP36DaZ1TnRwKQqXc4jZQ";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const define: Record<string, string> = {};
  if (!env.VITE_SUPABASE_URL) {
    define["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(FALLBACK_SUPABASE_URL);
  }
  if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    define["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(
      FALLBACK_SUPABASE_PUBLISHABLE_KEY,
    );
  }

  return {
  define,
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

