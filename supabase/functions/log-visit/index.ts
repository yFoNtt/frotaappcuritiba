import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildCorsHeaders } from "../_shared/cors.ts";

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { path, referrer, user_agent, utm_source, utm_medium, utm_campaign } =
      await req.json();

    if (!path || typeof path !== "string") {
      return new Response(JSON.stringify({ error: "path é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(user_agent ?? "");

    // Geolocalização best-effort via ipapi.co. Nunca bloqueia o registro da visita:
    // se falhar, expirar o timeout, ou for IP local/privado, seguimos sem cidade/região.
    let city: string | null = null;
    let region: string | null = null;
    let country: string | null = null;

    const isPrivateIp =
      ip === "unknown" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.");

    if (!isPrivateIp) {
      try {
        const geoController = new AbortController();
        const timeout = setTimeout(() => geoController.abort(), 2000);
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: geoController.signal,
        });
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          city = geo.city ?? null;
          region = geo.region ?? null;
          country = geo.country_name ?? null;
        }
      } catch (_geoError) {
        // Geolocalização é best-effort — silenciosamente ignorado.
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await supabaseAdmin.from("site_visits").insert({
      ip_address: ip,
      path,
      referrer: referrer || null,
      user_agent: user_agent || null,
      is_mobile: isMobile,
      city,
      region,
      country,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
    });

    if (insertError) {
      console.error("Erro ao registrar visita:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao registrar visita" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro em log-visit:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
