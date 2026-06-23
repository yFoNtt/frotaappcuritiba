// Idempotent seed for E2E admin regression tests.
// Creates a single admin test account with deterministic password derived
// from E2E_SEED_TOKEN. Protected by `x-seed-token` header.

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

const ADMIN_EMAIL = "admin.teste@frotaapp.dev";

async function derivePassword(email: string): Promise<string> {
  const data = new TextEncoder().encode(`${SEED_TOKEN}:${email}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `S!${hex.slice(0, 24)}Aa9`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const provided = req.headers.get("x-seed-token") ?? "";
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const tokenOk = !!SEED_TOKEN && provided === SEED_TOKEN;
  const serviceRoleOk = !!SERVICE_ROLE_KEY && bearer === SERVICE_ROLE_KEY;
  if (!tokenOk && !serviceRoleOk) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const password = await derivePassword(ADMIN_EMAIL);

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) return json({ error: `listUsers: ${listErr.message}` }, 500);

  const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
  let userId = existing?.id;

  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Admin Teste" },
    });
    if (cErr || !created.user) return json({ error: `createUser: ${cErr?.message}` }, 500);
    userId = created.user.id;
  } else {
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  }

  // Ensure admin role + clear any leftover non-admin role on this test user
  await admin.from("user_roles").delete().eq("user_id", userId);
  const { error: roleErr } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role: "admin" });
  if (roleErr) return json({ error: `role: ${roleErr.message}` }, 500);

  // Ensure profile row exists and is not blocked
  await admin
    .from("profiles")
    .upsert(
      { user_id: userId, full_name: "Admin Teste", blocked_at: null, blocked_reason: null, blocked_by: null },
      { onConflict: "user_id" },
    );

  return json({ ok: true, user_id: userId, email: ADMIN_EMAIL, password });
});
