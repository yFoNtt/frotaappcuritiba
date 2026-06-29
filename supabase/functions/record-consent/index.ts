import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

// Versões correntes — mantenha em sincronia com src/lib/consentVersions.ts.
// O servidor valida que o cliente está aceitando exatamente estas versões,
// impedindo que um cliente comprometido grave aceite de versão arbitrária.
const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { terms_version?: string; privacy_version?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const termsVersion = String(body.terms_version ?? "");
    const privacyVersion = String(body.privacy_version ?? "");

    if (termsVersion !== TERMS_VERSION || privacyVersion !== PRIVACY_VERSION) {
      return new Response(
        JSON.stringify({
          error: "Versão de consentimento inválida",
          expected: { terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ip = getClientIp(req);
    const ua = req.headers.get("user-agent");

    const { data, error } = await supabase
      .from("consents")
      .insert({
        user_id: userData.user.id,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        ip_address: ip,
        user_agent: ua,
      })
      .select("id, accepted_at")
      .single();

    if (error) {
      console.error("record-consent insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, consent: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("record-consent error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
