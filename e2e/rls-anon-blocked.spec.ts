import { test, expect } from '@playwright/test';
import { restGet, rpc } from './helpers/supabase-rest';

/**
 * Anonymous (no JWT) requests must never see protected data.
 * Only the explicit public RPCs may return rows.
 */

const PROTECTED = [
  'vehicles',
  'contracts',
  'payments',
  'profiles',
  'audit_logs',
  'user_roles',
  'drivers',
  'documents',
  'maintenances',
  'notifications',
  'messages',
] as const;

for (const table of PROTECTED) {
  test(`anon não acessa ${table}`, async () => {
    const res = await restGet(table, 'select=id&limit=5');
    // Either empty array (RLS filter) or auth error — never real data.
    if (Array.isArray(res.body)) {
      expect(
        (res.body as unknown[]).length,
        `RLS LEAK: anon retornou dados de ${table}`,
      ).toBe(0);
    } else {
      expect([401, 403]).toContain(res.status);
    }
  });
}

test('anon PODE chamar get_public_vehicles (RPC pública)', async () => {
  const res = await rpc('get_public_vehicles', undefined);
  expect(res.ok, `RPC pública falhou: ${res.raw}`).toBeTruthy();
  expect(Array.isArray(res.body)).toBe(true);
});
