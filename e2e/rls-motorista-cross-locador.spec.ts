import { test, expect } from '@playwright/test';
import { loginViaApi, restGet } from './helpers/supabase-rest';

/**
 * A motorista logged in must only see records tied to their own driver row.
 * Even if they know the id of another locador's contract/payment, RLS must
 * return empty.
 */

const MOTORISTA = { email: 'motorista.teste.a@frotaapp.dev', password: 'Teste@123456' };
const LOCADOR_B = { email: 'locador.teste.b@frotaapp.dev', password: 'Teste@123456' };

test('motorista não vê contratos/pagamentos de outro locador', async () => {
  const m = await loginViaApi(MOTORISTA.email, MOTORISTA.password);
  const b = await loginViaApi(LOCADOR_B.email, LOCADOR_B.password);

  // Find a contract and a payment owned by locador B
  const bContract = await restGet('contracts', 'select=id&limit=1', b.accessToken);
  const bPayment = await restGet('payments', 'select=id&limit=1', b.accessToken);
  const cId = (bContract.body as { id: string }[])[0]?.id;
  const pId = (bPayment.body as { id: string }[])[0]?.id;
  expect(cId, 'Seed de locador B sem contrato').toBeTruthy();
  expect(pId, 'Seed de locador B sem pagamento').toBeTruthy();

  // Motorista tries to fetch them by id
  const c = await restGet('contracts', `id=eq.${cId}&select=id`, m.accessToken);
  expect((c.body as unknown[]).length, 'RLS LEAK: motorista leu contrato de outro locador').toBe(0);

  const p = await restGet('payments', `id=eq.${pId}&select=id`, m.accessToken);
  expect((p.body as unknown[]).length, 'RLS LEAK: motorista leu pagamento de outro locador').toBe(0);

  // Generic list endpoints must not include B's ids either
  const all = await restGet('contracts', 'select=id', m.accessToken);
  const ids = (all.body as { id: string }[]).map((r) => r.id);
  expect(ids).not.toContain(cId);
});
