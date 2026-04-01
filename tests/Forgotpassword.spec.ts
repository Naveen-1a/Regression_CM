import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Forgot Password - Full Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.clickForgotPassword();
  await loginPage.validateForgotPasswordPage();

  const usernameField = page.locator('#username');
  const sendRequestBtn = page.getByRole('button', { name: 'Send Request' });

  // ✅ UI Validation
  await expect(page.getByText('Forgot Your Password?')).toBeVisible();
  await expect(page.getByText(/We've got your back/i)).toBeVisible();
  await expect(usernameField).toBeVisible();
  await expect(sendRequestBtn).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Login' })).toBeVisible();

  // ✅ Button state validation
  await expect(sendRequestBtn).toBeDisabled();
  await usernameField.fill('testuser');
  await expect(sendRequestBtn).toBeEnabled();

  // ❌ Empty validation
  await usernameField.fill('');
  await expect(sendRequestBtn).toBeDisabled();

  // ❌ Invalid user
  await usernameField.fill('invalid_user');
  await sendRequestBtn.click();
  await expect(page.locator('text=Invalid User Data')).toBeVisible();

  // ✅ Valid user
  await usernameField.clear();
  await usernameField.fill('testn4');
  await sendRequestBtn.click();
  const successMsg = page.locator('text=An email has been sent to the email address on file with your username/password');
  await expect(successMsg).toBeVisible();
  await page.waitForTimeout(5000);

  // ✅ Success page validation
  await expect(page.getByRole('heading', { name: 'Help is on the way' })).toBeVisible();

  await expect(
    page.locator('text=An email has been sent to your inbox with further instructions.')
  ).toBeVisible();

  const returnToLoginBtn = page.getByRole('button', { name: 'Return to Login' });

  await expect(returnToLoginBtn).toBeVisible();
  await expect(returnToLoginBtn).toBeEnabled();

  // Return to Login Button
  await returnToLoginBtn.click();
  await expect(page).toHaveURL(/login/);
  await page.waitForTimeout(5000);
});