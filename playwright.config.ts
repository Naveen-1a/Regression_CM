import { defineConfig } from '@playwright/test';

// 1. Generate a clean timestamp (e.g., 2026-04-16_15-30)
const date = new Date();
const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;

export default defineConfig({
  testDir: './tests',

  use: {
    headless: false,
    screenshot: 'on',
    video: 'retain-on-failure'
  },

  reporter: [
    ['list'],
    
    // ✅ Kept exactly the same so your email script can still find the results.json file
    ['json', { outputFile: 'test-results/results.json' }], 
    
    // ✅ Kept exactly the same
    ['html', { outputFolder: 'playwright-report', open: 'never' }], 
    
    // 🚀 Updated Ortoni to generate a new timestamped folder on every run
    ['ortoni-report', {
      open: 'never',
      folder: `ortoni-report/${timestamp}`, // This creates the unique folder!
      filename: 'index.html'
    }]
  ]
});