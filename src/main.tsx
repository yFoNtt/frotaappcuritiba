import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Guard: se as variáveis de ambiente do backend não estiverem embutidas no
// bundle, o cliente Supabase explode com "supabaseUrl is required" na
// inicialização e a página fica em branco. Mostramos uma mensagem clara
// em vez de deixar o React quebrar silenciosamente.
const missingEnv: string[] = [];
if (!import.meta.env.VITE_SUPABASE_URL) missingEnv.push("VITE_SUPABASE_URL");
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missingEnv.push("VITE_SUPABASE_PUBLISHABLE_KEY");

if (missingEnv.length > 0) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b0f;color:#f5f5f5;">
      <div style="max-width:560px;width:100%;background:#17171f;border:1px solid #2a2a35;border-radius:12px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,.35);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:36px;height:36px;border-radius:999px;background:#f9731633;display:flex;align-items:center;justify-content:center;color:#f97316;font-size:20px;font-weight:700;">!</div>
          <h1 style="margin:0;font-size:20px;font-weight:600;">Configuração ausente</h1>
        </div>
        <p style="margin:0 0 12px;color:#c9c9d3;line-height:1.55;">
          O aplicativo não conseguiu iniciar porque as variáveis de ambiente
          do backend não estão configuradas neste build.
        </p>
        <p style="margin:0 0 8px;color:#c9c9d3;">Faltando:</p>
        <ul style="margin:0 0 16px 20px;color:#f97316;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">
          ${missingEnv.map((k) => `<li>${k}</li>`).join("")}
        </ul>
        <p style="margin:0;color:#8a8a99;font-size:13px;line-height:1.55;">
          Se você é o administrador, republique o projeto para que as
          variáveis do Lovable Cloud sejam embutidas no bundle. Se o
          problema persistir, reconecte o backend nas configurações do
          projeto.
        </p>
      </div>
    </div>
  `;
} else {
  createRoot(rootEl).render(<App />);
}
