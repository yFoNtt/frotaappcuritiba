import { test, expect } from '@playwright/test';
import { loginViaApi, SUPABASE_URL, SUPABASE_ANON_KEY } from './helpers/supabase-rest';

/**
 * Regression: the suggest-vehicle-price edge function must enforce both
 * JWT authentication AND a locador role server-side. Anonymous callers
 * and motoristas must never consume AI credits via this endpoint.
 */

const ENDPOINT = `${SUPABASE_URL}/functions/v1/suggest-vehicle-price`;

const PAYLOAD = {
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  city: 'Curitiba',
  state: 'PR',
  fuel_type: 'flex',
  km_limit: 4000,
  allowed_apps: ['uber', '99'],
};

async function callSuggest(token?: string) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(PAYLOAD),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

test('suggest-vehicle-price: anon recebe 401', async () => {
  const res = await callSuggest();
  expect(res.status, `Esperado 401 para anon, recebido ${res.status}: ${res.body}`).toBe(401);
});

test('suggest-vehicle-price: motorista recebe 403 (role check server-side)', async () => {
  const m = await loginViaApi('motorista.teste.a@frotaapp.dev', 'Teste@123456');
  const res = await callSuggest(m.accessToken);
  expect(
    res.status,
    `Motorista NÃO deveria poder consumir IA — recebido ${res.status}: ${res.body}`,
  ).toBe(403);
});

test('suggest-vehicle-price: locador passa do gate de autorização', async () => {
  const l = await loginViaApi('locador.teste.a@frotaapp.dev', 'Teste@123456');
  const res = await callSuggest(l.accessToken);
  // Aceitamos 200 (sucesso) ou 402/429/500 (limites/erros downstream do gateway),
  // mas NUNCA 401/403 — que indicariam regressão no gate de role.
  expect(
    [401, 403].includes(res.status),
    `Locador foi bloqueado pelo gate (${res.status}): ${res.body}`,
  ).toBeFalsy();
});
