import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { parseJsonBody, z } from "../_shared/requestValidation.ts";

type Claims = { session_id?: string };

const strongPassword = z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/);
const roleSchema = z.enum(["admin", "locador", "motorista"]);
const reasonSchema = z.string().trim().min(3).max(500);
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_user"), email: z.string().email(), full_name: z.string().trim().min(2).max(120), role: z.enum(["locador", "motorista"]), mode: z.enum(["invite", "temporary_password"]), temporary_password: strongPassword.optional(), reason: reasonSchema }).strict(),
  z.object({ action: z.literal("send_password_reset"), user_id: z.string().uuid(), reason: reasonSchema }).strict(),
  z.object({ action: z.literal("set_temporary_password"), user_id: z.string().uuid(), temporary_password: strongPassword, reason: reasonSchema }).strict(),
  z.object({ action: z.literal("update_email"), user_id: z.string().uuid(), email: z.string().email(), reason: reasonSchema }).strict(),
  z.object({ action: z.literal("confirm_email"), user_id: z.string().uuid(), reason: reasonSchema }).strict(),
  z.object({ action: z.literal("change_role"), user_id: z.string().uuid(), role: roleSchema, confirm_admin_promotion: z.boolean().default(false), reason: reasonSchema }).strict(),
  z.object({ action: z.literal("delete_user"), user_id: z.string().uuid(), reason: reasonSchema }).strict(),
]);

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

function decodeClaims(token: string): Claims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!authHeader || !token) return json({ error: "Authentication required" }, 401, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "Service unavailable" }, 503, corsHeaders);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser(token);
  const claims = decodeClaims(token);
  if (authError || !caller || !claims?.session_id) return json({ error: "Invalid or expired session" }, 401, corsHeaders);

  const parsed = await parseJsonBody(req, requestSchema);
  if (!parsed.success) return json({ error: parsed.error }, 400, corsHeaders);
  const body = parsed.data;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const [{ data: adminRole }, { data: callerProfile }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle(),
    admin.from("profiles").select("mfa_enabled,mfa_verified_session_id,mfa_verified_until").eq("user_id", caller.id).maybeSingle(),
  ]);
  if (!adminRole) return json({ error: "Access denied" }, 403, corsHeaders);
  if (callerProfile?.mfa_enabled === true) {
    const verified = callerProfile.mfa_verified_session_id === claims.session_id &&
      !!callerProfile.mfa_verified_until && new Date(callerProfile.mfa_verified_until) > new Date();
    if (!verified) return json({ error: "MFA verification required" }, 403, corsHeaders);
  }

  const audit = async (targetId: string, action: string, reason: string, details: Record<string, unknown> = {}) => {
    const { error } = await admin.from("audit_logs").insert({
      table_name: "auth.users", record_id: targetId, action, changed_by: caller.id,
      new_data: { target_user_id: targetId, reason, ...details },
    });
    if (error) throw new Error("audit_write_failed");
  };

  try {
    if (body.action === "create_user") {
      if (body.mode === "temporary_password" && !body.temporary_password) return json({ error: "Temporary password required" }, 400, corsHeaders);
      const redirectTo = `${new URL(req.headers.get("origin") ?? "https://frotaappcuritiba.lovable.app").origin}/login`;
      const result = body.mode === "invite"
        ? await admin.auth.admin.inviteUserByEmail(body.email, { redirectTo, data: { full_name: body.full_name, role: body.role } })
        : await admin.auth.admin.createUser({ email: body.email, password: body.temporary_password, email_confirm: true, user_metadata: { full_name: body.full_name, role: body.role } });
      if (result.error || !result.data.user) return json({ error: result.error?.message ?? "Unable to create user" }, 400, corsHeaders);
      const targetId = result.data.user.id;
      const { error: profileError } = await admin.from("profiles").upsert({ user_id: targetId, full_name: body.full_name, must_change_password: body.mode === "temporary_password" }, { onConflict: "user_id" });
      const { error: roleError } = await admin.from("user_roles").upsert({ user_id: targetId, role: body.role }, { onConflict: "user_id,role" });
      if (profileError || roleError) {
        await admin.auth.admin.deleteUser(targetId);
        return json({ error: "Unable to initialize user" }, 500, corsHeaders);
      }
      await audit(targetId, "ADMIN_CREATE", body.reason, { role: body.role, mode: body.mode });
      return json({ success: true, user_id: targetId }, 200, corsHeaders);
    }

    if (body.action === "change_role") {
      const { error } = await callerClient.rpc("admin_change_user_role", { _user_id: body.user_id, _new_role: body.role, _reason: body.reason, _confirm_admin_promotion: body.confirm_admin_promotion });
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json({ success: true }, 200, corsHeaders);
    }
    if (body.action === "delete_user") {
      const { error } = await callerClient.rpc("admin_delete_user", { _user_id: body.user_id, _reason: body.reason });
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json({ success: true }, 200, corsHeaders);
    }

    const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(body.user_id);
    if (targetError || !targetData.user) return json({ error: "User not found" }, 404, corsHeaders);

    if (body.action === "send_password_reset") {
      if (!targetData.user.email) return json({ error: "User has no email" }, 400, corsHeaders);
      const { error } = await callerClient.auth.resetPasswordForEmail(targetData.user.email, { redirectTo: `${req.headers.get("origin") ?? "https://frotaappcuritiba.lovable.app"}/redefinir-senha` });
      if (error) return json({ error: error.message }, error.status === 429 ? 429 : 400, corsHeaders);
      await audit(body.user_id, "ADMIN_PASSWORD_RESET_SENT", body.reason);
    } else if (body.action === "set_temporary_password") {
      if (body.user_id === caller.id) return json({ error: "cannot_change_own_password" }, 400, corsHeaders);
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: body.temporary_password });
      if (error) return json({ error: error.message }, 400, corsHeaders);
      const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("user_id", body.user_id);
      if (profileError) throw new Error("profile_update_failed");
      await audit(body.user_id, "ADMIN_TEMPORARY_PASSWORD", body.reason);
    } else if (body.action === "update_email") {
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { email: body.email, email_confirm: false });
      if (error) return json({ error: error.message }, 400, corsHeaders);
      await audit(body.user_id, "ADMIN_EMAIL_UPDATE", body.reason);
    } else if (body.action === "confirm_email") {
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { email_confirm: true });
      if (error) return json({ error: error.message }, 400, corsHeaders);
      await audit(body.user_id, "ADMIN_EMAIL_CONFIRM", body.reason);
    }
    return json({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error("[admin-users] action failed", error instanceof Error ? error.message : "unknown");
    return json({ error: "Unable to complete action" }, 500, corsHeaders);
  }
});