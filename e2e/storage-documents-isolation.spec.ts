import { test, expect } from '@playwright/test';
import { loginViaApi, SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers/supabase-rest';

/**
 * Storage RLS — bucket `documents` (privado).
 *
 * Estrutura de chaves:
 *   - Locador: `{locador_user_id}/<arquivo>`        (policies "Locadores can ...")
 *   - Motorista: `requests/{driver_id}/<arquivo>`   (policies "Motoristas can ...")
 *
 * Este spec garante que:
 *   1. Locador A não consegue ler/baixar/sobrescrever arquivos do Locador B.
 *   2. Locador A não consegue fazer upload dentro da pasta do Locador B.
 *   3. Motorista (de outro locador) não consegue acessar arquivos privados
 *      do Locador B.
 *   4. Anon (sem JWT) não consegue assinar nem baixar nada.
 *
 * Os arquivos cross-locador entre motoristas (requests/) já são cobertos por
 * `motorista-isolation.spec.ts`.
 */

const A = { email: 'locador.teste.a@frotaapp.dev', password: 'Teste@123456' };
const B = { email: 'locador.teste.b@frotaapp.dev', password: 'Teste@123456' };
const MOTORISTA = { email: 'motorista.teste.a@frotaapp.dev', password: 'Teste@123456' };

const BUCKET = 'documents';

function storageHeaders(token?: string, contentType = 'text/plain') {
  const h: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': contentType,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function uploadFile(token: string, path: string, body: string) {
  return fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...storageHeaders(token), 'x-upsert': 'true' },
    body,
  });
}

async function downloadFile(token: string | undefined, path: string) {
  const headers: Record<string, string> = { apikey: SUPABASE_ANON_KEY };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { headers });
}

async function signFile(token: string | undefined, path: string) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ expiresIn: 60 }),
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('Storage RLS — documents bucket cross-locador', () => {
  let a: { accessToken: string; userId: string };
  let b: { accessToken: string; userId: string };
  let motorista: { accessToken: string; userId: string };
  let pathA = '';
  let pathB = '';

  test.beforeAll(async () => {
    a = await loginViaApi(A.email, A.password);
    b = await loginViaApi(B.email, B.password);
    motorista = await loginViaApi(MOTORISTA.email, MOTORISTA.password);

    const fileName = `e2e-${Date.now()}.txt`;
    pathA = `${a.userId}/${fileName}`;
    pathB = `${b.userId}/${fileName}`;

    const upA = await uploadFile(a.accessToken, pathA, 'owned by A');
    expect(upA.ok, `Upload by A falhou: ${await upA.text()}`).toBeTruthy();
    const upB = await uploadFile(b.accessToken, pathB, 'owned by B');
    expect(upB.ok, `Upload by B falhou: ${await upB.text()}`).toBeTruthy();
  });

  test('cada locador consegue baixar/assinar o próprio arquivo', async () => {
    const dlA = await downloadFile(a.accessToken, pathA);
    expect(dlA.ok, 'Locador A não conseguiu baixar arquivo próprio').toBeTruthy();
    await dlA.text();

    const sgB = await signFile(b.accessToken, pathB);
    expect(sgB.ok, 'Locador B não conseguiu assinar arquivo próprio').toBeTruthy();
    await sgB.text();
  });

  test('Locador A NÃO consegue baixar arquivo do Locador B', async () => {
    const res = await downloadFile(a.accessToken, pathB);
    await res.text();
    expect(
      res.ok,
      `STORAGE LEAK: Locador A baixou ${pathB} (status ${res.status})`,
    ).toBeFalsy();
    expect([400, 401, 403, 404]).toContain(res.status);
  });

  test('Locador B NÃO consegue assinar arquivo do Locador A', async () => {
    const res = await signFile(b.accessToken, pathA);
    await res.text();
    expect(
      res.ok,
      `STORAGE LEAK: Locador B assinou ${pathA}`,
    ).toBeFalsy();
    expect([400, 401, 403, 404]).toContain(res.status);
  });

  test('Locador A NÃO consegue fazer upload dentro da pasta do Locador B', async () => {
    const hijackPath = `${b.userId}/hijack-${Date.now()}.txt`;
    const res = await uploadFile(a.accessToken, hijackPath, 'malicious');
    await res.text();
    expect(
      res.ok,
      `STORAGE LEAK: Locador A subiu em ${hijackPath}`,
    ).toBeFalsy();
    expect([400, 401, 403]).toContain(res.status);
  });

  test('Locador A NÃO consegue sobrescrever arquivo do Locador B', async () => {
    const res = await uploadFile(a.accessToken, pathB, 'overwritten');
    await res.text();
    expect(
      res.ok,
      `STORAGE LEAK: Locador A sobrescreveu ${pathB}`,
    ).toBeFalsy();

    // Confirm B's file content is intact
    const verify = await downloadFile(b.accessToken, pathB);
    const content = await verify.text();
    expect(content).toBe('owned by B');
  });

  test('Motorista (de outro locador) NÃO consegue acessar arquivos do Locador B', async () => {
    const dl = await downloadFile(motorista.accessToken, pathB);
    await dl.text();
    expect(
      dl.ok,
      `STORAGE LEAK: motorista baixou doc do locador B (${pathB})`,
    ).toBeFalsy();

    const sg = await signFile(motorista.accessToken, pathB);
    await sg.text();
    expect(
      sg.ok,
      `STORAGE LEAK: motorista assinou doc do locador B (${pathB})`,
    ).toBeFalsy();
  });

  test('Anon NÃO consegue baixar nem assinar arquivos do bucket documents', async () => {
    const dl = await downloadFile(undefined, pathA);
    await dl.text();
    expect(dl.ok, 'STORAGE LEAK: anon baixou documento').toBeFalsy();

    const sg = await signFile(undefined, pathA);
    await sg.text();
    expect(sg.ok, 'STORAGE LEAK: anon assinou documento').toBeFalsy();
  });

  test.afterAll(async () => {
    // Cleanup uploaded test files (best-effort)
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pathA}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${a.accessToken}` },
    }).then((r) => r.text()).catch(() => {});
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pathB}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${b.accessToken}` },
    }).then((r) => r.text()).catch(() => {});
  });
});
