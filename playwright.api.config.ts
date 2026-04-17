import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  reporter: [['list']],
  timeout: 60000,
  projects: [{ name: 'api', use: {} }],
});
