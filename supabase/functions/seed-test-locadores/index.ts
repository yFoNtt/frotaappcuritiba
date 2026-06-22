// Idempotent seed for E2E RLS multi-tenant tests.
// Ensures TWO independent locador users, each with their own vehicle,
// driver, contract, payment, document row, and maintenance — so we can
// verify RLS prevents one from reading/writing the other's data.
//
// Protected by `x-seed-token` header matching E2E_SEED_TOKEN secret.

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

// Deriva uma senha forte e determinística a partir do E2E_SEED_TOKEN + email.
// Sem isso, o código-fonte conteria credenciais públicas (uma vez chamado o
// seed em produção, qualquer pessoa que descobrisse o email poderia logar).
// Apenas quem possui o E2E_SEED_TOKEN (segredo do CI) consegue prever a senha.
async function derivePassword(email: string): Promise<string> {
  const data = new TextEncoder().encode(`${SEED_TOKEN}:${email}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Garante requisitos mínimos do password policy (maiúscula, minúscula, número, especial).
  return `S!${hex.slice(0, 24)}Aa9`;
}

const LOCADORES = [
  {
    email: "locador.teste.a@frotaapp.dev",
    name: "Locador Teste A",
    vehicle: { brand: "Fiat", model: "Mobi A", plate: "TSTAAA1", color: "Branco" },
    driver: { name: "Driver of A", cnh_number: "11122233344", email: "drvA@frotaapp.dev", phone: "+5511900000001" },
  },
  {
    email: "locador.teste.b@frotaapp.dev",
    name: "Locador Teste B",
    vehicle: { brand: "VW", model: "Gol B", plate: "TSTBBB2", color: "Preto" },
    driver: { name: "Driver of B", cnh_number: "55566677788", email: "drvB@frotaapp.dev", phone: "+5511900000002" },
  },
] as const;

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

  const { data: userList, error: listErr } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) return json({ error: `listUsers: ${listErr.message}` }, 500);

  const out: Record<string, unknown>[] = [];

  for (const loc of LOCADORES) {
    const log: Record<string, unknown> = { email: loc.email };
    const existing = userList.users.find((u) => u.email === loc.email);
    let userId = existing?.id;

    if (!userId) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: loc.email,
        password: loc.password,
        email_confirm: true,
        user_metadata: { full_name: loc.name },
      });
      if (cErr || !created.user) { log.error = `createUser: ${cErr?.message}`; out.push(log); continue; }
      userId = created.user.id;
      log.created = true;
    } else {
      await admin.auth.admin.updateUserById(userId, {
        password: loc.password,
        email_confirm: true,
        user_metadata: { full_name: loc.name },
      });
      log.updated = true;
    }
    log.user_id = userId;

    // role
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "locador" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // profile
    const { data: existingProfile } = await admin
      .from("profiles").select("id").eq("user_id", userId).maybeSingle();
    if (!existingProfile) {
      await admin.from("profiles").insert({ user_id: userId, full_name: loc.name });
    }

    // vehicle (unique per locador by plate)
    let vehicleId: string | undefined;
    const { data: existingV } = await admin
      .from("vehicles").select("id").eq("locador_id", userId).eq("plate", loc.vehicle.plate).maybeSingle();
    if (existingV) {
      vehicleId = existingV.id;
    } else {
      const { data: ins, error: vErr } = await admin.from("vehicles").insert({
        locador_id: userId,
        brand: loc.vehicle.brand,
        model: loc.vehicle.model,
        plate: loc.vehicle.plate,
        color: loc.vehicle.color,
        year: 2022,
        fuel_type: "flex",
        weekly_price: 500,
        city: "São Paulo",
        state: "SP",
        status: "available",
      }).select("id").single();
      if (vErr) log.warn_vehicle = vErr.message; else vehicleId = ins.id;
    }
    log.vehicle_id = vehicleId;

    // driver
    let driverId: string | undefined;
    const { data: existingD } = await admin
      .from("drivers").select("id").eq("locador_id", userId).eq("cnh_number", loc.driver.cnh_number).maybeSingle();
    if (existingD) {
      driverId = existingD.id;
    } else {
      const { data: ins, error: dErr } = await admin.from("drivers").insert({
        locador_id: userId,
        name: loc.driver.name,
        email: loc.driver.email,
        phone: loc.driver.phone,
        cnh_number: loc.driver.cnh_number,
        cnh_expiry: "2030-12-31",
        status: "active",
      }).select("id").single();
      if (dErr) log.warn_driver = dErr.message; else driverId = ins.id;
    }
    log.driver_id = driverId;

    // contract
    let contractId: string | undefined;
    if (vehicleId && driverId) {
      const { data: existingC } = await admin
        .from("contracts").select("id")
        .eq("locador_id", userId).eq("vehicle_id", vehicleId).eq("driver_id", driverId).maybeSingle();
      if (existingC) {
        contractId = existingC.id;
      } else {
        const { data: ins, error: cErr } = await admin.from("contracts").insert({
          locador_id: userId,
          vehicle_id: vehicleId,
          driver_id: driverId,
          weekly_price: 500,
          start_date: "2025-01-01",
          status: "active",
          payment_day: "segunda-feira",
        }).select("id").single();
        if (cErr) log.warn_contract = cErr.message; else contractId = ins.id;
      }
    }
    log.contract_id = contractId;

    // payment
    if (contractId && driverId) {
      const { data: existingP } = await admin
        .from("payments").select("id")
        .eq("locador_id", userId).eq("contract_id", contractId).eq("reference_week", "2025-01-06").maybeSingle();
      if (!existingP) {
        const { error: pErr } = await admin.from("payments").insert({
          locador_id: userId,
          driver_id: driverId,
          contract_id: contractId,
          vehicle_id: vehicleId,
          amount: 500,
          reference_week: "2025-01-06",
          due_date: "2025-01-13",
          status: "pending",
        });
        if (pErr) log.warn_payment = pErr.message;
      }
    }

    // document (row only, no storage object)
    if (driverId) {
      const { data: existingDoc } = await admin
        .from("documents").select("id")
        .eq("locador_id", userId).eq("driver_id", driverId).eq("name", "seed-doc.pdf").maybeSingle();
      if (!existingDoc) {
        const { error: docErr } = await admin.from("documents").insert({
          locador_id: userId,
          driver_id: driverId,
          name: "seed-doc.pdf",
          type: "cnh",
          file_path: `seed/${userId}/seed-doc.pdf`,
        });
        if (docErr) log.warn_document = docErr.message;
      }
    }

    // maintenance
    if (vehicleId) {
      const { data: existingM } = await admin
        .from("maintenances").select("id")
        .eq("locador_id", userId).eq("vehicle_id", vehicleId).eq("performed_at", "2025-01-01").maybeSingle();
      if (!existingM) {
        const { error: mErr } = await admin.from("maintenances").insert({
          locador_id: userId,
          vehicle_id: vehicleId,
          type: "preventive",
          description: "Seed maintenance",
          performed_at: "2025-01-01",
          status: "completed",
        });
        if (mErr) log.warn_maintenance = mErr.message;
      }
    }

    out.push(log);
  }

  return json({ ok: true, results: out });
});
