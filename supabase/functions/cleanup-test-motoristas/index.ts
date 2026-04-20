// Idempotent cleanup for E2E test artifacts.
// Removes ALL files inside the `documents` bucket that belong to the two
// motorista test users (motorista.teste.a/b@frotaapp.dev), and also clears
// any rows from `documents` and `document_requests` referencing them.
//
// The auth users themselves are preserved — the seed function is responsible
// for re-using/refreshing them on the next run. Only ephemeral test data is
// purged so the bucket and tables don't accumulate junk between CI runs.
//
// Auth (same model as seed-test-motoristas):
//   1. `x-seed-token: <E2E_SEED_TOKEN>` — used by GitHub Actions
//   2. `Authorization: Bearer <SERVICE_ROLE_KEY>` — internal tooling

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

const TEST_EMAILS = [
  "motorista.teste.a@frotaapp.dev",
  "motorista.teste.b@frotaapp.dev",
];

const BUCKET = "documents";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listAllFilesRecursive(
  admin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<string[]> {
  // Supabase storage list returns up to 1000 entries, mixing files and
  // sub-folders. We walk recursively to collect every leaf path.
  const out: string[] = [];
  const stack: string[] = [prefix];

  while (stack.length) {
    const current = stack.pop()!;
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(current, { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (error) {
      // Treat "not found" as empty — caller decides if that's an error.
      if (/not found/i.test(error.message)) continue;
      throw new Error(`list ${current}: ${error.message}`);
    }
    if (!data) continue;

    for (const entry of data) {
      // A folder has no `id` (it's a synthetic prefix). A file has `id`.
      const path = current ? `${current}/${entry.name}` : entry.name;
      if ((entry as { id: string | null }).id) {
        out.push(path);
      } else {
        stack.push(path);
      }
    }
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

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

  // Resolve test motorista user IDs (paginate to be safe).
  const targetIds: string[] = [];
  const targetByEmail: Record<string, string | null> = {};
  for (const email of TEST_EMAILS) targetByEmail[email] = null;

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) return json({ error: `listUsers: ${error.message}` }, 500);
    if (!data.users.length) break;

    for (const u of data.users) {
      if (u.email && TEST_EMAILS.includes(u.email)) {
        targetByEmail[u.email] = u.id;
        targetIds.push(u.id);
      }
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  const results: Record<string, unknown> = {
    users: targetByEmail,
    storage_deleted: 0,
    storage_skipped: 0,
    documents_deleted: 0,
    document_requests_deleted: 0,
    errors: [] as string[],
  };

  // ---- Storage cleanup ------------------------------------------------------
  // Convention used by the app: files are stored under `<user_id>/...` inside
  // the `documents` bucket. We list everything under each test user's prefix
  // and remove in batches of 100 (Supabase storage `remove` limit-friendly).
  for (const [email, userId] of Object.entries(targetByEmail)) {
    if (!userId) {
      results.storage_skipped = (results.storage_skipped as number) + 1;
      continue;
    }
    try {
      const paths = await listAllFilesRecursive(admin, userId);
      if (!paths.length) continue;

      for (let i = 0; i < paths.length; i += 100) {
        const batch = paths.slice(i, i + 100);
        const { error: rmErr } = await admin.storage
          .from(BUCKET)
          .remove(batch);
        if (rmErr) {
          (results.errors as string[]).push(
            `remove ${email} batch ${i}: ${rmErr.message}`,
          );
        } else {
          results.storage_deleted =
            (results.storage_deleted as number) + batch.length;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      (results.errors as string[]).push(`list ${email}: ${msg}`);
    }
  }

  // ---- DB cleanup: orphaned document/request rows for these drivers --------
  if (targetIds.length) {
    // Find driver rows for these auth users (test motoristas).
    const { data: drivers, error: dErr } = await admin
      .from("drivers")
      .select("id")
      .in("user_id", targetIds);

    if (dErr) {
      (results.errors as string[]).push(`select drivers: ${dErr.message}`);
    } else if (drivers && drivers.length) {
      const driverIds = drivers.map((d) => d.id);

      const { error: drErr, count: drCount } = await admin
        .from("document_requests")
        .delete({ count: "exact" })
        .in("driver_id", driverIds);
      if (drErr) {
        (results.errors as string[]).push(
          `delete document_requests: ${drErr.message}`,
        );
      } else {
        results.document_requests_deleted = drCount ?? 0;
      }

      const { error: docErr, count: docCount } = await admin
        .from("documents")
        .delete({ count: "exact" })
        .in("driver_id", driverIds);
      if (docErr) {
        (results.errors as string[]).push(`delete documents: ${docErr.message}`);
      } else {
        results.documents_deleted = docCount ?? 0;
      }
    }
  }

  return json({ ok: true, ...results });
});
