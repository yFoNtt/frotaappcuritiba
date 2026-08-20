import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS } from './helpers/auth';

/**
 * MFA por e-mail: hoje a única via funcional é o link mágico.
 * Estes testes cobrem o retorno pelo link em /verificacao.
 */
test.describe('MFA — retorno pelo link do e-mail', () => {
  test('link expirado mostra aviso e botão de reenvio, sem travar no carregamento', async ({ page }) => {
    await page.goto('/verificacao#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');

    await expect(page.getByRole('alert')).toContainText(/expirou|já foi utilizado/i, { timeout: 15000 });
    await expect(page.getByRole('button', { name: /reenviar e-mail/i })).toBeVisible();
    // A URL é limpa para que um refresh não repita o erro.
    await expect(page).toHaveURL(/\/verificacao$/);
  });

  test('token consumido por prefetch não deixa a tela presa em loading', async ({ page }) => {
    // Simula o clique num link cujo token já foi consumido: sem sessão hidratada.
    await page.goto('/verificacao#access_token=invalido&refresh_token=invalido&type=magiclink');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /reenviar e-mail/i })).toBeVisible();
  });

  test('sessão válida + retorno pelo link redireciona para o painel do locador', async ({ page }) => {
    // Login normal para obter uma sessão real.
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ACCOUNTS.locador.email);
    await page.fill('input[type="password"]', TEST_ACCOUNTS.locador.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(locador|verificacao)/, { timeout: 20000 });

    // Simula a volta pelo botão do e-mail com a sessão já ativa.
    await page.goto('/verificacao#access_token=ok&type=magiclink');
    await page.waitForURL('**/locador**', { timeout: 20000 });
    await expect(page).toHaveURL(/\/locador/);
  });

  test('sem sessão e sem link, /verificacao volta para o login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/verificacao');
    await page.waitForURL('**/login', { timeout: 15000 });
  });
});

/**
 * Fluxo completo: login > /verificacao > retorno do link com token válido
 * (extraído da sessão real) > navegação automática para o painel do papel.
 */
test('retorno do link com token válido navega sozinho para o dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_ACCOUNTS.locador.email);
  await page.fill('input[type="password"]', TEST_ACCOUNTS.locador.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(locador|verificacao)/, { timeout: 20000 });

  // Tokens reais da sessão ativa, simulando o que o link do e-mail devolve.
  const tokens = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return null;
    const raw = localStorage.getItem(key)!;
    const parsed = JSON.parse(raw);
    const session = parsed.currentSession ?? parsed;
    return { access: session.access_token as string, refresh: session.refresh_token as string };
  });
  expect(tokens).not.toBeNull();

  await page.evaluate(() => sessionStorage.clear());
  await page.goto(
    `/verificacao#access_token=${tokens!.access}&refresh_token=${tokens!.refresh}&type=magiclink&token_type=bearer`
  );

  await page.waitForURL('**/locador**', { timeout: 25000 });
  await expect(page).toHaveURL(/\/locador/);
  // A URL é limpa só após a troca do token por sessão.
  await expect(page).not.toHaveURL(/access_token/);
});
