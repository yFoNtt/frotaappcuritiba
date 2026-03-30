import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Motorista - Dashboard e Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'motorista');
  });

  test('deve acessar dashboard do motorista', async ({ page }) => {
    await expect(page).toHaveURL(/\/motorista/);
  });

  test('deve exibir sidebar com navegação', async ({ page }) => {
    // Check for navigation items
    const navItems = page.getByText(/veículo|pagamento|documento|histórico/i);
    await expect(navItems.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve acessar página de veículo', async ({ page }) => {
    await page.goto('/motorista/veiculo');
    await page.waitForTimeout(2000);

    // Should show vehicle info or empty state
    const hasContent = await page.getByText(/veículo|nenhum|sem veículo/i).first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });

  test('deve acessar página de pagamentos', async ({ page }) => {
    await page.goto('/motorista/pagamentos');
    await expect(page.getByText(/pagamento/i).first()).toBeVisible();
  });

  test('deve acessar página de documentos', async ({ page }) => {
    await page.goto('/motorista/documentos');
    await expect(page.getByText(/documento/i).first()).toBeVisible();
  });

  test('deve acessar página de histórico', async ({ page }) => {
    await page.goto('/motorista/historico');
    await expect(page.getByText(/histórico/i).first()).toBeVisible();
  });

  test('deve acessar configurações', async ({ page }) => {
    await page.goto('/motorista/configuracoes');
    await expect(page.getByText(/configura/i).first()).toBeVisible();
  });
});
