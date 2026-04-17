// Idempotent seed for E2E isolation tests.
// Creates / ensures two motorista users + linked drivers rows owned by the
// permanent test locador (locador.teste@frotaapp.com).
//
// Protected by the `x-seed-token` header which must match the E2E_SEED_TOKEN
// secret. Uses SERVICE_ROLE_KEY to bypass RLS / use the admin Auth API.
//
// Safe to call repeatedly: it upserts the auth users (resetting passwords),
// re-confirms the email, and re-creates the driver row if missing — without
// ever leaking through to RLS-protected tables for non-service callers.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seed-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEED_TOKEN = Deno.env.get("E2E_SEED_TOKEN")!;

const LOCADOR_EMAIL = "locador.teste@frotaapp.com";

const MOTORISTAS = [
  {
    email: "motorista.teste.a@frotaapp.dev",
    password: "Teste@123456",
    name: "Motorista Teste A",
    cnh_number: "12345678900",
    phone: "+5511999990001",
  },
  {
    email: "motorista.teste.b@frotaapp.dev",
    password: "Teste@123456",
    name: "Motorista Teste B",
    cnh_number: "98765432100",
    phone: "+5511999990002",
  },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  // --- Auth: shared secret OR service-role bearer ---------------------------
  // Two ways to authenticate this admin endpoint:
  //  1. `x-seed-token: <E2E_SEED_TOKEN>` — used by GitHub Actions
  //  2. `Authorization: Bearer <SERVICE_ROLE_KEY>` — used by internal tooling
  const provided = req.headers.get("x-seed-token") ?? "";
  const bearer = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  const tokenOk = !!SEED_TOKEN && provided === SEED_TOKEN;
  const serviceRoleOk = !!SERVICE_ROLE_KEY && bearer === SERVICE_ROLE_KEY;
  if (!tokenOk && !serviceRoleOk) {
    return json({ error: "unauthorized" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Resolve locador user id ----------------------------------------------
  const { data: locadorList, error: locErr } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (locErr) return json({ error: `listUsers: ${locErr.message}` }, 500);

  const locador = locadorList.users.find((u) => u.email === LOCADOR_EMAIL);
  if (!locador) {
    return json(
      {
        error: `locador "${LOCADOR_EMAIL}" not found — create it before seeding motoristas`,
      },
      500,
    );
  }
  const locadorId = locador.id;

  const results: Record<string, unknown>[] = [];

  for (const m of MOTORISTAS) {
    const log: Record<string, unknown> = { email: m.email };

    // ---- Ensure auth user (idempotent: create or update) -------------------
    const existing = locadorList.users.find((u) => u.email === m.email);
    let userId = existing?.id;

    if (!userId) {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: m.email,
          password: m.password,
          email_confirm: true,
          user_metadata: { full_name: m.name },
        });
      if (createErr || !created.user) {
        log.error = `createUser: ${createErr?.message}`;
        results.push(log);
        continue;
      }
      userId = created.user.id;
      log.created = true;
    } else {
      // Reset password + ensure confirmed in case it drifted
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password: m.password,
        email_confirm: true,
        user_metadata: { full_name: m.name },
      });
      if (updErr) {
        log.warn_update = updErr.message;
      }
      log.updated = true;
    }

    // ---- Ensure motorista role ---------------------------------------------
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "motorista" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    if (roleErr) log.warn_role = roleErr.message;

    // ---- Ensure driver row linked to test locador --------------------------
    const { data: existingDriver } = await admin
      .from("drivers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingDriver) {
      const { error: dUpdErr } = await admin
        .from("drivers")
        .update({
          locador_id: locadorId,
          name: m.name,
          email: m.email,
          phone: m.phone,
          cnh_number: m.cnh_number,
          cnh_expiry: "2030-12-31",
          status: "active",
        })
        .eq("id", existingDriver.id);
      if (dUpdErr) log.warn_driver = dUpdErr.message;
      log.driver_id = existingDriver.id;
    } else {
      const { data: insDriver, error: dInsErr } = await admin
        .from("drivers")
        .insert({
          locador_id: locadorId,
          user_id: userId,
          name: m.name,
          email: m.email,
          phone: m.phone,
          cnh_number: m.cnh_number,
          cnh_expiry: "2030-12-31",
          status: "active",
        })
        .select("id")
        .single();
      if (dInsErr) {
        log.error_driver = dInsErr.message;
      } else {
        log.driver_id = insDriver.id;
        log.driver_created = true;
      }
    }

    log.user_id = userId;
    results.push(log);
  }

  return json({ ok: true, locador_id: locadorId, results });
});
