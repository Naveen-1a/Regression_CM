import { test, expect } from '@playwright/test';
test('Register for New Account - Full Validation', async ({ page }) => {
console.log('🚀 Test Started: Register for New Account');
await page.goto('https://test.coursemill.com/nsui');
const registerBtn = page.getByRole('button', { name: /register for new account/i });

console.log('🔍 Validating Register button visibility');
await expect(registerBtn).toBeVisible();

console.log('🔘 Validating Register button is enabled');
await expect(registerBtn).toBeEnabled();

console.log('🖱️ Clicking Register button');
await registerBtn.click();
// ===============================
// 🏢 Organization Selection Page Validation
// ===============================
console.log('🚀 Validating Organization Selection Page');

// ✅ Page Title
const title = page.getByRole('heading', { name: "What's Your Organization?" });
await expect(title).toBeVisible();
console.log('✅ Page title is visible');

// ✅ Description text
await expect(page.getByText('Select an organization below')).toBeVisible();
console.log('✅ Description text is visible');

// ✅ Logo validation
const logo = page.locator('img[alt="CourseMill Logo"]');
await expect(logo).toBeVisible();
console.log('✅ Logo is visible');

// ===============================
// 🏢 Organization Dropdown
// ===============================
console.log('🔍 Validating Organization dropdown');

const orgDropdown = page.locator('#orgs');
await expect(orgDropdown).toBeVisible();
console.log('✅ Organization dropdown is visible');


// ===============================
// 🔘 Continue Button
// ===============================
const continueBtn = page.getByRole('button', { name: /continue/i });

console.log('🔘 Validating Continue button (initial state)');
await expect(continueBtn).toBeDisabled();
console.log('✅ Continue button is disabled initially');

// (Optional) If enabling depends on selection, validate again
// await expect(continueBtn).toBeEnabled();

// ===============================
// 🔙 Return to Login Button
// ===============================
const returnBtn = page.getByRole('button', { name: /return to login/i });

console.log('🔍 Validating Return to Login button');
await expect(returnBtn).toBeVisible();
await expect(returnBtn).toBeEnabled();
console.log('✅ Return to Login button is visible & enabled');

// Click and validate navigation
console.log('🔙 Clicking Return to Login button');
await returnBtn.click();

await expect(page).toHaveURL(/login/);
console.log('✅ Successfully navigated back to Login page');

await registerBtn.click();
await expect(orgDropdown).toBeVisible();
console.log('📂 Selecting organization: regression_org');
await orgDropdown.selectOption('regression_org');
console.log('✅ Organization selected successfully');
// Access Code field
const accessCodeInput = page.locator('#accessCode');
await expect(accessCodeInput).toBeVisible();
await expect(accessCodeInput).toBeEnabled();
console.log('🔐 Access Code field enabled after selecting organization');

// ===============================
// ❌ INVALID ACCESS CODE
// ===============================
console.log('❌ Testing invalid access code');

await accessCodeInput.fill('123');
await expect(continueBtn).toBeEnabled();
await continueBtn.click();

// Validate error message
const errorMsg = page.locator('text=Illegal Access Code');
const errorMsg1 = page.locator('text=Sorry, the code you entered is incorrect. Give it another shot or ask your admin for the correct code.');
await expect(errorMsg).toBeVisible();
await expect(errorMsg1).toBeVisible();
console.log('⚠️ Invalid access code error displayed');

// ===============================
// ✅ VALID ACCESS CODE
// ===============================
console.log('✅ Testing valid access code');

await accessCodeInput.clear();
await accessCodeInput.fill('1234');

await expect(continueBtn).toBeEnabled();
await continueBtn.click();

// Validate navigation (update URL if needed)
await expect(page).toHaveURL(/self-registration/i);
console.log('🎉 Successfully navigated after valid access code');

console.log('🏁 Organization + Access Code Flow Completed');

console.log('🚀 Test Started: Self Registration Page');

  // ✅ Wait for page load
  await page.waitForLoadState('networkidle');
  console.log('🌐 Page loaded');

  
  // ===============================
  // 📝 SELF REGISTRATION PAGE
  // ===============================
  await page.waitForLoadState('networkidle');

  const uniqueId = Date.now();
  const usernameValue = `selfuser_${uniqueId}`;
  const lastNameValue = `user${uniqueId.toString().slice(-4)}`;
  const emailValue = `${usernameValue}@mail.com`;

  console.log(`🆕 Username: ${usernameValue}`);
  console.log(`🆕 LastName: ${lastNameValue}`);

  const username = page.locator('#username');
  const password = page.locator('#password');
  const firstName = page.locator('#firstname');
  const lastName = page.locator('#lastname');
  const email = page.locator('#email');

  await expect(username).toBeVisible();

  // Fill form
  await username.fill(usernameValue);
  await password.fill('P@ssw0rd');
  await firstName.fill('Test');
  await lastName.fill(lastNameValue);
  await email.fill(emailValue);

  console.log('✍️ Filled mandatory fields');

  const submitBtn = page.getByRole('button', { name: 'Submit' });

  // ✅ IMPORTANT FIX: wait until enabled
  await expect(submitBtn).toBeEnabled({ timeout: 5000 });
  console.log('✔️ Submit button enabled');

  // ===============================
  // 📤 SUBMIT + NAVIGATION
  // ===============================
  await Promise.all([
    page.waitForLoadState('networkidle'),
    submitBtn.click()
  ]);

  console.log('📤 Clicked Submit');

  // ===============================
  // ✅ REDIRECT VALIDATION
  // ===============================

  // Option 1: URL check
  await expect(page).not.toHaveURL(/self-registration/i);

  // Option 2: UI check (update if needed)
  await expect(page.locator('text=User Profile')).toBeVisible({ timeout: 10000 });

  console.log('🎉 User successfully registered and redirected');

  console.log('🏁 Test Completed Successfully');
});