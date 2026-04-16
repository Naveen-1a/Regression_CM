import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    headless: false,
    screenshot: 'on',
    video: 'retain-on-failure'
  },

  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }], // ✅ needed for email
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // ✅ optional but useful
    ['ortoni-report', {
      open: 'never',
      folder: 'ortoni-report',
      filename: 'index.html'
    }]
  ]
});