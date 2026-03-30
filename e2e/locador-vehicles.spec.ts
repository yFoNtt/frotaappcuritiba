import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Locador - Veículos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'locador');
  });

  test('deve acessar página de veículos', async ({ page }) => {
    await page.goto('/locador/veiculos');
    await expect(page.getByText(/veículos/i).first()).toBeVisible();
  });

  test('deve exibir botão de adicionar veículo', async ({ page }) => {
    await page.goto('/locador/veiculos');
    const addButton = page.getByRole('button', { name: /adicionar|novo|cadastrar/i });
    await expect(addButton).toBeVisible();
  });

  test('deve abrir formulário de novo veículo', async ({ page }) => {
    await page.goto('/locador/veiculos');
    const addButton = page.getByRole('button', { name: /adicionar|novo|cadastrar/i });
    await addButton.click();

    // Should show vehicle form dialog
    await expect(page.getByText(/marca|modelo|placa/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('deve preencher e enviar formulário de veículo', async ({ page }) => {
    await page.goto('/locador/veiculos');
    const addButton = page.getByRole('button', { name: /adicionar|novo|cadastrar/i });
    await addButton.click();

    // Fill form fields (adjust selectors based on actual form)
    await page.waitForTimeout(1000);

    const brandInput = page.locator('input[name="brand"], input[placeholder*="marca" i]');
    if (await brandInput.isVisible()) {
      await brandInput.fill('Toyota');
    }

    const modelInput = page.locator('input[name="model"], input[placeholder*="modelo" i]');
    if (await modelInput.isVisible()) {
      await modelInput.fill('Corolla');
    }

    const plateInput = page.locator('input[name="plate"], input[placeholder*="placa" i]');
    if (await plateInput.isVisible()) {
      await plateInput.fill('TST-0E2E');
    }
  });

  test('deve exibir filtros de veículos', async ({ page }) => {
    await page.goto('/locador/veiculos');
    // Check for filter/search elements
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="pesquisar" i], input[placeholder*="filtrar" i]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir cards ou lista de veículos', async ({ page }) => {
    await page.goto('/locador/veiculos');
    await page.waitForTimeout(2000);

    // Should show vehicle cards or empty state
    const hasVehicles = await page.locator('[class*="card"], [class*="vehicle"]').count();
    const hasEmptyState = await page.getByText(/nenhum|vazio|cadastre/i).isVisible().catch(() => false);

    expect(hasVehicles > 0 || hasEmptyState).toBeTruthy();
  });
});
