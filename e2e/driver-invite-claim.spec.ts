import { test, expect } from '@playwright/test';
import {
  loginViaApi,
  restInsert,
  restGet,
  restDelete,
  rpc,
} from './helpers/supabase-rest';

/**
 * Valida o fluxo de convite de motorista (/convite/:token):
 *  - get_driver_invite_preview retorna dados corretos / inválido conforme o token
 *  - claim_driver_invite exige role motorista (locador recebe wrong_role)
 *  - anônimo não tem GRANT pra chamar claim_driver_invite
 *  - claim bem-sucedido vincula o driver E promove uma conversa-lead pré-existente
 *  - token já usado não pode ser reclamado de novo
 */

const LOCADOR = { email: 'locador.teste.a@frotaapp.dev', password: 'Teste@123456' };
const MOTORISTA = { email: 'motorista.teste.b@frotaapp.dev', password: 'Teste@123456' };

// Replica o algoritmo de public.validate_cnh (mod 11) pra gerar uma CNH
// sintética válida — o trigger validate_driver_cnh rejeita qualquer outra.
function generateValidCnh(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let v1 = 0;
  for (let i = 0; i < 9; i++) v1 += base[i] * (10 - (i + 1));
  let resto1 = v1 % 11;
  let dsc = 0;
  if (resto1 >= 10) {
    resto1 = 0;
    dsc = 2;
  }
  let v2 = 0;
  for (let i = 0; i < 9; i++) v2 += base[i] * (i + 1);
  let resto2 = (v2 % 11) - dsc;
  if (resto2 < 0) resto2 = 0;
  if (resto2 >= 10) resto2 = 0;
  return [...base, resto1, resto2].join('');
}

async function seedInvite(locadorToken: string, locadorId: string, label: string) {
  const token = crypto.randomUUID();
  const insert = await restInsert('drivers', locadorToken, {
    locador_id: locadorId,
    name: `Convite E2E ${label}`,
    email: `convite.e2e.${label}.${Date.now()}@frotaapp.dev`,
    cnh_number: generateValidCnh(),
    cnh_expiry: '2030-12-31',
    invite_token: token,
    invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  expect(insert.ok, `Falha ao seedar convite: ${insert.raw}`).toBeTruthy();
  const driver = (insert.body as Array<{ id: string }>)[0];
  return { token, driverId: driver.id };
}

test.describe('Convite de motorista — claim flow', () => {
  test('preview de convite válido retorna nome do motorista e do locador', async () => {
    const { accessToken: locadorToken, userId: locadorId } = await loginViaApi(
      LOCADOR.email,
      LOCADOR.password,
    );
    const { token, driverId } = await seedInvite(locadorToken, locadorId, 'preview');

    const preview = await rpc('get_driver_invite_preview', undefined, { _token: token });
    expect(preview.ok, `preview falhou: ${preview.raw}`).toBeTruthy();
    const row = (preview.body as Array<{ driver_name: string; valid: boolean }>)[0];
    expect(row?.valid).toBeTruthy();
    expect(row?.driver_name).toBe('Convite E2E preview');

    await restDelete('drivers', `id=eq.${driverId}`, locadorToken).catch(() => undefined);
  });

  test('preview de token inexistente retorna inválido', async () => {
    const preview = await rpc('get_driver_invite_preview', undefined, {
      _token: crypto.randomUUID(),
    });
    expect(preview.ok).toBeTruthy();
    const rows = preview.body as Array<{ valid: boolean }>;
    expect(rows.length === 0 || rows[0].valid === false).toBeTruthy();
  });

  test('anônimo é bloqueado por falta de GRANT ao chamar claim_driver_invite', async () => {
    const res = await rpc('claim_driver_invite', undefined, { _token: crypto.randomUUID() });
    expect(res.ok, 'Anônimo não deveria conseguir chamar claim_driver_invite').toBeFalsy();
    expect([401, 403]).toContain(res.status);
  });

  test('locador autenticado recebe wrong_role ao tentar confirmar convite', async () => {
    const { accessToken: locadorToken, userId: locadorId } = await loginViaApi(
      LOCADOR.email,
      LOCADOR.password,
    );
    const { token, driverId } = await seedInvite(locadorToken, locadorId, 'wrongrole');

    const claim = await rpc('claim_driver_invite', locadorToken, { _token: token });
    expect(claim.ok, `claim retornou status inesperado: ${claim.raw}`).toBeTruthy();
    const result = claim.body as { success: boolean; error?: string };
    expect(result.success).toBeFalsy();
    expect(result.error).toBe('wrong_role');

    await restDelete('drivers', `id=eq.${driverId}`, locadorToken).catch(() => undefined);
  });

  test('motorista confirma o vínculo, promove a conversa-lead, e o token não pode ser reusado', async () => {
    const { accessToken: locadorToken, userId: locadorId } = await loginViaApi(
      LOCADOR.email,
      LOCADOR.password,
    );
    const { token, driverId } = await seedInvite(locadorToken, locadorId, 'promo');

    const { accessToken: motoristaToken, userId: motoristaId } = await loginViaApi(
      MOTORISTA.email,
      MOTORISTA.password,
    );

    // Limpa qualquer lead residual desse par locador+motorista antes de seedar.
    await restDelete(
      'conversations',
      `locador_id=eq.${locadorId}&interested_user_id=eq.${motoristaId}&driver_id=is.null`,
      motoristaToken,
    ).catch(() => undefined);

    const lead = await restInsert('conversations', motoristaToken, {
      locador_id: locadorId,
      driver_id: null,
      interested_user_id: motoristaId,
    });
    expect(lead.ok, `Falha ao criar lead prévio: ${lead.raw}`).toBeTruthy();
    const leadId = (lead.body as Array<{ id: string }>)[0].id;

    const claim = await rpc('claim_driver_invite', motoristaToken, { _token: token });
    expect(claim.ok, `claim falhou: ${claim.raw}`).toBeTruthy();
    const result = claim.body as { success: boolean; driver_id?: string };
    expect(result.success, `claim retornou erro: ${JSON.stringify(result)}`).toBeTruthy();
    expect(result.driver_id).toBe(driverId);

    const promoted = await restGet(
      'conversations',
      `id=eq.${leadId}&select=driver_id,interested_user_id`,
      motoristaToken,
    );
    const row = (promoted.body as Array<{ driver_id: string; interested_user_id: string | null }>)[0];
    expect(row.driver_id).toBe(driverId);
    expect(row.interested_user_id).toBeNull();

    // Reclaim do mesmo token (já consumido) deve falhar.
    const reclaim = await rpc('claim_driver_invite', motoristaToken, { _token: token });
    const reclaimResult = reclaim.body as { success: boolean; error?: string };
    expect(reclaimResult.success).toBeFalsy();
    expect(reclaimResult.error).toBe('invalid_or_expired');

    await restDelete('conversations', `id=eq.${leadId}`, motoristaToken).catch(() => undefined);
    await restDelete('drivers', `id=eq.${driverId}`, locadorToken).catch(() => undefined);
  });
});
