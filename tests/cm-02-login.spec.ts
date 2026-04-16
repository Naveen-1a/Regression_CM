import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import users from '../test-data/users.json';

test('Login Page - Full Validation', async ({ page }) => {
  console.log('🚀 Test Started: Login Page Full Validation');

  const loginPage = new LoginPage(page);

  // ===============================
  // ✅ UI Validation
  // ===============================
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔍 Validating login page UI elements');
  await loginPage.validateLoginFieldsVisible();
  console.log('✅ Login UI validation completed');

  // ===============================
  // ❌ Empty Login Validation
  // ===============================
  console.log('❌ Testing empty login validation');

  await page.waitForSelector('#username');
  await loginPage.validateLoginButtonDisabled();
  console.log('✅ Login button is disabled for empty fields');

  // ===============================
  // ❌ Invalid Login
  // ===============================
  console.log('❌ Testing invalid login');

  await loginPage.login('wrong', 'wrong');

  await loginPage.validateErrorMessage(
    'The User ID/Password combination you have entered is invalid. Please try again.'
  );
  console.log('⚠️ Invalid login error message validated');

  // ===============================
  // ✅ Valid Login
  // ===============================
  console.log('✅ Testing valid login');

  await loginPage.navigate(); // re-navigate to reset state

  await loginPage.login(users.admin.username, users.admin.password);

  await expect(page).toHaveURL(/dashboard/);
  console.log('🎉 Successfully logged in and navigated to dashboard');

  console.log('🎉 Test Completed: Login Page Full Validation');
});