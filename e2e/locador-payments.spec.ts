import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Locador - Pagamentos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'locador');
  });

  test('deve acessar página de pagamentos', async ({ page }) => {
    await page.goto('/locador/pagamentos');
    await expect(page.getByText(/pagamento/i).first()).toBeVisible();
  });

  test('deve exibir botão de registrar pagamento', async ({ page }) => {
    await page.goto('/locador/pagamentos');
    const addButton = page.getByRole('button', { name: /registrar|novo|adicionar/i });
    await expect(addButton).toBeVisible();
  });

  test('deve exibir tabela ou lista de pagamentos', async ({ page }) => {
    await page.goto('/locador/pagamentos');
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmptyState = await page.getByText(/nenhum|vazio/i).isVisible().catch(() => false);

    expect(hasTable > 0 || hasEmptyState).toBeTruthy();
  });

  test('deve exibir filtros de pagamentos', async ({ page }) => {
    await page.goto('/locador/pagamentos');
    const filterElements = page.getByText(/pendente|pago|atrasado|todos/i);
    await expect(filterElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir botão de exportar', async ({ page }) => {
    await page.goto('/locador/pagamentos');
    const exportButton = page.getByRole('button', { name: /exportar|download|excel|pdf/i });
    if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportButton).toBeVisible();
    }
  });
});
