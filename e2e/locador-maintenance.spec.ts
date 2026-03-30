import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Locador - Manutenções', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'locador');
  });

  test('deve acessar página de manutenções', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    await expect(page.getByText(/manuten/i).first()).toBeVisible();
  });

  test('deve exibir botão de nova manutenção', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    const addButton = page.getByRole('button', { name: /nova|adicionar|registrar/i });
    await expect(addButton).toBeVisible();
  });

  test('deve abrir formulário de manutenção', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    const addButton = page.getByRole('button', { name: /nova|adicionar|registrar/i });
    await addButton.click();

    await expect(page.getByText(/veículo|tipo|descrição|data/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir cards de estatísticas de manutenção', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    await page.waitForTimeout(2000);

    // Check for stats cards
    const statsCards = page.locator('[class*="card"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir filtros de manutenção', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    const filterElements = page.getByText(/pendente|concluíd|todos|agendad/i);
    await expect(filterElements.first()).toBeVisible({ timeout: 5000 });
  });

  test('deve exibir tabela de manutenções', async ({ page }) => {
    await page.goto('/locador/manutencoes');
    await page.waitForTimeout(2000);

    const hasTable = await page.locator('table').count();
    const hasEmptyState = await page.getByText(/nenhum|vazio/i).isVisible().catch(() => false);

    expect(hasTable > 0 || hasEmptyState).toBeTruthy();
  });
});
