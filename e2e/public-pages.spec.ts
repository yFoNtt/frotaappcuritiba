import { test, expect } from '@playwright/test';

test.describe('Páginas Públicas', () => {
  test('deve carregar a página inicial', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/frotaapp/i);
  });

  test('deve exibir hero section na página inicial', async ({ page }) => {
    await page.goto('/');
    // Check for CTA or main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('deve exibir seção de veículos em destaque', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/veículo|destaque|disponíve/i).first()).toBeVisible();
  });

  test('deve acessar página de veículos públicos', async ({ page }) => {
    await page.goto('/veiculos');
    await expect(page.getByText(/veículo/i).first()).toBeVisible();
  });

  test('deve acessar página como funciona', async ({ page }) => {
    await page.goto('/como-funciona');
    await expect(page.getByText(/como funciona|como/i).first()).toBeVisible();
  });

  test('deve acessar página para locadores', async ({ page }) => {
    await page.goto('/para-locadores');
    await expect(page.getByText(/locador|alugar|frota/i).first()).toBeVisible();
  });

  test('deve navegar pelo header', async ({ page }) => {
    await page.goto('/');

    // Check header navigation links
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const loginLink = page.getByRole('link', { name: /entrar|login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('deve exibir footer com links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('deve exibir página 404 para rota inexistente', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page.getByText(/404|não encontrad|not found/i).first()).toBeVisible();
  });

  test('deve acessar detalhes de veículo público', async ({ page }) => {
    await page.goto('/veiculos');
    await page.waitForTimeout(2000);

    // Try clicking on a vehicle card if available
    const vehicleCard = page.locator('[class*="card"]').first();
    if (await vehicleCard.isVisible()) {
      await vehicleCard.click();
      await page.waitForTimeout(1000);
      // Should navigate to vehicle details
      await expect(page.getByText(/detalhes|modelo|marca|preço/i).first()).toBeVisible();
    }
  });
});
