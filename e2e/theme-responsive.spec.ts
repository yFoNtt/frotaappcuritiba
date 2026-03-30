import { test, expect } from '@playwright/test';

test.describe('Tema e Responsividade', () => {
  test('deve alternar entre tema claro e escuro', async ({ page }) => {
    await page.goto('/');

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /tema|theme|dark|light|moon|sun/i });
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialClass = await htmlElement.getAttribute('class');

      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500);

      const newClass = await htmlElement.getAttribute('class');

      // Theme class should have changed
      expect(newClass).not.toBe(initialClass);

      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('deve exibir layout mobile corretamente', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Header should still be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check for mobile menu button (hamburger)
    const mobileMenu = page.getByRole('button', { name: /menu/i });
    if (await mobileMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mobileMenu.click();
      await page.waitForTimeout(500);
      // Navigation should appear
      await expect(page.getByText(/entrar|veículo|como funciona/i).first()).toBeVisible();
    }
  });

  test('deve exibir layout tablet corretamente', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    const mainContent = page.locator('main, [class*="container"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('deve exibir layout desktop corretamente', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Navigation links should be visible on desktop (not hidden in hamburger)
    const navLinks = page.locator('header nav a, header a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('login page deve ser responsiva em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Login card should be visible and not overflowing
    const loginCard = page.locator('[class*="card"]').first();
    await expect(loginCard).toBeVisible();

    // Form elements should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('dashboard locador deve ser responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Login first at desktop size, then resize
    await page.setViewportSize({ width: 1024, height: 768 });
    const { loginAs } = await import('./helpers/auth');
    await loginAs(page, 'locador');

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForTimeout(2000);

    // Content should still be visible
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });
});
