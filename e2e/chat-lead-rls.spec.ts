import { test, expect } from '@playwright/test';
import {
  loginViaApi,
  restInsert,
  restDelete,
  rpc,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from './helpers/supabase-rest';
import { TEST_ACCOUNTS } from './helpers/auth';

/**
 * Valida o fluxo de "chat lead" do marketplace:
 *  - Motorista logado consegue criar uma conversa-lead (driver_id NULL, interested_user_id=self)
 *  - Visitante anônimo é bloqueado pela RLS
 *  - Locador (papel errado) é bloqueado pela checagem de role na policy
 *  - vehicle_id que NÃO pertence ao locador alvo é bloqueado por vehicle_belongs_to_locador
 */

const LOCADOR = TEST_ACCOUNTS.locador;
const MOTORISTA = TEST_ACCOUNTS.motorista;

async function getPublicVehicleForLocador(): Promise<{ id: string; locador_id: string }> {
  const res = await rpc('get_public_vehicles', undefined, {});
  expect(res.ok, `get_public_vehicles falhou: ${res.raw}`).toBeTruthy();
  const rows = (res.body as Array<{ id: string; locador_id: string }>) || [];
  const v = rows[0];
  expect(v, 'Nenhum veículo público disponível para o teste').toBeTruthy();
  return { id: v.id, locador_id: v.locador_id };
}

test.describe('Chat lead — RLS no marketplace', () => {
  test('motorista logado cria conversa-lead com sucesso', async () => {
    const { accessToken: motoristaToken, userId: motoristaId } = await loginViaApi(
      MOTORISTA.email,
      MOTORISTA.password,
    );
    const vehicle = await getPublicVehicleForLocador();

    const insert = await restInsert('conversations', motoristaToken, {
      locador_id: vehicle.locador_id,
      driver_id: null,
      interested_user_id: motoristaId,
      vehicle_id: vehicle.id,
    });

    expect(
      insert.ok,
      `Esperado sucesso ao criar conversa-lead, recebeu ${insert.status}: ${insert.raw}`,
    ).toBeTruthy();

    const created = (insert.body as Array<{ id: string }>)[0];
    expect(created?.id).toBeTruthy();

    // cleanup — o próprio criador pode remover via policy de owner (se existir);
    // caso não consiga, o lead fica inerte e não afeta outros testes.
    await restDelete('conversations', `id=eq.${created.id}`, motoristaToken).catch(() => undefined);
  });

  test('visitante anônimo é bloqueado pela RLS', async () => {
    const vehicle = await getPublicVehicleForLocador();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/conversations`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        locador_id: vehicle.locador_id,
        driver_id: null,
        interested_user_id: '00000000-0000-0000-0000-000000000000',
        vehicle_id: vehicle.id,
      }),
    });

    expect(res.ok, 'Anônimo não deveria inserir em conversations').toBeFalsy();
    expect([401, 403]).toContain(res.status);
  });

  test('locador não pode iniciar conversa-lead (role check)', async () => {
    const { accessToken: locadorToken, userId: locadorId } = await loginViaApi(
      LOCADOR.email,
      LOCADOR.password,
    );
    const vehicle = await getPublicVehicleForLocador();

    // Tenta se passar por "interessado" em outro locador (ou no próprio): role != motorista
    const insert = await restInsert('conversations', locadorToken, {
      locador_id: vehicle.locador_id,
      driver_id: null,
      interested_user_id: locadorId,
      vehicle_id: vehicle.id,
    });

    expect(
      insert.ok,
      `Locador não deveria criar conversa-lead, mas recebeu ${insert.status}`,
    ).toBeFalsy();
    expect([401, 403]).toContain(insert.status);
  });

  test('motorista é bloqueado quando vehicle_id não pertence ao locador alvo', async () => {
    const { accessToken: motoristaToken, userId: motoristaId } = await loginViaApi(
      MOTORISTA.email,
      MOTORISTA.password,
    );
    const vehicle = await getPublicVehicleForLocador();

    // locador_id "trocado" → vehicle_belongs_to_locador retorna false e a policy bloqueia
    const insert = await restInsert('conversations', motoristaToken, {
      locador_id: '11111111-1111-1111-1111-111111111111',
      driver_id: null,
      interested_user_id: motoristaId,
      vehicle_id: vehicle.id,
    });

    expect(
      insert.ok,
      `Cross-locador deveria ser bloqueado, recebeu ${insert.status}: ${insert.raw}`,
    ).toBeFalsy();
    expect([401, 403]).toContain(insert.status);
  });
});
