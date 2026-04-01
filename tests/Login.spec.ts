import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import users from '../test-data/users.json';

test('Login Page UI Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.validateLoginFieldsVisible();
});

test('Empty Login Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Navigate to login page
  await loginPage.navigate();

  // Wait until username field appears
  await page.waitForSelector('#username');

  // Validate button disabled
  await loginPage.validateLoginButtonDisabled();
});

test('Invalid Login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login('wrong', 'wrong');

  await loginPage.validateErrorMessage('The User ID/Password combination you have entered is invalid. Please try again.');
});

test('Valid Login - CourseMill', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login(users.admin.username, users.admin.password);

  await expect(page).toHaveURL(/dashboard/);
});
