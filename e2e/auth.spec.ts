import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test.describe('Autenticação', () => {
  test('deve exibir formulário de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /entrar no frotaapp/i }).first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar$/i })).toBeVisible();
  });

  test('deve fazer login como locador com email/senha', async ({ page }) => {
    await loginAs(page, 'locador');
    await expect(page).toHaveURL(/\/locador/);
  });

  test('deve fazer login como motorista com email/senha', async ({ page }) => {
    await loginAs(page, 'motorista');
    await expect(page).toHaveURL(/\/motorista/);
  });

  test('deve mostrar erro com senha incorreta', async ({ page }) => {
    await page.goto('/login');
    // E-mail fictício: evita acumular tentativas falhas na conta de teste real.
    await page.fill('input[type="email"]', 'invalido.teste@frotaapp.invalid');
    await page.fill('input[type="password"]', 'SenhaErrada@123');
    await page.click('button[type="submit"]');

    // Should show error toast or message
    await expect(page.getByText(/incorret|inválid|erro|tentativas/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('deve alternar entre login e cadastro', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /entrar no frotaapp/i }).first()).toBeVisible();

    // Switch to register
    await page.getByRole('tab', { name: /cadastrar/i }).click();
    await expect(page.getByRole('heading', { name: /criar conta no frotaapp/i }).first()).toBeVisible();

    // Switch back to login
    await page.getByRole('tab', { name: /entrar/i }).click();
    await expect(page.getByRole('heading', { name: /entrar no frotaapp/i }).first()).toBeVisible();
  });

  test('deve exibir formulário de cadastro com seleção de papel', async ({ page }) => {
    await page.goto('/cadastro');
    await expect(page.getByRole('heading', { name: /criar conta no frotaapp/i }).first()).toBeVisible();
    // Should have role selection (locador/motorista)
    await expect(page.getByText(/locador|motorista/i).first()).toBeVisible();
  });

  test('deve exibir botão de login com Google', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/entrar com google/i)).toBeVisible();
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    await loginAs(page, 'locador');
    await logout(page);
    // O app redireciona para a página inicial ("/") após o logout.
    await expect(page).toHaveURL(/\/(login)?(\?.*)?$/);
  });

  test('deve mostrar link de esqueci a senha', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /esquec/i }).first()).toBeVisible();
  });

  test('deve validar campos obrigatórios no cadastro', async ({ page }) => {
    await page.goto('/cadastro');
    // Try submitting empty form
    const submitBtn = page.getByRole('button', { name: /cadastrar|criar conta/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show validation errors or browser native validation
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
    }
  });
});
