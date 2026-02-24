import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user has admin role
    const { data: roleData, error: roleError } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const results = { paymentAlerts: 0, cnhAlerts: 0, maintenanceAlerts: 0 };

    // ── 1. Overdue Payments ──
    const { data: overduePayments } = await supabase
      .from("payments")
      .select("id, locador_id, driver_id, amount, due_date, reference_week, vehicle_id")
      .eq("status", "pending")
      .lt("due_date", todayStr);

    if (overduePayments && overduePayments.length > 0) {
      // Mark them as overdue
      const overdueIds = overduePayments.map(p => p.id);
      await supabase
        .from("payments")
        .update({ status: "overdue" })
        .in("id", overdueIds);

      // Get driver names for better messages
      const driverIds = [...new Set(overduePayments.map(p => p.driver_id))];
      const { data: drivers } = await supabase
        .from("drivers")
        .select("id, name, user_id")
        .in("id", driverIds);

      const driverMap = new Map(drivers?.map(d => [d.id, d]) || []);

      for (const payment of overduePayments) {
        const driver = driverMap.get(payment.driver_id);

        // Check if we already notified today for this payment
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", payment.locador_id)
          .eq("type", "payment_overdue")
          .gte("created_at", `${todayStr}T00:00:00`)
          .contains("metadata", { payment_id: payment.id })
          .maybeSingle();

        if (!existing) {
          // Notify locador
          await supabase.from("notifications").insert({
            user_id: payment.locador_id,
            type: "payment_overdue",
            title: "Pagamento em atraso",
            message: `O pagamento de R$ ${Number(payment.amount).toFixed(2)} do motorista ${driver?.name || "N/A"} está atrasado (vencimento: ${new Date(payment.due_date).toLocaleDateString("pt-BR")}).`,
            metadata: { payment_id: payment.id, driver_id: payment.driver_id, amount: payment.amount },
          });
          results.paymentAlerts++;

          // Notify motorista if linked
          if (driver?.user_id) {
            await supabase.from("notifications").insert({
              user_id: driver.user_id,
              type: "payment_overdue",
              title: "Pagamento em atraso",
              message: `Seu pagamento de R$ ${Number(payment.amount).toFixed(2)} com vencimento em ${new Date(payment.due_date).toLocaleDateString("pt-BR")} está atrasado.`,
              metadata: { payment_id: payment.id, amount: payment.amount },
            });
          }
        }
      }
    }

    // ── 2. CNH Expiry ──
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split("T")[0];

    const { data: expiringDrivers } = await supabase
      .from("drivers")
      .select("id, name, cnh_expiry, user_id, locador_id")
      .lte("cnh_expiry", in30DaysStr)
      .eq("status", "active");

    for (const driver of expiringDrivers || []) {
      const expiryDate = new Date(driver.cnh_expiry);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft < 0;

      const urgency = isExpired ? "VENCIDA" : daysLeft <= 7 ? "URGENTE" : "ATENÇÃO";
      const title = isExpired ? "CNH vencida" : `CNH vence em ${daysLeft} dias`;
      const message = isExpired
        ? `A CNH do motorista ${driver.name} está vencida desde ${expiryDate.toLocaleDateString("pt-BR")}.`
        : `A CNH do motorista ${driver.name} vence em ${expiryDate.toLocaleDateString("pt-BR")} (${daysLeft} dias).`;

      // Check if already notified today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", driver.locador_id)
        .eq("type", "cnh_expiry")
        .gte("created_at", `${todayStr}T00:00:00`)
        .contains("metadata", { driver_id: driver.id })
        .maybeSingle();

      if (!existing) {
        // Notify locador
        await supabase.from("notifications").insert({
          user_id: driver.locador_id,
          type: "cnh_expiry",
          title,
          message,
          metadata: { driver_id: driver.id, urgency, days_left: daysLeft },
        });
        results.cnhAlerts++;

        // Notify motorista if linked
        if (driver.user_id) {
          const motoristaMsg = isExpired
            ? `Sua CNH está vencida desde ${expiryDate.toLocaleDateString("pt-BR")}. Renove o mais rápido possível.`
            : `Sua CNH vence em ${expiryDate.toLocaleDateString("pt-BR")} (${daysLeft} dias). Não esqueça de renovar!`;

          await supabase.from("notifications").insert({
            user_id: driver.user_id,
            type: "cnh_expiry",
            title,
            message: motoristaMsg,
            metadata: { urgency, days_left: daysLeft },
          });
        }
      }
    }

    // ── 3. Upcoming Maintenances ──
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split("T")[0];

    const { data: upcomingMaint } = await supabase
      .from("maintenances")
      .select("id, locador_id, vehicle_id, description, next_maintenance_date, type")
      .not("next_maintenance_date", "is", null)
      .lte("next_maintenance_date", in7DaysStr);

    for (const maint of upcomingMaint || []) {
      const maintDate = new Date(maint.next_maintenance_date!);
      const daysLeft = Math.ceil((maintDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", maint.locador_id)
        .eq("type", "maintenance_due")
        .gte("created_at", `${todayStr}T00:00:00`)
        .contains("metadata", { maintenance_id: maint.id })
        .maybeSingle();

      if (!existing) {
        // Get vehicle info
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("brand, model, plate")
          .eq("id", maint.vehicle_id)
          .maybeSingle();

        const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Veículo";

        await supabase.from("notifications").insert({
          user_id: maint.locador_id,
          type: "maintenance_due",
          title: daysLeft <= 0 ? "Manutenção atrasada" : "Manutenção próxima",
          message: `${maint.description} do ${vehicleLabel} ${daysLeft <= 0 ? "está atrasada" : `está prevista para ${maintDate.toLocaleDateString("pt-BR")}`}.`,
          metadata: { maintenance_id: maint.id, vehicle_id: maint.vehicle_id, days_left: daysLeft },
        });
        results.maintenanceAlerts++;
      }
    }

    console.log("Notification check completed:", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generate-notifications:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
