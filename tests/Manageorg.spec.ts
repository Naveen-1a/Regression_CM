import { test, expect } from '@playwright/test';

test('CourseMill - Add Organization validation', async ({ page }) => {

  await page.goto('https://test.coursemill.com/');

  // ---- Login ----
  await page.fill('#login_userid_tb', 'saraswathiadmin');
  await page.fill('#login_password_tb', 'Admin123$');
  await page.click('#login_btn');

  await page.waitForLoadState('networkidle');

  // ---- Navigation ----
  await page.click('span:has-text("Admin Tasks")');
  await page.click('a[name="Manage Orgs"]');

  await page.waitForTimeout(2000);

  // ---- Click Add Organization ----
  await page.locator('#addorg').click();

  await page.waitForTimeout(2000);

  // ---- Find correct frame dynamically ----
  let targetFrame;

  for (let i = 0; i < 20; i++) {
    for (const frame of page.frames()) {
      if (await frame.locator('#orgIDTb').count() > 0) {
        targetFrame = frame;
        break;
      }
    }
    if (targetFrame) break;
    await page.waitForTimeout(1000);
  }

  if (!targetFrame) {
    throw new Error('Org ID field not found in any frame');
  }

  // ---- Locators ----
  const orgIdField = targetFrame.locator('#orgIDTb');
  const orgDescField = targetFrame.locator('#orgDescTb');
  const saveBtn = targetFrame.locator('#saveBtn');

  await expect(orgIdField).toBeVisible();

  // ===============================
  // 🔴 Case 1: Only Org ID filled
  // ===============================
  await orgIdField.fill('');
  await orgDescField.fill('');

  await orgIdField.click();
  await orgIdField.type('Org123', { delay: 100 });

  await expect(saveBtn).toBeEnabled();
  await saveBtn.click({ force: true });

  await expect(
    targetFrame.locator('text=One or more of the mandatory fields have not been entered.')
  ).toBeVisible();

  // ===============================
  // 🔴 Case 2: Only Org Description filled
  // ===============================
  await orgIdField.fill('');
  await orgDescField.fill('');

  await orgDescField.click();
  await orgDescField.type('Test Description', { delay: 100 });

  await expect(saveBtn).toBeEnabled();
  await saveBtn.click({ force: true });

  await expect(
    targetFrame.locator('text=One or more of the mandatory fields have not been entered.')
  ).toBeVisible();

  // ===============================
  // 🔴 Validation: Special Characters
  // ===============================
  await orgIdField.fill('');
  await orgDescField.fill('');

  await orgIdField.click();
  await orgIdField.type('@#$%', { delay: 100 });

  await orgDescField.click();
  await orgDescField.type('Test Description', { delay: 100 });

  await expect(saveBtn).toBeEnabled();
  await saveBtn.click({ force: true });

  await expect(
    targetFrame.locator('text=The Org ID you have chosen is invalid')
  ).toBeVisible();

  // ===============================
  // 🟢 Valid Input
  // ===============================
  const validOrgId = 'Org' + Date.now();

  await orgIdField.fill('');
  await orgDescField.fill('');

  await orgIdField.click();
  await orgIdField.type(validOrgId, { delay: 100 });

  await orgDescField.click();
  await orgDescField.type('Valid Organization', { delay: 100 });

  await expect(saveBtn).toBeEnabled();
  await saveBtn.click({ force: true });

});