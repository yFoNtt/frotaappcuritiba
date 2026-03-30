import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Locador - Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'locador');
  });

  test('deve acessar página de contratos', async ({ page }) => {
    await page.goto('/locador/contratos');
    await expect(page.getByText(/contrato/i).first()).toBeVisible();
  });

  test('deve exibir botão de novo contrato', async ({ page }) => {
    await page.goto('/locador/contratos');
    const addButton = page.getByRole('button', { name: /novo|adicionar|criar/i });
    await expect(addButton).toBeVisible();
  });

  test('deve abrir formulário de novo contrato', async ({ page }) => {
    await page.goto('/locador/contratos');
    const addButton = page.getByRole('button', { name: /novo|adicionar|criar/i });
    await addButton.click();

    // Should show contract form
    await expect(page.getByText(/motorista|veículo|valor|data/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir lista ou tabela de contratos', async ({ page }) => {
    await page.goto('/locador/contratos');
    await page.waitForTimeout(2000);

    const hasContracts = await page.locator('table, [class*="card"]').count();
    const hasEmptyState = await page.getByText(/nenhum|vazio/i).isVisible().catch(() => false);

    expect(hasContracts > 0 || hasEmptyState).toBeTruthy();
  });

  test('deve exibir filtros de status de contrato', async ({ page }) => {
    await page.goto('/locador/contratos');
    // Check for status filters (ativo, finalizado, etc.)
    const filterElements = page.getByText(/ativo|finalizado|todos/i);
    await expect(filterElements.first()).toBeVisible({ timeout: 5000 });
  });
});
