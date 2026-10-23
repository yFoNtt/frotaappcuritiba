import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS } from './helpers/auth';

test.describe('LGPD — fluxos de privacidade', () => {
  test('cadastro bloqueia submit sem aceite dos termos', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByRole('tab', { name: /cadastrar/i }).click().catch(() => {});

    // Preenche minimamente o formulário (não precisa ser válido — checkbox bloqueia antes)
    await page.locator('input[type="email"]').first().fill('teste-lgpd@example.com');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill('SenhaForte@123');
    if ((await passwordInputs.count()) > 1) {
      await passwordInputs.nth(1).fill('SenhaForte@123');
    }

    // O botão fica habilitado; a validação acontece no envio e mostra a mensagem do aceite.
    const submit = page.getByRole('button', { name: /criar conta/i });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(
      page.getByText(/precisa aceitar os termos de uso e a pol[ií]tica de privacidade/i),
    ).toBeVisible();
    // Continua no cadastro: nenhuma conta foi criada.
    await expect(page).toHaveURL(/\/cadastro/);
  });

  test('locador consegue exportar seus dados em JSON', async ({ page }) => {
    await loginAs(page, 'locador');
    await page.goto('/locador/configuracoes');

    // Aguarda a seção de Privacidade
    await expect(page.getByText('Privacidade e seus dados')).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.getByRole('button', { name: /exportar meus dados/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('meus-dados-frotaapp.json');

    const path = await download.path();
    expect(path).toBeTruthy();
    if (path) {
      const fs = await import('node:fs/promises');
      const content = await fs.readFile(path, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toBeTruthy();
      expect(typeof parsed).toBe('object');
    }
  });

  test('revogar consentimento direciona para o ConsentGate e reaceite restaura acesso', async ({ page }) => {
    await loginAs(page, 'locador');
    await page.goto('/locador/configuracoes');

    await expect(page.getByText('Privacidade e seus dados')).toBeVisible({ timeout: 10000 });

    // Revogar
    await page.getByRole('button', { name: /revogar consentimento/i }).first().click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /revogar consentimento/i })
      .click();

    // Espera a revogação ser gravada antes de navegar (evita corrida com o PATCH).
    await expect(page.getByText(/consentimento revogado\. para continuar/i)).toBeVisible({ timeout: 10000 });

    // Navega — espera ser redirecionado para /consent-required
    await page.goto('/locador');
    await expect(page).toHaveURL(/\/consent-required/, { timeout: 10000 });
    await expect(page.getByText(/consentimento revogado|aceite necessário/i)).toBeVisible();

    // Reaceitar
    await page.getByLabel(/li e aceito/i).check();
    await page.getByRole('button', { name: /aceitar e continuar/i }).click();

    await expect(page).toHaveURL(/\/locador(\/|$)/, { timeout: 10000 });
  });
});
