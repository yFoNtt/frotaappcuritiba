import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  outputDir: 'e2e/test-results',
  // Start a local server unless BASE_URL points to an external (non-localhost) host.
  webServer:
    process.env.BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL)
      ? undefined
      : {
          command: process.env.CI
            ? 'npm run preview -- --port 4173 --strictPort'
            : 'npm run dev',
          url: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
});
