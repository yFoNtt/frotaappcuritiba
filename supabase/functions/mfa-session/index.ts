import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildCorsHeaders } from "../_shared/cors.ts";

type JwtClaims = { session_id?: string; iat?: number };

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function decodeClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!authHeader || !token) return json({ error: "Authentication required" }, 401, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Service unavailable" }, 503, corsHeaders);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  const claims = decodeClaims(token);
  if (authError || !user || !claims?.session_id || !claims.iat) {
    return json({ error: "Invalid or expired session" }, 401, corsHeaders);
  }

  let action: "begin" | "complete";
  try {
    const body = await req.json();
    action = body?.action;
  } catch {
    return json({ error: "Invalid request" }, 400, corsHeaders);
  }
  if (action !== "begin" && action !== "complete") {
    return json({ error: "Invalid action" }, 400, corsHeaders);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === "begin") {
    const { error } = await admin.from("mfa_challenges").upsert({
      user_id: user.id,
      initial_session_id: claims.session_id,
      requested_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (error) return json({ error: "Unable to start verification" }, 500, corsHeaders);
    return json({ success: true }, 200, corsHeaders);
  }

  const { data: challenge, error: challengeError } = await admin
    .from("mfa_challenges")
    .select("initial_session_id, requested_at, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const issuedAt = new Date(claims.iat * 1000);
  if (
    challengeError || !challenge ||
    challenge.initial_session_id === claims.session_id ||
    new Date(challenge.expires_at) <= new Date() ||
    issuedAt < new Date(challenge.requested_at)
  ) {
    return json({ error: "Verification challenge is invalid or expired" }, 403, corsHeaders);
  }

  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      mfa_verified_session_id: claims.session_id,
      mfa_verified_until: expiresAt,
    })
    .eq("user_id", user.id);
  if (updateError) return json({ error: "Unable to complete verification" }, 500, corsHeaders);

  await admin.from("mfa_challenges").delete().eq("user_id", user.id);
  return json({ success: true, expires_at: expiresAt }, 200, corsHeaders);
});