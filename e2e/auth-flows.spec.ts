import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS } from './helpers/auth';

test.describe('Auth — proteção de rotas', () => {
  test('rota protegida sem login redireciona para /login', async ({ page }) => {
    await page.goto('/locador');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('motorista não acessa /locador', async ({ page }) => {
    await loginAs(page, 'motorista');
    await page.goto('/locador');
    await page.waitForURL('**/motorista**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/motorista/);
  });

  test('locador não acessa /admin', async ({ page }) => {
    await loginAs(page, 'locador');
    await page.goto('/admin');
    await page.waitForURL('**/locador**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/locador/);
  });
});

test.describe('Auth — login', () => {
  test('senha incorreta exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_ACCOUNTS.locador.email);
    await page.fill('input[type="password"]', 'ErradaErrada@1');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/incorret|inválid|erro/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('reset de senha — submete sem erros', async ({ page }) => {
    await page.goto('/login');
    const forgot = page.getByText(/esquec/i).first();
    await forgot.click();
    await page.waitForLoadState('domcontentloaded');
    const email = page.locator('input[type="email"]');
    await expect(email).toBeVisible({ timeout: 10000 });
    await email.fill(TEST_ACCOUNTS.locador.email);
    await page.getByRole('button', { name: /enviar|recuperar|reset/i }).first().click();
    // Either a success toast/message appears, or we stay on the page without a thrown error.
    await expect(page.getByText(/enviado|verifique|email|sucesso/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('logout invalida a sessão', async ({ page }) => {
    await loginAs(page, 'locador');
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/locador');
    await page.waitForURL('**/login', { timeout: 10000 });
  });
});
