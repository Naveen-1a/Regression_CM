import { test, expect } from '@playwright/test';

// ✅ Slow down execution
test.use({ launchOptions: { slowMo: 500 } });

test('Forgot User ID flow validation', async ({ page }) => {

  // 1. Launch URL
  await page.goto('https://test.coursemill.com/nsui/login?route=/');

  // 2. Wait for "Forgot User ID"
  const forgotUserIdLink = page.locator('text=Forgot User ID');

  try {
    await forgotUserIdLink.waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    console.log('Forgot User ID link is NOT present after waiting. Ending test.');
    return;
  }

  // 4. Click and verify navigation
  await forgotUserIdLink.click();
  await expect(page).toHaveURL(/forgot/i);

  // Wait for page load
  await page.waitForLoadState('networkidle');

  // Locators
  const sendRequestBtn = page.locator('button:has-text("Send Request")');
  const orgDropdown = page.locator('select');
  const emailField = page.locator('#email');

  // 5. Verify button disabled initially
  await expect(sendRequestBtn).toBeDisabled();

  // 6. Select organization
  await orgDropdown.selectOption({ label: 'productKSS_org1' });

  // Verify still disabled
  await expect(sendRequestBtn).toBeDisabled();

  // Wait for email field
  await emailField.waitFor({ state: 'visible', timeout: 10000 });

  // 7. Enter incorrect email
  await emailField.fill('123@gmail');
  await sendRequestBtn.click();

  // Validate error message
  const errorMsg = page.locator('text=No user ID found for the provided email address.');
  await expect(errorMsg).toBeVisible();

  // 8. Enter correct email
  await emailField.fill('naveen.s@elblearning.com');
  await sendRequestBtn.click();

  // Validate success message
  const successMsg = page.locator('text=User ID information has been sent to your email address');
  await expect(successMsg).toBeVisible();

  // 9. Click "Return to login"
  const returnToLoginBtn = page.locator('text=Return to login');
  await returnToLoginBtn.click();

  // Verify redirected back
  await expect(page).toHaveURL(/login/);
});