import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

interface ReviewPayload {
  scope: 'vehicles' | 'contracts';
  unknownCount: number;
  reviewedIds: string[];
  unknownStatuses?: string[];
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: 'Invalid token' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return json({ error: 'Admin role required' }, 403);
    }

    const body = (await req.json()) as Partial<ReviewPayload>;
    const scope = body.scope;
    const reviewedIds = Array.isArray(body.reviewedIds) ? body.reviewedIds.slice(0, 500) : [];
    const unknownCount = Number(body.unknownCount ?? reviewedIds.length);
    const unknownStatuses = Array.isArray(body.unknownStatuses)
      ? body.unknownStatuses.slice(0, 50)
      : [];

    if (scope !== 'vehicles' && scope !== 'contracts') {
      return json({ error: 'Invalid scope' }, 400);
    }

    const tableName = scope === 'vehicles' ? 'vehicles' : 'contracts';

    const { data: inserted, error: insertErr } = await admin
      .from('audit_logs')
      .insert({
        table_name: tableName,
        record_id: userData.user.id,
        action: 'INCONSISTENCY_REVIEW',
        changed_by: userData.user.id,
        new_data: {
          scope,
          unknown_count: unknownCount,
          reviewed_ids: reviewedIds,
          unknown_statuses: unknownStatuses,
          reviewed_at: new Date().toISOString(),
        },
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('insert error', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ ok: true, audit_log_id: inserted.id });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
