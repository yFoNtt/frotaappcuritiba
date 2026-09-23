// supabase/functions/_shared/cors.ts
// CORS compartilhado por todas as Edge Functions do projeto.
//
// O Access-Control-Allow-Origin e calculado dinamicamente a partir do
// header Origin da propria requisicao (em vez de um valor fixo). Isso
// evita bloqueios de CORS quando a chamada vem de ambientes cujo dominio
// muda (preview do Lovable, dominio de producao, localhost, etc.): como
// essas Edge Functions autenticam via Bearer token (Authorization),
// nunca via cookies, refletir o Origin nao abre uma brecha de sessao -
// so evita que o header de resposta fique preso a um dominio antigo.

const BASE_ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-seed-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": BASE_ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
