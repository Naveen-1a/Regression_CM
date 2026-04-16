import { test, expect } from '@playwright/test';
const fs = require('fs');

test('CourseMill - Check Org presence in NSUI (Info only)', async ({ page }) => {

  // ✅ Read Org ID from file
  const storedData = JSON.parse(fs.readFileSync('orgData.json'));
  const savedOrgId = storedData.orgId;

  // ---- Launch NSUI ----
  await page.goto('https://test.coursemill.com/nsui/');
  await page.waitForTimeout(1000);

  // ---- Click Register ----
  await page.locator('#registerBtn').click();
  await page.waitForTimeout(1000);

  // ---- Verify Registration Page ----
  const orgDropdown = page.locator('#orgs');
  await expect(orgDropdown).toBeVisible();

  // ---- Open dropdown ----
  await orgDropdown.click();
  await page.waitForTimeout(1000);

  // ---- Get all org options
  const options = await orgDropdown.locator('option').allTextContents();

  // ✅ Only log result (NO FAIL)
  if (options.includes(savedOrgId)) {
    console.log(`🔴 Org "${savedOrgId}" is PRESENT in dropdown`);
  } else {
    console.log(`🟢 Org "${savedOrgId}" is NOT present in dropdown`);
  }

  // Optional debug
  console.log('Checked Org ID:', savedOrgId);

});