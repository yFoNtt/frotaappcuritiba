// supabase/functions/_shared/cors.ts
// Allow-list de CORS compartilhado por todas as Edge Functions do projeto.
// Substitui "Access-Control-Allow-Origin: *" por um allow-list real:
// domínio de produção + previews do Lovable (somente HTTPS) + localhost
// opcional via secret ALLOW_LOCAL_DEV.

const BASE_ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-seed-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

const configuredOrigins = [
  Deno.env.get("ALLOWED_ORIGIN"),
  Deno.env.get("ORIGEM_PERMITIDA"),
]
  .filter((v): v is string => !!v)
  .flatMap((v) => v.split(",").map((s) => s.trim()))
  .filter(Boolean);

const STATIC_ALLOWED = new Set<string>([
  "https://frotaappcuritiba.lovable.app",
  ...configuredOrigins,
]);

// Fail-closed por padrão: localhost só é aceito se ALLOW_LOCAL_DEV=true for
// setado explicitamente como secret no projeto Supabase. (Antes o default
// era "true", ou seja, fail-open em produção se o secret nunca fosse
// configurado.)
const ALLOW_LOCAL_DEV =
  (Deno.env.get("ALLOW_LOCAL_DEV") ?? "false").toLowerCase() === "true";

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (STATIC_ALLOWED.has(origin)) return true;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  // HTTPS-only para domínios Lovable — bloqueia spoofing via transporte
  // inseguro em http://*.lovable.app.
  if (url.protocol === "https:") {
    if (url.hostname.endsWith(".lovable.app")) return true;
    if (url.hostname.endsWith(".lovableproject.com")) return true;
  }
  if (
    ALLOW_LOCAL_DEV &&
    (url.protocol === "http:" || url.protocol === "https:") &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return true;
  }
  return false;
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = isAllowedOrigin(origin)
    ? origin!
    : "https://frotaappcuritiba.lovable.app";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": BASE_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
