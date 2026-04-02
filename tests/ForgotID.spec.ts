import { test, expect } from '@playwright/test';

test('Forgot User ID flow validation', async ({ page }) => {

  // 1. Launch URL
  await page.goto('https://test.coursemill.com/nsui/login?route=/');

  // 2. Verify "Forgot User ID" link presence (with wait)
  const forgotUserIdLink = page.locator('text=Forgot User ID');

  try {
    await forgotUserIdLink.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    console.log('Forgot User ID link is NOT present after waiting. Ending test.');
    return; // 3. End test if not present
  }

  // 4. Click and verify navigation
  await forgotUserIdLink.click();
  await expect(page).toHaveURL(/.*forgot.*/);

  // Locators
  const sendRequestBtn = page.locator('button:has-text("Send Request")');
  const orgDropdown = page.locator('select'); // adjust if it's custom dropdown
  const emailField = page.locator('input[type="email"]');

  // 5. Verify button is disabled initially
  await expect(sendRequestBtn).toBeDisabled();

  // 6. Select organization
  await orgDropdown.selectOption({ label: 'productKSS_org1' });

  // Verify still disabled after selecting org
  await expect(sendRequestBtn).toBeDisabled();

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

  // Optional: verify redirected back to login page
  await expect(page).toHaveURL(/.*login.*/);
});