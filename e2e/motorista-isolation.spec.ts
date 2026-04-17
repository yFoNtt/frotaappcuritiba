import { test, expect, type Page } from '@playwright/test';

/**
 * E2E test: validates that two distinct motoristas CANNOT access each other's
 * files in the `documents` storage bucket (RLS isolation).
 *
 * The seed accounts were created via a one-shot edge function. They are linked
 * to a real `drivers` row owned by an existing locador, with `user_id` set so
 * the storage RLS policies can match `(storage.foldername(name))[2] = driver.id`.
 */

const SUPABASE_URL = 'https://bohycsldnskyuwsdxrqt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODQ1OTIsImV4cCI6MjA4NDE2MDU5Mn0.6Op1rKmqr8bmfXlM_iCPC1yP36DaZ1TnRwKQqXc4jZQ';

const MOTORISTA_A = {
  email: 'motorista.teste.a@frotaapp.dev',
  password: 'Teste@123456',
};
const MOTORISTA_B = {
  email: 'motorista.teste.b@frotaapp.dev',
  password: 'Teste@123456',
};

/**
 * Login via Supabase Auth REST API directly (bypasses rate-limited login edge
 * function and the UI). Returns the access_token for the authenticated user.
 */
async function loginViaApi(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  expect(res.ok, `Login failed for ${email}: ${text}`).toBeTruthy();
  const data = JSON.parse(text);
  return {
    accessToken: data.access_token as string,
    userId: data.user.id as string,
  };
}

/** Look up the driver row id linked to an authenticated user. */
async function fetchDriverId(accessToken: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/drivers?select=id&user_id=eq.${userId}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const text = await res.text();
  expect(res.ok, `Driver lookup failed: ${text}`).toBeTruthy();
  const rows = JSON.parse(text) as { id: string }[];
  expect(rows.length, `No driver row for user ${userId}`).toBeGreaterThan(0);
  return rows[0].id;
}

/** Upload a small text file as the authenticated user via Storage REST. */
async function uploadFile(accessToken: string, path: string, content: string) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/documents/${path}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
        'x-upsert': 'true',
      },
      body: content,
    }
  );
  return res;
}

/** Try to create a signed URL for a path as the authenticated user. */
async function createSignedUrl(accessToken: string, path: string) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/documents/${path}`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 60 }),
    }
  );
  return res;
}

test.describe('Storage RLS — isolamento entre motoristas', () => {
  test('Motorista A não consegue ler arquivos do Motorista B (e vice-versa)', async () => {
    // 1. Authenticate both drivers
    const a = await loginViaApi(MOTORISTA_A.email, MOTORISTA_A.password);
    const b = await loginViaApi(MOTORISTA_B.email, MOTORISTA_B.password);

    const driverA = await fetchDriverId(a.accessToken, a.userId);
    const driverB = await fetchDriverId(b.accessToken, b.userId);
    expect(driverA).not.toBe(driverB);

    // 2. Each driver uploads a file under their own folder
    const fileName = `e2e-${Date.now()}.txt`;
    const pathA = `requests/${driverA}/${fileName}`;
    const pathB = `requests/${driverB}/${fileName}`;

    const uploadA = await uploadFile(a.accessToken, pathA, 'owned by A');
    expect(uploadA.ok, `Upload by A failed: ${await uploadA.text()}`).toBeTruthy();

    const uploadB = await uploadFile(b.accessToken, pathB, 'owned by B');
    expect(uploadB.ok, `Upload by B failed: ${await uploadB.text()}`).toBeTruthy();

    // 3. Each driver CAN sign their own file
    const ownA = await createSignedUrl(a.accessToken, pathA);
    expect(ownA.ok, 'A should access their own file').toBeTruthy();

    const ownB = await createSignedUrl(b.accessToken, pathB);
    expect(ownB.ok, 'B should access their own file').toBeTruthy();

    // 4. Cross-access MUST fail (RLS blocks)
    const crossA = await createSignedUrl(a.accessToken, pathB);
    expect(
      crossA.ok,
      `RLS LEAK: Motorista A was able to sign B's file (${pathB})`
    ).toBeFalsy();
    expect([400, 403, 404]).toContain(crossA.status);

    const crossB = await createSignedUrl(b.accessToken, pathA);
    expect(
      crossB.ok,
      `RLS LEAK: Motorista B was able to sign A's file (${pathA})`
    ).toBeFalsy();
    expect([400, 403, 404]).toContain(crossB.status);

    // 5. A driver cannot upload INTO another driver's folder either
    const uploadCross = await uploadFile(
      a.accessToken,
      `requests/${driverB}/hijack-${Date.now()}.txt`,
      'malicious'
    );
    expect(
      uploadCross.ok,
      'RLS LEAK: A managed to upload into B\'s folder'
    ).toBeFalsy();
  });

  test('login UI funciona para ambas as contas de teste', async ({ page }: { page: Page }) => {
    for (const acc of [MOTORISTA_A, MOTORISTA_B]) {
      await page.goto('/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', acc.email);
      await page.fill('input[type="password"]', acc.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/motorista**', { timeout: 15000 });
      await expect(page).toHaveURL(/\/motorista/);

      // Logout for next iteration
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
    }
  });
});
