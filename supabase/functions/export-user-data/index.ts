// LGPD: portabilidade — exporta todos os dados do titular em JSON.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const userId = userData.user.id;

    // Tabelas com user_id / locador_id / driver_id — RLS escopa naturalmente
    const fetchTable = async (
      table: string,
      filterCol?: string,
      filterValue?: string,
    ) => {
      const query = supabase.from(table).select("*");
      if (filterCol && filterValue) query.eq(filterCol, filterValue);
      const { data, error } = await query;
      if (error) {
        console.error(`Erro ao ler ${table}:`, error.message);
        return { error: error.message, data: [] };
      }
      return { data: data ?? [] };
    };

    const [
      profiles,
      drivers,
      contracts,
      payments,
      maintenances,
      mileage,
      inspections,
      documents,
      docRequests,
      conversations,
      messages,
      notifications,
      cnhAlerts,
      consents,
    ] = await Promise.all([
      fetchTable("profiles", "user_id", userId),
      fetchTable("drivers"), // RLS retorna registros do locador OU do próprio motorista
      fetchTable("contracts"),
      fetchTable("payments"),
      fetchTable("maintenances"),
      fetchTable("mileage_records"),
      fetchTable("vehicle_inspections"),
      fetchTable("documents"),
      fetchTable("document_requests"),
      fetchTable("conversations"),
      fetchTable("messages"),
      fetchTable("notifications", "user_id", userId),
      fetchTable("cnh_alerts", "user_id", userId),
      fetchTable("consents", "user_id", userId),
    ]);

    // audit_logs: usa service role apenas para escopar por changed_by = userId
    let auditLogs: unknown[] = [];
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: logs } = await admin
        .from("audit_logs")
        .select("*")
        .eq("changed_by", userId);
      auditLogs = logs ?? [];
    }

    const payload = {
      exported_at: new Date().toISOString(),
      user: {
        id: userData.user.id,
        email: userData.user.email,
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
      },
      profiles: profiles.data,
      drivers: drivers.data,
      contracts: contracts.data,
      payments: payments.data,
      maintenances: maintenances.data,
      mileage_records: mileage.data,
      vehicle_inspections: inspections.data,
      documents: documents.data,
      document_requests: docRequests.data,
      conversations: conversations.data,
      messages: messages.data,
      notifications: notifications.data,
      cnh_alerts: cnhAlerts.data,
      consents: consents.data,
      audit_logs: auditLogs,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition":
          'attachment; filename="meus-dados-frotaapp.json"',
      },
    });
  } catch (e) {
    console.error("export-user-data error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
