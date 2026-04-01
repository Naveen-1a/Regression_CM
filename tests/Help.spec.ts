import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Help Page Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 🔐 Login
  await loginPage.navigate();
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Locate Help link (correct way)
  const helpTab = page.getByRole('link', { name: 'Help' });
  await expect(helpTab).toBeVisible();

  // ✅ Handle new tab properly
  const [helpPage] = await Promise.all([
    page.context().waitForEvent('page'),
    helpTab.click()
  ]);

  // ✅ Wait for new tab to load
  await helpPage.waitForLoadState();

  // ✅ Validate correct page opened
  await expect(helpPage).toHaveURL(/knowledgebase/);

  // ✅ Optional: validate title/content
  await expect(helpPage).toHaveTitle(/CourseMill|User Guide/i);

  // ✅ Close tab
  await helpPage.close();
});