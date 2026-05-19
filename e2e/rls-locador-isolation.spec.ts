import { test, expect } from '@playwright/test';
import { loginViaApi, restGet, restPatch, restDelete, restInsert } from './helpers/supabase-rest';

/**
 * Multi-tenant RLS: locador A must NOT be able to read, update, delete or
 * impersonate-insert into locador B's records, across every owned table.
 *
 * Depends on the `seed-test-locadores` edge function having been called so
 * that both locador.teste.a@ and locador.teste.b@ exist with seed data.
 */

const A = { email: 'locador.teste.a@frotaapp.dev', password: 'Teste@123456' };
const B = { email: 'locador.teste.b@frotaapp.dev', password: 'Teste@123456' };

// Tables owned by locador and the column we use to scope a B-only fetch via service-less REST.
// We discover B's row id by logging in as B (allowed by RLS).
const TABLES = [
  'vehicles',
  'drivers',
  'contracts',
  'payments',
  'documents',
  'maintenances',
  'mileage_records',
  'vehicle_inspections',
] as const;

test.describe.configure({ mode: 'serial' });

test.describe('RLS — locador A vs locador B', () => {
  let aToken = '';
  let bToken = '';
  let aUserId = '';
  let bUserId = '';
  // Map of table -> id of a row owned by B (discovered as B)
  const bRowIds: Record<string, string | null> = {};

  test.beforeAll(async () => {
    const a = await loginViaApi(A.email, A.password);
    const b = await loginViaApi(B.email, B.password);
    aToken = a.accessToken; aUserId = a.userId;
    bToken = b.accessToken; bUserId = b.userId;
    expect(aUserId).not.toBe(bUserId);

    for (const t of TABLES) {
      const r = await restGet(t, 'select=id&limit=1', bToken);
      expect(r.ok, `B failed to read own ${t}: ${r.raw}`).toBeTruthy();
      const arr = Array.isArray(r.body) ? (r.body as { id: string }[]) : [];
      bRowIds[t] = arr[0]?.id ?? null;
    }
  });

  for (const table of TABLES) {
    test(`A não consegue SELECT linhas de B em ${table}`, async () => {
      const rowId = bRowIds[table];
      test.skip(!rowId, `Sem linha de B em ${table} (seed pode estar incompleto)`);

      const res = await restGet(table, `id=eq.${rowId}&select=id`, aToken);
      expect(res.ok, `Unexpected error reading ${table}: ${res.raw}`).toBeTruthy();
      const arr = Array.isArray(res.body) ? res.body : [];
      expect(
        arr.length,
        `RLS LEAK: locador A leu ${table}.id=${rowId} de B`,
      ).toBe(0);
    });

    test(`A não consegue UPDATE linhas de B em ${table}`, async () => {
      const rowId = bRowIds[table];
      test.skip(!rowId, `Sem linha de B em ${table}`);

      // Use updated_at touch — present on every owned table.
      const res = await restPatch(table, `id=eq.${rowId}`, aToken, { updated_at: new Date().toISOString() });
      // PostgREST returns 200 + [] when RLS filters everything out.
      const arr = Array.isArray(res.body) ? res.body : [];
      expect(
        arr.length,
        `RLS LEAK: locador A atualizou ${table}.id=${rowId} de B (resposta: ${res.raw})`,
      ).toBe(0);
    });

    test(`A não consegue DELETE linhas de B em ${table}`, async () => {
      const rowId = bRowIds[table];
      test.skip(!rowId, `Sem linha de B em ${table}`);

      const res = await restDelete(table, `id=eq.${rowId}`, aToken);
      const arr = Array.isArray(res.body) ? res.body : [];
      expect(
        arr.length,
        `RLS LEAK: locador A deletou ${table}.id=${rowId} de B`,
      ).toBe(0);

      // Confirm row still exists when read as B.
      const verify = await restGet(table, `id=eq.${rowId}&select=id`, bToken);
      const stillThere = Array.isArray(verify.body) ? verify.body : [];
      expect(stillThere.length, `Linha de B desapareceu em ${table} — vazamento de DELETE`).toBe(1);
    });
  }

  test('A não consegue INSERT veículo com locador_id de B (WITH CHECK)', async () => {
    const res = await restInsert('vehicles', aToken, {
      locador_id: bUserId,
      brand: 'Hijack',
      model: 'X',
      plate: `HJK${Date.now()}`.slice(0, 7),
      color: 'red',
      year: 2024,
      fuel_type: 'flex',
      weekly_price: 1,
      city: 'X',
      state: 'SP',
    });
    expect(res.ok, `RLS LEAK: A inseriu vehicles com locador_id de B (status ${res.status}, ${res.raw})`).toBeFalsy();
    expect([401, 403]).toContain(res.status);
  });

  test('A não consegue INSERT driver com locador_id de B', async () => {
    const res = await restInsert('drivers', aToken, {
      locador_id: bUserId,
      name: 'Hijack',
      email: `hj${Date.now()}@x.com`,
      cnh_number: '12345678909',
      cnh_expiry: '2030-01-01',
    });
    expect(res.ok, `RLS LEAK: A inseriu drivers com locador_id de B (${res.raw})`).toBeFalsy();
    expect([401, 403, 400]).toContain(res.status);
  });
});
