import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting CNH expiry check...");

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate date thresholds
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    const in15Days = new Date(today);
    in15Days.setDate(in15Days.getDate() + 15);
    const in15DaysStr = in15Days.toISOString().split('T')[0];

    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    console.log(`Checking CNH expiry dates - Today: ${todayStr}, 7 days: ${in7DaysStr}, 15 days: ${in15DaysStr}, 30 days: ${in30DaysStr}`);

    // Get all motorista profiles with CNH expiry dates
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, cnh_expiry")
      .not("cnh_expiry", "is", null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with CNH expiry dates`);

    const alertsCreated: { user_id: string; alert_type: string }[] = [];

    for (const profile of profiles || []) {
      const expiryDate = new Date(profile.cnh_expiry);
      const expiryStr = profile.cnh_expiry;
      
      let alertType: string | null = null;

      // Determine alert type based on expiry date
      if (expiryDate < today) {
        alertType = "expired";
      } else if (expiryStr <= in7DaysStr) {
        alertType = "7_days";
      } else if (expiryStr <= in15DaysStr) {
        alertType = "15_days";
      } else if (expiryStr <= in30DaysStr) {
        alertType = "30_days";
      }

      if (alertType) {
        // Check if we already sent this type of alert today
        const { data: existingAlert } = await supabase
          .from("cnh_alerts")
          .select("id")
          .eq("user_id", profile.user_id)
          .eq("alert_type", alertType)
          .gte("sent_at", todayStr)
          .maybeSingle();

        if (!existingAlert) {
          // Create new alert using the security definer function
          const { error: alertError } = await supabase
            .rpc("insert_cnh_alert", {
              _user_id: profile.user_id,
              _alert_type: alertType,
              _cnh_expiry: profile.cnh_expiry
            });

          if (alertError) {
            console.error(`Error creating alert for user ${profile.user_id}:`, alertError);
          } else {
            console.log(`Created ${alertType} alert for user ${profile.user_id}`);
            alertsCreated.push({ user_id: profile.user_id, alert_type: alertType });
          }
        } else {
          console.log(`Alert ${alertType} already sent today for user ${profile.user_id}`);
        }
      }
    }

    console.log(`CNH expiry check completed. Created ${alertsCreated.length} alerts.`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: alertsCreated.length,
        details: alertsCreated,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-cnh-expiry function:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});