import { test, expect } from '@playwright/test';
import { restGet, rpc, SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers/supabase-rest';

/**
 * Regressão: visitantes anônimos e sessões expiradas NÃO podem receber
 * erro de permissão (403/500 "permission denied for function has_role").
 * O esperado é lista vazia (200 + []) nas tabelas protegidas por RLS
 * que dependem de public.has_role().
 */

// Tabelas cujas policies avaliam public.has_role()
const RLS_TABLES = [
  'vehicles',
  'contracts',
  'payments',
  'profiles',
  'drivers',
  'documents',
  'maintenances',
  'notifications',
  'audit_logs',
  'user_roles',
] as const;

// JWT válido em formato, mas expirado (exp no passado) — simula sessão vencida.
const EXPIRED_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0',
  'c2lnbmF0dXJlLWludmFsaWRhLXBhcmEtdGVzdGU',
].join('.');

function assertNoPermissionError(raw: string, label: string) {
  expect(
    /permission denied/i.test(raw),
    `${label}: erro de permissão retornado -> ${raw}`,
  ).toBe(false);
  expect(
    /has_role/i.test(raw) && /denied|error/i.test(raw),
    `${label}: falha relacionada a has_role -> ${raw}`,
  ).toBe(false);
}

test.describe('has_role — usuário anônimo', () => {
  for (const table of RLS_TABLES) {
    test(`anon recebe lista vazia (sem permission denied) em ${table}`, async () => {
      const res = await restGet(table, 'select=id&limit=5');
      assertNoPermissionError(res.raw, `anon/${table}`);
      expect(res.status, `anon/${table} status inesperado: ${res.raw}`).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length, `RLS LEAK em ${table}`).toBe(0);
    });
  }

  test('anon pode executar RPC pública get_public_vehicles', async () => {
    const res = await rpc('get_public_vehicles', undefined);
    assertNoPermissionError(res.raw, 'anon/get_public_vehicles');
    expect(res.ok, `RPC pública falhou: ${res.raw}`).toBeTruthy();
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('anon pode chamar has_role sem erro de permissão', async () => {
    const res = await rpc('has_role', undefined, {
      _user_id: '00000000-0000-0000-0000-000000000000',
      _role: 'admin',
    });
    assertNoPermissionError(res.raw, 'anon/has_role');
    expect(res.status, `has_role anon status: ${res.raw}`).toBe(200);
    expect(res.body).toBe(false);
  });
});

test.describe('has_role — sessão expirada', () => {
  for (const table of RLS_TABLES) {
    test(`sessão expirada não gera permission denied em ${table}`, async () => {
      const res = await restGet(table, 'select=id&limit=5', EXPIRED_JWT);
      assertNoPermissionError(res.raw, `expirada/${table}`);
      // O PostgREST rejeita o JWT inválido/expirado (401) ou trata como anon (200 + []).
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
        expect((res.body as unknown[]).length, `RLS LEAK em ${table}`).toBe(0);
      }
    });
  }

  test('sessão expirada em RPC pública não vaza erro de banco', async () => {
    const res = await rpc('get_public_vehicles', EXPIRED_JWT);
    assertNoPermissionError(res.raw, 'expirada/get_public_vehicles');
    expect([200, 401]).toContain(res.status);
  });

  test('token malformado é rejeitado sem erro interno de banco', async () => {
    const url = `${SUPABASE_URL}/rest/v1/vehicles?select=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer token-invalido',
      },
    });
    const raw = await res.text();
    assertNoPermissionError(raw, 'malformado/vehicles');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
