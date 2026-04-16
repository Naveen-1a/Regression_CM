import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('News Page Validation', async ({ page }) => {
  console.log('🚀 Test Started: News Page Validation');

  const loginPage = new LoginPage(page);

  // 🔐 Login
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔑 Logging in with valid credentials');
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  console.log('🔍 Verifying News tab visibility after login');
  const newsTab = page.locator('a[href="/nsui/news"]');
  await expect(newsTab).toBeVisible();
  console.log('✅ Login successful, News tab is visible');

  // 📂 Click News tab
  console.log('📂 Clicking News tab');
  await newsTab.click();

  // ✅ Wait for News page
  console.log('🌐 Waiting for navigation to News page');
  await expect(page).toHaveURL(/news/);
  console.log('✅ Successfully navigated to News page');

  console.log('🎉 Test Completed: News Page Validation');
});