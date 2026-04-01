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
    ['ortoni-report', {
      open: 'never',
      folder: 'ortoni-report',
      filename: 'index.html'
    }]
  ]
});