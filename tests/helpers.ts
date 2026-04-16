import { expect } from '@playwright/test';

// Helper: Admin Login and Navigate to Manage Orgs
export async function adminLoginAndNavigate(page) {
  await page.goto('https://test.coursemill.com/');
  await page.fill('#login_userid_tb', 'saraswathiadmin');
  await page.fill('#login_password_tb', 'Admin123$');
  await page.click('#login_btn');
  await page.waitForLoadState('networkidle');
  await page.getByText('Admin Tasks').click();
  await page.locator('a[name="Manage Orgs"]').click();
  await page.waitForTimeout(2000);
}

// Helper: Search for an Org and Click Edit
export async function searchAndEditOrg(page, orgId) {
  const orgInput = page.locator('input#fpOrgIDTb');
  await expect(orgInput).toBeVisible();
  await orgInput.fill(orgId);
  await orgInput.press('Enter');
  await page.locator('li.dynBtn.search:visible').first().click();

  console.log(`🔍 Searching for Org: ${orgId}`);

  const visibleOrgCell = page.locator('td', { hasText: orgId }).and(page.locator(':visible')).first();
  try {
    await visibleOrgCell.waitFor({ state: 'visible', timeout: 10000 });
    await visibleOrgCell.click();
  } catch (error) {
    const attachedOrgCell = page.locator('td', { hasText: orgId }).first();
    await attachedOrgCell.waitFor({ state: 'attached', timeout: 5000 });
    await attachedOrgCell.click({ force: true });
  }

  const viewEditBtn = page.locator('div#editBtnOrgHdr');
  await viewEditBtn.waitFor({ state: 'attached', timeout: 10000 });
  await viewEditBtn.click({ force: true });
}

// Helper: Dynamically find a frame by a specific locator inside it
export async function findFrameByLocator(page, selector) {
  console.log('⏳ Waiting for Edit Frame...');
  for (let i = 0; i < 20; i++) {
    for (const frame of page.frames()) {
      if (await frame.locator(selector).count() > 0) {
        return frame;
      }
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`❌ Frame containing ${selector} not found`);
}

// Helper: Standard Human Type & Clear (Triple click + backspace)
export async function humanType(page, locator, text, delay = 50) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  if (text) await locator.type(text, { delay });
  await locator.press('Tab');
  await page.waitForTimeout(200);
}

// Helper: Aggressive Clear & Type (For stubborn Vue fields)
export async function aggressiveClearAndType(page, locator, text) {
  await locator.click();
  await locator.press('End');
  for (let i = 0; i < 20; i++) await locator.press('Backspace');
  await locator.press('Home');
  for (let i = 0; i < 20; i++) await locator.press('Delete');
  await page.waitForTimeout(200);
  await locator.type(text, { delay: 100 });
  await locator.press('Tab');
  await page.waitForTimeout(500);
}

// Helper: Validate Org in NSUI Dropdown
export async function checkOrgInNSUI(page, orgId) {
  await page.goto('https://test.coursemill.com/nsui/');
  await page.waitForTimeout(1000);
  await page.locator('#registerBtn').click();
  await page.waitForTimeout(1000);

  const orgDropdown = page.locator('#orgs');
  await expect(orgDropdown).toBeVisible();
  await orgDropdown.click();
  await page.waitForTimeout(1000);

  const options = await orgDropdown.locator('option').allTextContents();
  if (options.includes(orgId)) {
    console.log(`🔴 Org "${orgId}" is PRESENT in dropdown`);
  } else {
    console.log(`🟢 Org "${orgId}" is NOT present in dropdown`);
  }
}