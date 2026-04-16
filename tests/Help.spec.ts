import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Help Page Validation', async ({ page }) => {
  console.log('🚀 Test Started: Help Page Validation');

  const loginPage = new LoginPage(page);

  // 🔐 Login
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔑 Logging in with valid credentials');
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Locate Help link
  console.log('🔍 Verifying Help link visibility');
  const helpTab = page.getByRole('link', { name: 'Help' });
  await expect(helpTab).toBeVisible();
  console.log('✅ Help link is visible');

  // ✅ Handle new tab
  console.log('🔗 Clicking Help link and waiting for new tab');
  const [helpPage] = await Promise.all([
    page.context().waitForEvent('page'),
    helpTab.click()
  ]);
  console.log('🆕 New Help tab opened');

  // ✅ Wait for new tab to load
  console.log('⏳ Waiting for Help page to load');
  await helpPage.waitForLoadState();

  // ✅ Validate URL
  console.log('🌐 Validating Help page URL');
  await expect(helpPage).toHaveURL(/knowledgebase/);
  console.log('✅ Help page URL is correct');

  // ✅ Validate title/content
  console.log('🔍 Validating Help page title');
  await expect(helpPage).toHaveTitle(/CourseMill|User Guide/i);
  console.log('✅ Help page title validated');

  // ✅ Close tab
  console.log('❌ Closing Help tab');
  await helpPage.close();

  console.log('🎉 Test Completed: Help Page Validation');
});