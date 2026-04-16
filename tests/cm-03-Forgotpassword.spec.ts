import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Forgot Password - Full Validation', async ({ page }) => {
  console.log('🚀 Test Started: Forgot Password Validation');

  const loginPage = new LoginPage(page);

  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔗 Clicking Forgot Password link');
  await loginPage.clickForgotPassword();

  console.log('🌐 Validating Forgot Password page load');
  await loginPage.validateForgotPasswordPage();

  const usernameField = page.locator('#username');
  const sendRequestBtn = page.getByRole('button', { name: 'Send Request' });

  // ✅ UI Validation
  console.log('🔍 Validating UI elements');
  await expect(page.getByText('Forgot Your Password?')).toBeVisible();
  await expect(page.getByText(/We've got your back/i)).toBeVisible();
  await expect(usernameField).toBeVisible();
  await expect(sendRequestBtn).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to Login' })).toBeVisible();
  console.log('✅ UI validation completed');

  // ✅ Button state validation
  console.log('🔘 Validating button enable/disable behavior');
  await expect(sendRequestBtn).toBeDisabled();

  await usernameField.fill('testuser');
  console.log('✏️ Entered username: testuser');
  await expect(sendRequestBtn).toBeEnabled();

  // ❌ Empty validation
  console.log('❌ Testing empty username validation');
  await usernameField.fill('');
  await expect(sendRequestBtn).toBeDisabled();

  // ❌ Invalid user
  console.log('❌ Testing invalid user scenario');
  await usernameField.fill('invalid_user');
  await sendRequestBtn.click();
  await expect(page.locator('text=Invalid User Data')).toBeVisible();
  console.log('⚠️ Invalid user error message displayed');

  // ✅ Valid user
  console.log('✅ Testing valid user scenario');
  await usernameField.clear();
  await usernameField.fill('regtestuser_01');
  console.log('✏️ Entered valid username: testn4');

  await sendRequestBtn.click();

  const successMsg = page.locator('text=An email has been sent to the email address on file with your username/password');
  await expect(successMsg).toBeVisible();
  console.log('📧 Success message displayed');

  await page.waitForTimeout(2000);

  // ✅ Success page validation
  console.log('🔍 Validating success page content');
  await expect(page.getByRole('heading', { name: 'Help is on the way' })).toBeVisible();

  await expect(
    page.locator('text=An email has been sent to your inbox with further instructions.')
  ).toBeVisible();
  console.log('✅ Success page content validated');

  const returnToLoginBtn = page.getByRole('button', { name: 'Return to Login' });

  await expect(returnToLoginBtn).toBeVisible();
  await expect(returnToLoginBtn).toBeEnabled();
  console.log('🔘 Return to Login button is visible and enabled');

  // Return to Login Button
  console.log('🔙 Clicking Return to Login button');
  await returnToLoginBtn.click();

  await expect(page).toHaveURL(/login/);
  console.log('✅ Successfully navigated back to Login page');

  await page.waitForTimeout(5000);

  console.log('🎉 Test Completed: Forgot Password Validation');
});