import { test, expect } from '@playwright/test';
import { loginViaApi, restGet } from './helpers/supabase-rest';

/**
 * Regression: RLS sobre `public.vehicles` para motoristas.
 *
 * Regras esperadas:
 * - Motorista sem contrato ativo NÃO enxerga linhas de `vehicles` via SELECT direto
 *   (mesmo conhecendo o id). Deve usar a RPC pública `get_public_vehicle`.
 * - Motorista NUNCA enxerga veículos de outro locador via SELECT direto.
 * - A RPC pública `get_public_vehicles` continua acessível e não vaza `locador_id`
 *   nem placa nem renavam.
 */

const MOTORISTA = { email: 'motorista.teste.a@frotaapp.dev', password: 'Teste@123456' };
const LOCADOR_B = { email: 'locador.teste.b@frotaapp.dev', password: 'Teste@123456' };

test('motorista sem contrato ativo não vê vehicles via SELECT direto', async () => {
  const m = await loginViaApi(MOTORISTA.email, MOTORISTA.password);
  const b = await loginViaApi(LOCADOR_B.email, LOCADOR_B.password);

  const owned = await restGet('vehicles', 'select=id&limit=1', b.accessToken);
  const bVehicleId = (owned.body as { id: string }[])[0]?.id;
  expect(bVehicleId, 'Seed do locador B sem veículo').toBeTruthy();

  // SELECT direto por id — RLS deve filtrar para vazio.
  const direct = await restGet('vehicles', `id=eq.${bVehicleId}&select=id,plate,locador_id`, m.accessToken);
  const rows = Array.isArray(direct.body) ? direct.body : [];
  expect(
    rows.length,
    `RLS LEAK: motorista (sem contrato) leu vehicles.id=${bVehicleId} de outro locador`,
  ).toBe(0);

  // Listagem genérica também não pode retornar nada dele.
  const list = await restGet('vehicles', 'select=id', m.accessToken);
  const listRows = Array.isArray(list.body) ? (list.body as { id: string }[]) : [];
  expect(listRows.map((r) => r.id)).not.toContain(bVehicleId);
});

test('motorista não consegue ler colunas sensíveis (plate/renavam) via SELECT direto', async () => {
  const m = await loginViaApi(MOTORISTA.email, MOTORISTA.password);

  // Pedir explicitamente plate e renavam — RLS deve cortar a linha inteira.
  const res = await restGet('vehicles', 'select=id,plate,renavam&limit=10', m.accessToken);
  const rows = Array.isArray(res.body) ? (res.body as Array<Record<string, unknown>>) : [];
  for (const r of rows) {
    expect(
      r.plate,
      'Motorista sem contrato ativo não deveria ver `plate` de nenhum veículo',
    ).toBeFalsy();
  }
});

test('RPC pública get_public_vehicles não expõe locador_id, plate ou renavam', async () => {
  const res = await fetch(
    `https://bohycsldnskyuwsdxrqt.supabase.co/rest/v1/rpc/get_public_vehicles`,
    {
      method: 'POST',
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaHljc2xkbnNreXV3c2R4cnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODQ1OTIsImV4cCI6MjA4NDE2MDU5Mn0.6Op1rKmqr8bmfXlM_iCPC1yP36DaZ1TnRwKQqXc4jZQ',
        'Content-Type': 'application/json',
      },
      body: '{}',
    },
  );
  const body = (await res.json()) as Array<Record<string, unknown>>;
  expect(Array.isArray(body)).toBe(true);
  for (const v of body.slice(0, 20)) {
    expect(v).not.toHaveProperty('locador_id');
    expect(v).not.toHaveProperty('plate');
    expect(v).not.toHaveProperty('renavam');
  }
});
