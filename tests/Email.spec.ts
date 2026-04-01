import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('News Page Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 🔐 Login
  await loginPage.navigate();
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  const emailTab = page.locator('a[href="/nsui/email"]');
  await expect(emailTab).toBeVisible();

  
  // 📂 Click Email tab
  await emailTab.click();
  // ✅ Wait for Email page
  await expect(page).toHaveURL(/email/);
  });