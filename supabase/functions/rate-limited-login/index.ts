import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit config
const MAX_ATTEMPTS_PER_EMAIL = 5; // max failed attempts per email
const MAX_ATTEMPTS_PER_IP = 15; // max failed attempts per IP
const WINDOW_MINUTES = 15; // time window in minutes
const LOCKOUT_MINUTES = 15; // lockout duration after exceeding limit

Deno.serve(async (req) => {
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
    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get client IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Admin client for rate limit checks (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const windowStart = new Date(
      Date.now() - WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    // Check rate limits (email and IP) in parallel
    const [emailAttemptsRes, ipAttemptsRes] = await Promise.all([
      adminClient
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("email", email.toLowerCase())
        .eq("success", false)
        .gte("attempted_at", windowStart),
      adminClient
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .eq("success", false)
        .gte("attempted_at", windowStart),
    ]);

    const emailAttempts = emailAttemptsRes.count ?? 0;
    const ipAttempts = ipAttemptsRes.count ?? 0;

    // Check if rate limited
    if (emailAttempts >= MAX_ATTEMPTS_PER_EMAIL) {
      return new Response(
        JSON.stringify({
          error: `Muitas tentativas de login para este email. Tente novamente em ${LOCKOUT_MINUTES} minutos.`,
          rateLimited: true,
          retryAfterMinutes: LOCKOUT_MINUTES,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(LOCKOUT_MINUTES * 60),
          },
        }
      );
    }

    if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
      return new Response(
        JSON.stringify({
          error: `Muitas tentativas de login deste endereço. Tente novamente em ${LOCKOUT_MINUTES} minutos.`,
          rateLimited: true,
          retryAfterMinutes: LOCKOUT_MINUTES,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(LOCKOUT_MINUTES * 60),
          },
        }
      );
    }

    // Attempt login using anon client (respects auth settings)
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    // Record the attempt
    await adminClient.from("login_attempts").insert({
      email: email.toLowerCase(),
      ip_address: ip,
      success: !error,
    });

    if (error) {
      const remainingAttempts =
        MAX_ATTEMPTS_PER_EMAIL - (emailAttempts + 1);

      let errorMessage = "Email ou senha incorretos";
      if (remainingAttempts <= 2 && remainingAttempts > 0) {
        errorMessage += `. ${remainingAttempts} tentativa(s) restante(s) antes do bloqueio.`;
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          remainingAttempts: Math.max(0, remainingAttempts),
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cleanup old attempts periodically (fire-and-forget, 1% chance)
    if (Math.random() < 0.01) {
      adminClient.rpc("cleanup_old_login_attempts").then(() => {});
    }

    // Return session data
    return new Response(
      JSON.stringify({
        session: data.session,
        user: data.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Rate-limited login error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
