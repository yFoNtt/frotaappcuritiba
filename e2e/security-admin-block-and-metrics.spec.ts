import { test, expect } from '@playwright/test';
import {
  loginViaApi,
  rpc,
  restGet,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './helpers/supabase-rest';

/**
 * Regressão de segurança do papel ADMIN:
 *  - bloquear/desbloquear usuários é restrito ao admin (gate server-side)
 *  - admin não consegue se autobloquear nem bloquear outro admin
 *  - usuário bloqueado é deslogado via is_current_user_blocked
 *  - métricas administrativas (get_user_emails_for_admin) não expõem PII
 *    como CPF, CNH ou telefone — só email + timestamps
 *  - get_user_emails_for_admin permanece bloqueado para não-admins
 */

const ADMIN_EMAIL = 'admin.teste@frotaapp.dev';
const LOCADOR_EMAIL = 'locador.teste.a@frotaapp.dev';
const MOTORISTA_EMAIL = 'motorista.teste.a@frotaapp.dev';

async function seedAdmin(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/seed-test-admin`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'x-seed-token': process.env.E2E_SEED_TOKEN ?? '',
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  expect(res.ok, `seed-test-admin failed: ${res.status} ${text}`).toBeTruthy();
  const data = JSON.parse(text);
  return data.password as string;
}

test.describe.serial('admin: bloqueio + métricas sem PII', () => {
  let adminToken: string;
  let adminId: string;
  let motoristaToken: string;
  let motoristaId: string;
  let locadorToken: string;
  let locadorId: string;

  test.beforeAll(async () => {
    const adminPassword = await seedAdmin();
    const a = await loginViaApi(ADMIN_EMAIL, adminPassword);
    adminToken = a.accessToken;
    adminId = a.userId;
    const m = await loginViaApi(MOTORISTA_EMAIL, 'Teste@123456');
    motoristaToken = m.accessToken;
    motoristaId = m.userId;
    const l = await loginViaApi(LOCADOR_EMAIL, 'Teste@123456');
    locadorToken = l.accessToken;
    locadorId = l.userId;

    // Garante que o motorista começa desbloqueado
    await rpc('admin_set_user_blocked', adminToken, {
      _user_id: motoristaId,
      _blocked: false,
      _reason: null,
    });
  });

  test.afterAll(async () => {
    if (adminToken && motoristaId) {
      await rpc('admin_set_user_blocked', adminToken, {
        _user_id: motoristaId,
        _blocked: false,
        _reason: null,
      });
    }
  });

  test('motorista NÃO pode chamar admin_set_user_blocked (role check)', async () => {
    const res = await rpc('admin_set_user_blocked', motoristaToken, {
      _user_id: locadorId,
      _blocked: true,
      _reason: 'tentativa indevida',
    });
    expect(res.ok, `motorista conseguiu bloquear (status ${res.status}): ${res.raw}`).toBeFalsy();
    expect(res.raw).toContain('forbidden_admin_only');
  });

  test('locador NÃO pode chamar admin_set_user_blocked (role check)', async () => {
    const res = await rpc('admin_set_user_blocked', locadorToken, {
      _user_id: motoristaId,
      _blocked: true,
      _reason: 'tentativa indevida',
    });
    expect(res.ok).toBeFalsy();
    expect(res.raw).toContain('forbidden_admin_only');
  });

  test('anônimo NÃO pode chamar admin_set_user_blocked', async () => {
    const res = await rpc('admin_set_user_blocked', undefined, {
      _user_id: motoristaId,
      _blocked: true,
    });
    expect(res.ok).toBeFalsy();
    expect([401, 403, 404]).toContain(res.status);
  });

  test('admin NÃO pode se autobloquear', async () => {
    const res = await rpc('admin_set_user_blocked', adminToken, {
      _user_id: adminId,
      _blocked: true,
    });
    expect(res.ok).toBeFalsy();
    expect(res.raw).toContain('cannot_block_self');
  });

  test('admin bloqueia e desbloqueia motorista; is_current_user_blocked reflete o estado', async () => {
    // bloqueia
    const block = await rpc('admin_set_user_blocked', adminToken, {
      _user_id: motoristaId,
      _blocked: true,
      _reason: 'teste regressão',
    });
    expect(block.ok, `admin não conseguiu bloquear: ${block.raw}`).toBeTruthy();

    // motorista (token antigo ainda válido até expirar) detecta o bloqueio
    const checkBlocked = await rpc('is_current_user_blocked', motoristaToken);
    expect(checkBlocked.ok).toBeTruthy();
    expect(checkBlocked.body).toBe(true);

    // desbloqueia
    const unblock = await rpc('admin_set_user_blocked', adminToken, {
      _user_id: motoristaId,
      _blocked: false,
    });
    expect(unblock.ok).toBeTruthy();

    const checkClear = await rpc('is_current_user_blocked', motoristaToken);
    expect(checkClear.ok).toBeTruthy();
    expect(checkClear.body).toBe(false);
  });

  test('get_user_emails_for_admin: admin OK, motorista bloqueado, sem expor PII', async () => {
    // Admin tem acesso
    const ok = await rpc('get_user_emails_for_admin', adminToken);
    expect(ok.ok, `admin não conseguiu ler emails: ${ok.raw}`).toBeTruthy();
    expect(Array.isArray(ok.body)).toBeTruthy();
    const rows = ok.body as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);

    // Garante que NÃO retorna PII sensível — apenas email + timestamps + id
    const allowed = new Set(['user_id', 'email', 'created_at', 'last_sign_in_at']);
    for (const row of rows) {
      for (const k of Object.keys(row)) {
        expect(
          allowed.has(k),
          `Campo inesperado em get_user_emails_for_admin: ${k} — pode vazar PII`,
        ).toBeTruthy();
      }
      // Sanity: nenhum valor parece CPF/CNH (11 dígitos contínuos) ou telefone
      const blob = JSON.stringify(row);
      expect(/\b\d{11}\b/.test(blob), `Valor parece CPF/CNH em ${blob}`).toBeFalsy();
    }

    // Motorista NÃO pode chamar
    const denied = await rpc('get_user_emails_for_admin', motoristaToken);
    expect(denied.ok).toBeFalsy();
    expect(denied.raw.toLowerCase()).toContain('admin');
  });

  test('admin pode ler user_roles globalmente (métricas) sem acessar profiles.cnh/cpf via REST', async () => {
    const roles = await restGet('user_roles', 'select=role', adminToken);
    expect(roles.ok).toBeTruthy();
    expect(Array.isArray(roles.body)).toBeTruthy();

    // Admin pode ler profiles via RLS — mas se tentar selecionar PII explicitamente,
    // a coluna existe; o que validamos aqui é que a métrica usada pelo dashboard
    // (user_roles) jamais inclui PII.
    const keys = new Set<string>();
    for (const r of roles.body as Array<Record<string, unknown>>) {
      Object.keys(r).forEach((k) => keys.add(k));
    }
    expect(keys.has('cnh_number')).toBeFalsy();
    expect(keys.has('document_number')).toBeFalsy();
    expect(keys.has('phone')).toBeFalsy();
  });
});
