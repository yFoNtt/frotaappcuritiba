import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Redirecionamento por Role', () => {
  test('locador deve ser redirecionado para /locador', async ({ page }) => {
    await loginAs(page, 'locador');
    await expect(page).toHaveURL(/\/locador/);
  });

  test('motorista deve ser redirecionado para /motorista', async ({ page }) => {
    await loginAs(page, 'motorista');
    await expect(page).toHaveURL(/\/motorista/);
  });

  test('usuário não autenticado deve ser redirecionado para /login ao acessar /locador', async ({ page }) => {
    await page.goto('/locador');
    await expect(page).toHaveURL(/\/login/);
  });

  test('usuário não autenticado deve ser redirecionado para /login ao acessar /motorista', async ({ page }) => {
    await page.goto('/motorista');
    await expect(page).toHaveURL(/\/login/);
  });

  test('usuário não autenticado deve ser redirecionado para /login ao acessar /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('locador não deve acessar dashboard do motorista', async ({ page }) => {
    await loginAs(page, 'locador');
    await page.goto('/motorista');
    // Should redirect back to locador dashboard
    await expect(page).toHaveURL(/\/locador/);
  });

  test('motorista não deve acessar dashboard do locador', async ({ page }) => {
    await loginAs(page, 'motorista');
    await page.goto('/locador');
    // Should redirect back to motorista dashboard
    await expect(page).toHaveURL(/\/motorista/);
  });
});
