import { test, expect } from '@playwright/test';

test.describe('Login com Google', () => {
  test('botão do Google visível no login e no cadastro', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar com google/i })).toBeVisible();

    await page.goto('/cadastro');
    await expect(page.getByRole('button', { name: /cadastrar com google|entrar com google/i }).first()).toBeVisible();
  });

  test('clique no Google não deixa a página em erro', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/login');
    await page.getByRole('button', { name: /entrar com google/i }).click();
    await page.waitForTimeout(1500);

    expect(errors).toEqual([]);
  });
});

test.describe('Esqueci minha senha', () => {
  test('e-mail inválido mostra mensagem em português', async ({ page }) => {
    await page.goto('/esqueci-senha');
    await page.fill('input[type="email"]', 'nao-e-email');
    // evita a validação nativa do navegador bloquear o submit
    await page.locator('input[type="email"]').evaluate((el: HTMLInputElement) => el.setAttribute('type', 'text'));
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByText(/digite um e-?mail válido/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('envio válido mostra confirmação neutra', async ({ page }) => {
    await page.goto('/esqueci-senha');
    await page.fill('input[type="email"]', `teste+${Date.now()}@example.com`);
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByText(/se existir uma conta/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('link de recuperação inválido explica o motivo em português', async ({ page }) => {
    await page.goto('/redefinir-senha#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    await expect(page.getByText(/link inválido ou expirado/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/expirou|não é mais válido/i).first()).toBeVisible();
  });
});
