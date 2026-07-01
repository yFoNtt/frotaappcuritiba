import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Rotas do admin não contam como "visita" — evita que seu próprio uso
// do painel polua as estatísticas de tráfego.
function shouldSkip(path: string) {
  return path.startsWith("/admin");
}

export function useVisitLogger() {
  const location = useLocation();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (shouldSkip(path)) return;
    if (lastLogged.current === path) return;
    lastLogged.current = path;

    const params = new URLSearchParams(location.search);

    supabase.functions
      .invoke("log-visit", {
        body: {
          path,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        },
      })
      .catch(() => {
        // Falha silenciosa: o contador nunca deve impactar a experiência do usuário.
      });
  }, [location.pathname, location.search]);
}

export function VisitLogger() {
  useVisitLogger();
  return null;
}
