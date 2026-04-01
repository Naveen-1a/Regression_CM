import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('News Page Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 🔐 Login
  await loginPage.navigate();
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  const newsTab = page.locator('a[href="/nsui/news"]');
  await expect(newsTab).toBeVisible();

  
  // 📂 Click News tab
  await newsTab.click();
  // ✅ Wait for News page
  await expect(page).toHaveURL(/news/);
  });