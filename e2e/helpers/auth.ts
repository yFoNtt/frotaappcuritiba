import { type Page, expect } from '@playwright/test';
import { testAccount } from './testPasswords';

// Contas criadas pelas funções de seed (seed-test-locadores / seed-test-motoristas).
// A senha é derivada de E2E_SEED_TOKEN no momento do acesso; sem o token, um erro claro é lançado.
export const TEST_ACCOUNTS = {
  locador: withDashboard('locador.teste.a@frotaapp.dev', '/locador'),
  motorista: withDashboard('motorista.teste.a@frotaapp.dev', '/motorista'),
};

function withDashboard(email: string, dashboardUrl: string) {
  const account = testAccount(email);
  return {
    email,
    dashboardUrl,
    get password() {
      return account.password;
    },
  };
}

type AccountRole = keyof typeof TEST_ACCOUNTS;

/**
 * Login with a test account via the login form.
 * After login, waits for redirect to the role's dashboard.
 */
export async function loginAs(page: Page, role: AccountRole) {
  const account = TEST_ACCOUNTS[role];

  await page.goto('/login');
  await page.waitForSelector('input[type="email"]');

  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(`**${account.dashboardUrl}**`, { timeout: 15000 });
  await expect(page).toHaveURL(new RegExp(account.dashboardUrl));
  await dismissWelcomeTour(page);
}

/**
 * Fecha a janela de boas-vindas ("Bem-vindo ao FrotaApp") se ela aparecer
 * após o login, para não cobrir botões da tela. Não altera o app.
 */
export async function dismissWelcomeTour(page: Page) {
  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: /^bem-vindo ao frotaapp$/i }),
  });
  // A janela abre alguns instantes após o carregamento do painel.
  const appeared = await dialog.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
  if (appeared) {
    await dialog.getByRole('button', { name: /close|fechar/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
  }
}

/**
 * Logout by clicking the logout button in the sidebar or header.
 */
export async function logout(page: Page) {
  // Look for logout/sair button
  await dismissWelcomeTour(page);
  const logoutButton = page.getByRole('button', { name: /^sair$/i }).first();
  await logoutButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // Confirm logout dialog if present
    const confirmButton = page.getByRole('alertdialog').getByRole('button', { name: /sair/i });
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }
  }

  // O app navega para "/" após o logout; aceita também /login.
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/login', { timeout: 10000 });
}

/**
 * Ensure the user is on the expected dashboard after login.
 */
export async function expectDashboard(page: Page, role: AccountRole) {
  const account = TEST_ACCOUNTS[role];
  await expect(page).toHaveURL(new RegExp(account.dashboardUrl));
}
