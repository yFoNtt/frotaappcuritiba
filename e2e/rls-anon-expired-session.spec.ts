import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { restGet, rpc, SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers/supabase-rest';

/**
 * Regressão de segurança — anon + sessão expirada.
 *
 * Garante que visitantes anônimos e sessões vencidas NUNCA recebam
 * "permission denied for function has_role" (ou qualquer erro 5xx de banco)
 * ao consultar tabelas protegidas por RLS: o esperado é lista vazia (200 + []).
 *
 * COBERTURA AUTOMÁTICA: o teste "cobertura" no final compara as listas abaixo
 * com o schema gerado em src/integrations/supabase/types.ts e FALHA quando uma
 * nova tabela ou RPC é adicionada ao MVP sem ser classificada aqui.
 */

// ---------------------------------------------------------------------------
// Tabelas protegidas por RLS — anon deve receber 200 + [] (nunca dados/erro)
// ---------------------------------------------------------------------------
const RLS_TABLES = [
  'audit_logs',
  'cnh_alerts',
  'consents',
  'contracts',
  'conversations',
  'document_requests',
  'documents',
  'drivers',
  'inspection_checklist_templates',
  'login_attempts',
  'maintenances',
  'messages',
  'mileage_records',
  'notifications',
  'payments',
  'profiles',
  'site_visits',
  'user_roles',
  'vehicle_inspections',
  'vehicles',
] as const;

// ---------------------------------------------------------------------------
// RPCs públicas — anon PODE executar (marketplace / utilidades sem PII)
// ---------------------------------------------------------------------------
const PUBLIC_RPCS: { name: string; args: Record<string, unknown> }[] = [
  { name: 'get_public_vehicles', args: {} },
  { name: 'get_public_vehicle', args: { _vehicle_id: '00000000-0000-0000-0000-000000000000' } },
  {
    name: 'get_public_vehicles_by_locador',
    args: { _locador_id: '00000000-0000-0000-0000-000000000000' },
  },
  { name: 'get_driver_invite_preview', args: { _token: '00000000-0000-0000-0000-000000000000' } },
  { name: 'has_role', args: { _user_id: '00000000-0000-0000-0000-000000000000', _role: 'admin' } },
  { name: 'is_current_user_blocked', args: {} },
  {
    name: 'vehicle_belongs_to_locador',
    args: {
      _vehicle_id: '00000000-0000-0000-0000-000000000000',
      _locador_id: '00000000-0000-0000-0000-000000000000',
    },
  },
  { name: 'validate_cpf', args: { cpf: '12345678909' } },
  { name: 'validate_cnpj', args: { cnpj: '11222333000181' } },
  { name: 'validate_cnh', args: { cnh: '12345678900' } },
  // Retorna 200 com { success: false, error: 'not_authenticated' } para anon.
  { name: 'claim_driver_invite', args: { _token: '00000000-0000-0000-0000-000000000000' } },
];

// RPCs públicas que NÃO podem executar ação nenhuma sem sessão válida
const PUBLIC_RPCS_MUST_REFUSE_ANON = new Set(['claim_driver_invite']);

// ---------------------------------------------------------------------------
// RPCs sensíveis — anon deve ser BLOQUEADO (401 / permission denied)
// ---------------------------------------------------------------------------
const PROTECTED_RPCS: { name: string; args: Record<string, unknown> }[] = [
  { name: 'get_user_emails_for_admin', args: {} },
  { name: 'get_user_role', args: { _user_id: '00000000-0000-0000-0000-000000000000' } },
  {
    name: 'admin_set_user_blocked',
    args: { _user_id: '00000000-0000-0000-0000-000000000000', _blocked: true, _reason: 'teste' },
  },
  { name: 'assign_initial_role', args: { _role: 'admin' } },
  { name: 'delete_own_account', args: {} },
  {
    name: 'insert_cnh_alert',
    args: {
      _user_id: '00000000-0000-0000-0000-000000000000',
      _alert_type: '30_days',
      _cnh_expiry: '2030-01-01',
    },
  },
  { name: 'cleanup_old_login_attempts', args: {} },
  { name: 'cleanup_old_site_visits', args: {} },
];

// JWT válido em formato, mas expirado — simula sessão vencida.
const EXPIRED_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0',
  'c2lnbmF0dXJlLWludmFsaWRhLXBhcmEtdGVzdGU',
].join('.');

function assertNoHasRoleFailure(raw: string, label: string) {
  expect(
    /permission denied for function has_role/i.test(raw),
    `${label}: has_role inacessível -> ${raw}`,
  ).toBe(false);
  expect(/"code":"5\d\d"|internal server error/i.test(raw), `${label}: erro interno -> ${raw}`).toBe(
    false,
  );
}

// ---------------------------------------------------------------------------
// 1. Anônimo
// ---------------------------------------------------------------------------
test.describe('anon — tabelas com RLS retornam lista vazia', () => {
  for (const table of RLS_TABLES) {
    test(`anon: ${table} => 200 []`, async () => {
      const res = await restGet(table, 'select=*&limit=5');
      assertNoHasRoleFailure(res.raw, `anon/${table}`);
      expect(
        /permission denied/i.test(res.raw),
        `anon/${table}: permission denied -> ${res.raw}`,
      ).toBe(false);
      expect(res.status, `anon/${table} status inesperado: ${res.raw}`).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect((res.body as unknown[]).length, `RLS LEAK em ${table}`).toBe(0);
    });
  }
});

test.describe('anon — RPCs públicas', () => {
  for (const { name, args } of PUBLIC_RPCS) {
    test(`anon pode chamar ${name}`, async () => {
      const res = await rpc(name, undefined, args);
      assertNoHasRoleFailure(res.raw, `anon/${name}`);
      expect(res.status, `anon/${name} deveria ser 200: ${res.raw}`).toBe(200);

      if (PUBLIC_RPCS_MUST_REFUSE_ANON.has(name)) {
        expect(JSON.stringify(res.body)).toContain('not_authenticated');
      }
    });
  }
});

test.describe('anon — RPCs sensíveis bloqueadas', () => {
  for (const { name, args } of PROTECTED_RPCS) {
    test(`anon NÃO pode chamar ${name}`, async () => {
      const res = await rpc(name, undefined, args);
      expect(res.ok, `VAZAMENTO: anon executou ${name} -> ${res.raw}`).toBeFalsy();
      expect([401, 403]).toContain(res.status);
      expect(/permission denied|not_authenticated|não autenticado/i.test(res.raw)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Sessão expirada
// ---------------------------------------------------------------------------
test.describe('sessão expirada — sem erro de permissão', () => {
  for (const table of RLS_TABLES) {
    test(`expirada: ${table} sem permission denied`, async () => {
      const res = await restGet(table, 'select=*&limit=5', EXPIRED_JWT);
      assertNoHasRoleFailure(res.raw, `expirada/${table}`);
      // PostgREST rejeita o JWT (401) ou trata como anon (200 + []).
      expect([200, 401], `expirada/${table}: ${res.status} -> ${res.raw}`).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
        expect((res.body as unknown[]).length, `RLS LEAK em ${table}`).toBe(0);
      }
    });
  }

  for (const { name, args } of [...PUBLIC_RPCS, ...PROTECTED_RPCS]) {
    test(`expirada: ${name} não vaza erro interno nem dados`, async () => {
      const res = await rpc(name, EXPIRED_JWT, args);
      assertNoHasRoleFailure(res.raw, `expirada/${name}`);
      expect([200, 401, 403], `expirada/${name}: ${res.status} -> ${res.raw}`).toContain(res.status);
    });
  }

  test('token malformado é rejeitado sem erro interno de banco', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=id&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer token-invalido' },
    });
    const raw = await res.text();
    assertNoHasRoleFailure(raw, 'malformado/vehicles');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// 3. Guard de cobertura — falha quando o MVP ganha tabela/RPC não classificada
// ---------------------------------------------------------------------------
function parseGeneratedSchema() {
  const src = readFileSync(
    join(process.cwd(), 'src/integrations/supabase/types.ts'),
    'utf8',
  );
  const tablesStart = src.indexOf('    Tables: {');
  const viewsStart = src.indexOf('    Views: {', tablesStart);
  const funcsStart = src.indexOf('    Functions: {', tablesStart);
  const funcsEnd = src.indexOf('    Enums: {', funcsStart);

  const tableBlock = src.slice(tablesStart, viewsStart > 0 ? viewsStart : funcsStart);
  const funcBlock = src.slice(funcsStart, funcsEnd);

  const names = (block: string) =>
    [...block.matchAll(/^ {6}([a-z0-9_]+): \{/gm)].map((m) => m[1]);

  return { tables: names(tableBlock), functions: names(funcBlock) };
}

test('cobertura: toda tabela do schema está testada', () => {
  const { tables } = parseGeneratedSchema();
  const covered = new Set<string>(RLS_TABLES);
  const missing = tables.filter((t) => !covered.has(t));
  expect(
    missing,
    `Novas tabelas sem cobertura de RLS anon/sessão expirada: ${missing.join(', ')}`,
  ).toEqual([]);
});

test('cobertura: toda RPC do schema está classificada', () => {
  const { functions } = parseGeneratedSchema();
  const covered = new Set([
    ...PUBLIC_RPCS.map((r) => r.name),
    ...PROTECTED_RPCS.map((r) => r.name),
  ]);
  const missing = functions.filter((f) => !covered.has(f));
  expect(
    missing,
    `Novas RPCs não classificadas como pública/sensível: ${missing.join(', ')}`,
  ).toEqual([]);
});
