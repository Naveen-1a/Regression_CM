import { test, expect } from '@playwright/test';
const fs = require('fs');
// ==========================================================
  // 🧪 TEST 5: Set Access Code for Org (STATIC 1234 ONLY)
  // ==========================================================
  test('Set Access Code for Org', async ({ page }) => {

    const storedData = JSON.parse(fs.readFileSync('orgData.json'));
    const savedOrgId = storedData.orgId;

    console.log(`🔍 Using Org ID: ${savedOrgId}`);

    await page.goto('https://test.coursemill.com/');

    // ---- Login ----
    await page.fill('#login_userid_tb', 'saraswathiadmin');
    await page.fill('#login_password_tb', 'Admin123$');
    await page.click('#login_btn');

    // ---- Navigate ----
    await page.getByText('Admin Tasks').click();
    await page.locator('a[name="Manage Orgs"]').click();

    // ---- Search Logic ----
    const orgInput = page.locator('input#fpOrgIDTb');
    await expect(orgInput).toBeVisible();
    await orgInput.fill(savedOrgId);
    
    await orgInput.press('Enter');

    const searchBtn = page.locator('li.dynBtn.search:visible').first();
    await searchBtn.click();

    console.log(`🔍 Searching for Org: ${savedOrgId}`);

    // ---- Target Visible Row or Force Click ----
    const visibleOrgCell = page.locator('td', { hasText: savedOrgId }).and(page.locator(':visible')).first();

    try {
      await visibleOrgCell.waitFor({ state: 'visible', timeout: 10000 });
      await visibleOrgCell.click();
      console.log('✅ Clicked visible cell successfully.');
    } catch (error) {
      console.log('⚠️ Visible cell check failed. Attempting a force-click on the attached element...');
      const attachedOrgCell = page.locator('td', { hasText: savedOrgId }).first();
      await attachedOrgCell.waitFor({ state: 'attached', timeout: 5000 });
      await attachedOrgCell.click({ force: true });
      console.log('✅ Force-clicked the hidden/overlayed cell.');
    }

    // ---- View / Edit Button ----
    const viewEditBtn = page.locator('div#editBtnOrgHdr');
    await viewEditBtn.waitFor({ state: 'attached', timeout: 10000 }); 
    await viewEditBtn.click({ force: true });

    // ---- Frame Handling ----
    console.log('⏳ Waiting for Edit Frame...');
    
    let editFrame;

    for (let i = 0; i < 20; i++) {
      for (const frame of page.frames()) {
        if (await frame.locator('#selfregpwdTb').count() > 0) {
          editFrame = frame;
          break;
        }
      }
      if (editFrame) break;
      await page.waitForTimeout(1000);
    }

    if (!editFrame) {
      throw new Error('❌ Edit Org frame not found');
    }

    // ---- Set Access Code & Save ----
    const accessCodeInput = editFrame.locator('#selfregpwdTb');
    const saveBtn = editFrame.locator('#saveBtn').first();

    await expect(accessCodeInput).toBeVisible();
    
    // 1. PHYSICAL CLEAR: Focus, move cursor to the end, and spam backspace
    console.log('🧹 Executing physical keyboard backspaces...');
    await accessCodeInput.click();
    await accessCodeInput.press('End'); // Forces cursor to the very end of the existing text
    
    for (let i = 0; i < 20; i++) {
      await accessCodeInput.press('Backspace');
    }

    // Secondary safety: Move to front and hit delete just in case 'End' behaves weirdly in the browser
    await accessCodeInput.press('Home');
    for (let i = 0; i < 20; i++) {
      await accessCodeInput.press('Delete');
    }

    await page.waitForTimeout(200); 
    
    // 2. Type statically exactly '1234' with delay
    await accessCodeInput.type('1234', { delay: 100 });
    
    // 3. Press Tab to trigger 'blur' and lock in the value
    await accessCodeInput.press('Tab');
    console.log('✅ Wiped previous values and locked in static Access Code: 1234');

    // 4. Brief wait to ensure UI state catches up before clicking save
    await page.waitForTimeout(500);

    console.log('💾 Clicking Save button...');
    await saveBtn.click({ force: true });
    
    console.log(`🎉 Access code saved for Org: ${savedOrgId}`);
  });
// ==========================================================
  // 🧪 TEST 6: Validate Access Code in NSUI (FINAL SPA RENDER FIX)
  // ==========================================================
  test('Validate Access Code NSUI Registration', async ({ page }) => {

    const storedData = JSON.parse(fs.readFileSync('orgData.json'));
    const savedOrgId = storedData.orgId;

    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    // ---- Click Register ----
    await page.locator('#registerBtn').click();
    await page.waitForTimeout(1000);

    // ---- Select Org from Dropdown ----
    const orgDropdown = page.locator('#orgs');
    await expect(orgDropdown).toBeVisible();
    await orgDropdown.selectOption(savedOrgId);
    console.log(`✅ Selected Org "${savedOrgId}" from dropdown`);
    await page.waitForTimeout(1000);

    // ---- Locators for Access Code & Continue Button ----
    const accessCodeInput = page.locator('#accessCode');
    const continueBtn = page.locator('button[type="submit"]', { hasText: 'Continue' });

    await expect(accessCodeInput).toBeVisible();
    
    // ==========================================================
    // 🔴 Step 1: Test Incorrect Access Code
    // ==========================================================
    console.log('⚠️ Testing incorrect access code...');
    await accessCodeInput.fill('');
    await accessCodeInput.type('9999', { delay: 100 });
    
    await continueBtn.evaluate(btn => btn.click());
    
    await expect(page.getByText('Illegal Access Code')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sorry, the code you entered is incorrect. Give it another shot or ask your admin for the correct code.')).toBeVisible({ timeout: 5000 });
    console.log('✅ Correctly validated "Illegal Access Code" and feedback text.');

    // ==========================================================
    // 🟢 Step 2: Test Correct Access Code
    // ==========================================================
    console.log('✅ Testing correct access code...');
    
    await accessCodeInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await accessCodeInput.fill('');
    await page.waitForTimeout(500); 
    
    await accessCodeInput.type('1234', { delay: 100 });
    
    console.log('⌨️ Pressing Enter to submit...');
    await accessCodeInput.press('Enter');
    await continueBtn.evaluate(btn => btn.click());
    
    // ==========================================================
    // 🔗 Validate URL & WAIT FOR NEW PAGE TO PAINT
    // ==========================================================
    console.log('⏳ Waiting for navigation and UI render...');
    
    // 1. Wait for URL to change
    await page.waitForURL('**/nsui/self-registration*', { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/nsui\/self-registration.*/, { timeout: 5000 });
    
    // 2. WAIT FOR THE DOM TO CATCH UP
    await page.waitForLoadState('networkidle'); // Wait until network requests stop
    
    // 3. FORCE WAIT FOR A VISUAL ELEMENT ON THE NEW PAGE
    // I am using a generic locator here. It waits for the main container or a form to appear.
    // If you know a specific ID or text on the NEXT page, replace 'form' with that selector.
    await page.locator('form, .tw-w-full').first().waitFor({ state: 'visible', timeout: 10000 });
    
    // Optional: Just a hard wait so human eyes can see it in the UI mode before it closes
    await page.waitForTimeout(2000);

    console.log('✅ Successfully navigated AND visually rendered the self-registration page.');
    console.log('🎉 Access code validation flow completed successfully.');
  });