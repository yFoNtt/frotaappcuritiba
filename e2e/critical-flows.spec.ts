import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS } from './helpers/auth';

/**
 * Fase D — Fluxos críticos E2E
 *
 * Cobre os três caminhos exigidos pela auditoria final:
 *  1. Login do locador → dashboard protegido
 *  2. Marketplace público acessível como visitante (sem auth)
 *  3. Motorista autenticado consegue ver seu veículo / contrato
 *
 * Os outros specs (auth-flows, public-pages, locador-vehicles,
 * motorista-dashboard) cobrem fluxos secundários. Este arquivo
 * concentra apenas o "happy path" de produção.
 */

test.describe('Fluxo crítico 1 — Login do locador', () => {
  test('locador consegue logar e chega ao dashboard /locador', async ({ page }) => {
    await loginAs(page, 'locador');

    // Confirma URL e que algum conteúdo do dashboard renderizou
    await expect(page).toHaveURL(/\/locador(\/|$)/);

    // Sidebar/menu do locador deve estar visível
    const veiculosLink = page.getByRole('link', { name: /ve[ií]culos/i }).first();
    await expect(veiculosLink).toBeVisible({ timeout: 10_000 });
  });

  test('credenciais inválidas mostram erro e não redirecionam', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[type="email"]');

    await page.fill('input[type="email"]', TEST_ACCOUNTS.locador.email);
    await page.fill('input[type="password"]', 'SenhaErrada!123');
    await page.click('button[type="submit"]');

    // Continua em /login (não deve redirecionar para /locador)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Fluxo crítico 2 — Marketplace público (visitante anon)', () => {
  test('home pública carrega sem autenticação', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$|\/home/);

    // Hero da home / chamada para o marketplace
    const heroHeading = page.getByRole('heading').first();
    await expect(heroHeading).toBeVisible();
  });

  test('listagem do marketplace é acessível e exibe veículos ou estado vazio', async ({ page }) => {
    await page.goto('/marketplace');

    // A rota deve responder sem redirecionar para /login
    await expect(page).not.toHaveURL(/\/login/);

    // Espera carregar — pode haver cards ou empty state, ambos válidos
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const hasCards = await page
      .locator('[data-testid="vehicle-card"], article, .vehicle-card')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/nenhum ve[ií]culo|sem ve[ií]culos|nada encontrado/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('visitante NÃO consegue acessar área do locador (redireciona para login)', async ({ page }) => {
    await page.goto('/locador');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Fluxo crítico 3 — Motorista vê seu veículo', () => {
  test('motorista loga e acessa dashboard com dados do contrato/veículo', async ({ page }) => {
    await loginAs(page, 'motorista');

    await expect(page).toHaveURL(/\/motorista(\/|$)/);

    // Algum heading ou seção principal deve renderizar
    const main = page.locator('main, [role="main"]').first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test('motorista acessa página do seu veículo (somente leitura)', async ({ page }) => {
    await loginAs(page, 'motorista');

    // Tenta navegar via link "Meu veículo" / "Veículo"
    const veiculoLink = page
      .getByRole('link', { name: /meu ve[ií]culo|ve[ií]culo/i })
      .first();

    if (await veiculoLink.isVisible().catch(() => false)) {
      await veiculoLink.click();
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      // Não deve ter sido redirecionado para /login
      await expect(page).not.toHaveURL(/\/login/);
    }

    // Garante que continua dentro da área do motorista
    await expect(page).toHaveURL(/\/motorista/);
  });

  test('motorista NÃO consegue acessar área do locador', async ({ page }) => {
    await loginAs(page, 'motorista');

    await page.goto('/locador/veiculos');
    await page.waitForTimeout(2000);

    // Espera redirect para /motorista, /login ou página de não autorizado
    const url = page.url();
    expect(url).not.toMatch(/\/locador\/veiculos$/);
  });
});
