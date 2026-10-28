import { defineConfig, devices } from '@playwright/test';

// The e2e tests drive the three playground pages. The Express server runs on a
// throwaway data directory, seeded from playground/samples on every run.
const DATA_DIR = '.e2e-data';
const resetDataDir = `node -e "require('fs').rmSync('${DATA_DIR}', { recursive: true, force: true })"`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `${resetDataDir} && tsx playground/server/server.ts`,
      url: 'http://localhost:3001/',
      env: { EASY_MEDIA_DATA_DIR: DATA_DIR },
      reuseExistingServer: false,
    },
    {
      command: 'vite --config playground/esm/vite.config.ts',
      url: 'http://localhost:5174/',
      reuseExistingServer: false,
    },
    {
      command: 'vite --config playground/pick/vite.config.ts',
      url: 'http://localhost:5175/',
      reuseExistingServer: false,
    },
  ],
});
