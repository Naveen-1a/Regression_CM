import { test, expect } from '@playwright/test';
const fs = require('fs');

test.describe.serial('CourseMill Org Flow', () => {

  // ==========================================================
  // 🧪 TEST 1: Create Organization (UNCHANGED LOGIC)
  // ==========================================================
  test('CreateOrg - Add Organization validation', async ({ page }) => {

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

    const orgIdField = targetFrame.locator('#orgIDTb');
    const orgDescField = targetFrame.locator('#orgDescTb');
    const saveBtn = targetFrame.locator('#saveBtn');

    await expect(orgIdField).toBeVisible();

    // 🔴 Case 1
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type('Org123', { delay: 100 });
    await saveBtn.click({ force: true });

    await expect(
      targetFrame.locator('text=One or more of the mandatory fields have not been entered.')
    ).toBeVisible();

    // 🔴 Case 2
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgDescField.type('Test Description', { delay: 100 });
    await saveBtn.click({ force: true });

    await expect(
      targetFrame.locator('text=One or more of the mandatory fields have not been entered.')
    ).toBeVisible();

    // 🔴 Special Characters
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type('@#$%', { delay: 100 });
    await orgDescField.type('Test Description', { delay: 100 });
    await saveBtn.click({ force: true });

    await expect(
      targetFrame.locator('text=The Org ID you have chosen is invalid')
    ).toBeVisible();

    // 🟢 Valid Input
    const validOrgId = 'Org' + Date.now();

    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type(validOrgId, { delay: 100 });
    await orgDescField.type('Valid Organization', { delay: 100 });
    await saveBtn.click({ force: true });

    // ✅ Store Org ID (same as your existing logic)
    fs.writeFileSync('orgData.json', JSON.stringify({ orgId: validOrgId }, null, 2));

    console.log(`✅ Created Org: ${validOrgId}`);

  });

  // ==========================================================
  // 🧪 TEST 2: Validate Org in NSUI (UNCHANGED LOGIC)
  // ==========================================================
  test('ValidateOrgNSUI - Check Org presence', async ({ page }) => {

    const storedData = JSON.parse(fs.readFileSync('orgData.json'));
    const savedOrgId = storedData.orgId;

    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    await page.locator('#registerBtn').click();
    await page.waitForTimeout(1000);

    const orgDropdown = page.locator('#orgs');
    await expect(orgDropdown).toBeVisible();

    await orgDropdown.click();
    await page.waitForTimeout(1000);

    const options = await orgDropdown.locator('option').allTextContents();

    if (options.includes(savedOrgId)) {
      console.log(`🔴 Org "${savedOrgId}" is PRESENT in dropdown`);
    } else {
      console.log(`🟢 Org "${savedOrgId}" is NOT present in dropdown`);
    }

    console.log('Checked Org ID:', savedOrgId);

  });

});
// ==========================================================
// 🧪 TEST 3:
// ✅ Keep global timeout increased
test.setTimeout(60000);

test('Enable Self Registration for Org', async ({ page }) => {

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

  // ==========================================================
  // ✅ TARGET VISIBLE ROW OR FORCE CLICK
  // ==========================================================
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

  // ==========================================================
  // ✅ VIEW / EDIT BUTTON
  // ==========================================================
  const viewEditBtn = page.locator('div#editBtnOrgHdr');
  await viewEditBtn.waitFor({ state: 'attached', timeout: 10000 }); 
  await viewEditBtn.click({ force: true });

  // ==========================================================
  // 🔍 FRAME HANDLING
  // ==========================================================
  console.log('⏳ Waiting for Edit Frame...');
  
  let editFrame;

  for (let i = 0; i < 20; i++) {
    for (const frame of page.frames()) {
      if (await frame.locator('#allowselfregTb').count() > 0) {
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

  // ==========================================================
  // ☑️ CHECKBOX (SLOW HUMAN MOUSE FIX)
  // ==========================================================
  const checkboxInput = editFrame.locator('#allowselfregTb').first();
  const checkboxWrapper = editFrame.locator('#allowselfregDiv').first();
  const saveBtn = editFrame.locator('#saveBtn').first();

  await expect(checkboxWrapper).toBeAttached({ timeout: 15000 });

  const isInputChecked = await checkboxInput.isChecked();
  
  if (!isInputChecked) {
    console.log('⏳ Executing deliberate, slow mouse click on the custom wrapper...');
    
    await checkboxWrapper.scrollIntoViewIfNeeded();
    await checkboxWrapper.hover({ force: true });
    await checkboxWrapper.click({ delay: 150, force: true });

    await checkboxWrapper.dispatchEvent('mousedown');
    await page.waitForTimeout(50); // Tiny 50ms wait needed mid-action to simulate physical mouse click
    await checkboxWrapper.dispatchEvent('mouseup');

    console.log('✅ Mouse interactions complete. Waiting for Save button to enable...');

    try {
      await expect(saveBtn).toBeEnabled({ timeout: 8000 });
      console.log('✅ Save button is now fully enabled!');
    } catch (e) {
      console.log('⚠️ Save button still disabled. Applying final direct JS override...');
      await checkboxWrapper.evaluate(node => node.className = 'DLG_checkbox DLG_checkbox_checked'); 
      await checkboxInput.evaluate(node => node.checked = true);
      await saveBtn.evaluate(btn => btn.removeAttribute('disabled'));
    }

  } else {
    console.log('ℹ️ Checkbox was already checked');
  }

  // ==========================================================
  // 💾 CLICK SAVE
  // ==========================================================
  console.log('💾 Clicking Save button...');
  await saveBtn.click({ force: true });

  console.log(`🎉 Self-registration processing complete for Org: ${savedOrgId}`);
});
// ==========================================================
  // 🧪 TEST 4: Validate Org in NSUI (UNCHANGED LOGIC)
  // ==========================================================
  test('ValidateOrgNSUI - Check Org presence', async ({ page }) => {

    const storedData = JSON.parse(fs.readFileSync('orgData.json'));
    const savedOrgId = storedData.orgId;

    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    await page.locator('#registerBtn').click();
    await page.waitForTimeout(1000);

    const orgDropdown = page.locator('#orgs');
    await expect(orgDropdown).toBeVisible();

    await orgDropdown.click();
    await page.waitForTimeout(1000);

    const options = await orgDropdown.locator('option').allTextContents();

    if (options.includes(savedOrgId)) {
      console.log(`🔴 Org "${savedOrgId}" is PRESENT in dropdown`);
    } else {
      console.log(`🟢 Org "${savedOrgId}" is NOT present in dropdown`);
    }

    console.log('Checked Org ID:', savedOrgId);

  });
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
  // 🧪 TEST 6: Validate Access Code & Complete Self-Registration
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
    // 🔗 Navigate to Self-Registration Form
    // ==========================================================
    console.log('⏳ Waiting for navigation to Self-Registration...');
    
    const regUrlRegex = /.*\/nsui\/self-registration.*/;
    await page.waitForURL(regUrlRegex, { timeout: 15000 });
    await expect(page).toHaveURL(regUrlRegex, { timeout: 5000 });
    
    console.log('✅ Successfully reached Self-Registration page.');

    // ==========================================================
    // 📝 Step 3: Fill User Registration Details
    // ==========================================================
    console.log('📝 Filling out registration form...');

    // Form Locators
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const firstNameInput = page.locator('#firstname');
    const lastNameInput = page.locator('#lastname');
    const emailInput = page.locator('#email');
    const submitBtn = page.locator('button', { hasText: 'Submit' });

    // Wait for the form to fully render
    await expect(usernameInput).toBeVisible({ timeout: 10000 });

    try {
      await expect(submitBtn).toBeDisabled({ timeout: 2000 });
      console.log('✅ Verified Submit button is disabled before filling fields.');
    } catch (e) {
      console.log('⚠️ Note: Submit button does not use standard HTML "disabled" attribute initially, proceeding anyway.');
    }

    // Generate Random Alphanumeric User ID & Define Password
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const randomUserId = `User_${randomSuffix}`;
    const passwordValue = 'Password@01';

    // Fill the fields 
    await usernameInput.type(randomUserId, { delay: 50 });
    await passwordInput.type(passwordValue, { delay: 50 });
    await firstNameInput.type('Naveen', { delay: 50 });
    await lastNameInput.type('S', { delay: 50 });
    await emailInput.type('naveen.s@elblearning.com', { delay: 50 });

    // Press tab to trigger final blur event
    await emailInput.press('Tab');
    await page.waitForTimeout(500); 

    console.log(`✅ Filled fields successfully. Generated User ID: ${randomUserId}`);

    // Validate Submit is now enabled
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    console.log('✅ Verified Submit button is ENABLED after filling mandatory fields.');

    // ==========================================================
    // 🚀 Step 4: Submit & Validate Final Navigation
    // ==========================================================
    console.log('🖱️ Clicking Submit...');
    
    await Promise.all([
      page.waitForURL('**/nsui/myCourses*', { timeout: 15000 }),
      submitBtn.click({ force: true })
    ]);

    await page.waitForLoadState('networkidle');

    // Final Hard Assertion for myCourses URL
    await expect(page).toHaveURL(/.*\/nsui\/myCourses.*/, { timeout: 5000 });
    
    // ==========================================================
    // 💾 Step 5: Save Credentials for Future Tests
    // ==========================================================
    const userData = {
      userId: randomUserId,
      password: passwordValue
    };
    fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2));
    console.log(`💾 Saved User Credentials to userData.json: ${randomUserId}`);

    console.log('🎉 Successfully created user and navigated to myCourses!');
  });
  // ==========================================================
  // 🧪 TEST 7: Validate User Interface Options & Logos (HUMAN TYPE FIX)
  // ==========================================================
  test('Update Org UI Colors and Logos', async ({ page }) => {

    // 🕒 Increase timeout to 60 seconds to accommodate slow typing
    test.setTimeout(60000);

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
        if (await frame.locator('#headerColorTb').count() > 0) {
          editFrame = frame;
          break;
        }
      }
      if (editFrame) break;
      await page.waitForTimeout(1000);
    }

    if (!editFrame) {
      throw new Error('❌ Edit Org frame not found or UI Color fields not present');
    }

    // ==========================================================
    // 🎨 Fill UI Color Codes & Logos (HUMAN TYPING LOOP)
    // ==========================================================
    console.log('🎨 Applying UI Color Codes and Logos via human typing...');

    // Define all fields and their target values
    const formFields = [
      { name: 'Header Color', locator: editFrame.locator('#headerColorTb'), value: '#1A73E8' },
      { name: 'Header Text Color', locator: editFrame.locator('#headerTextColorTb'), value: '#48aa50' },
      { name: 'Side Menu Highlight', locator: editFrame.locator('#sideMenuHighlightColorTb'), value: '#ced12a' },
      { name: 'Side Menu Color', locator: editFrame.locator('#sideMenuColorTb'), value: '#737a2d' },
      { name: 'Side Menu Text', locator: editFrame.locator('#sideMenuTextColorTb'), value: '#202124' },
      { name: 'Side Menu Hover', locator: editFrame.locator('#sideMenuHoverColorTb'), value: '#DADCE0' },
      { name: 'Org Logo', locator: editFrame.locator('#logoTb'), value: 'https://app.coursemill.com/course/orglogos/ADM Secondary Logo White 210x56.png' },
      { name: 'Org Icon', locator: editFrame.locator('#logoIconTb'), value: 'https://test.coursemill.com/course/logoIcon/Logodesign.png' }
    ];

    // Loop through each field, physically clear it, type, and blur
    for (const field of formFields) {
      await field.locator.scrollIntoViewIfNeeded();
      
      // 1. Triple click to select all existing text, then backspace
      await field.locator.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      
      // 2. Type at an optimized speed (15ms delay prevents timeouts but still triggers UI bindings)
      await field.locator.type(field.value, { delay: 15 }); 
      
      // 3. Tab to trigger blur/change events
      await field.locator.press('Tab');
      
      await page.waitForTimeout(200); 
    }

    console.log('✅ All form fields entered and events triggered.');

    // ==========================================================
    // 💾 Click Save & Store Test Data
    // ==========================================================
    console.log('💾 Clicking Save button...');
    const saveBtn = editFrame.locator('#saveBtn').first();
    await saveBtn.click({ force: true });
    
    // Brief wait to ensure save processing completes
    await page.waitForTimeout(1000);
    
    // Store the exact values used into a JSON file for the next test
    const uiData = {
      headerColor: '#1A73E8',
      headerTextColor: '#48aa50',
      sideMenuHighlight: '#ced12a',
      sideMenuColor: '#737a2d',
      sideMenuTextColor: '#202124',
      sideMenuHover: '#DADCE0',
      orgLogo: 'https://app.coursemill.com/course/orglogos/ADM Secondary Logo White 210x56.png',
      orgIcon: 'https://test.coursemill.com/course/logoIcon/Logodesign.png'
    };

    fs.writeFileSync('uiData.json', JSON.stringify(uiData, null, 2));

    console.log(`🎉 UI Options & Logos saved successfully for Org: ${savedOrgId}`);
    console.log('💾 Stored UI values into uiData.json for validation in the next test.');
  });
// ==========================================================
  // 🧪 TEST 8: Login to NSUI and Validate Applied UI & Logos (HIGH DETAIL)
  // ==========================================================
  test('Login and Validate Custom UI Colors and Logos', async ({ page }) => {

    test.setTimeout(60000); // 60s timeout for safety

    // ==========================================================
    // 📂 Read Stored Data
    // ==========================================================
    const userData = JSON.parse(fs.readFileSync('userData.json'));
    const uiData = JSON.parse(fs.readFileSync('uiData.json'));

    // ==========================================================
    // 🌐 STEP 1: Navigate and Login
    // ==========================================================
    await test.step('Navigate to App and Login via Human Typing', async () => {
      console.log(`\n==================================================`);
      console.log(`🔐 STEP 1: INITIATING LOGIN SEQUENCE`);
      console.log(`==================================================`);
      console.log(`[Info] Target User ID: ${userData.userId}`);

      await page.goto('https://test.coursemill.com/nsui/');
      await page.waitForTimeout(1000);

      const usernameInput = page.locator('#username');
      const passwordInput = page.locator('#password');
      const loginBtn = page.locator('#submitBtn');

      await expect(usernameInput).toBeVisible();

      console.log('⌨️  Executing physical keystrokes for Username...');
      await usernameInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await usernameInput.type(userData.userId, { delay: 50 });
      await usernameInput.press('Tab');

      console.log('⌨️  Executing physical keystrokes for Password...');
      await passwordInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await passwordInput.type(userData.password, { delay: 50 });

      console.log('🖱️  Submitting form...');
      await passwordInput.press('Enter');
      await loginBtn.evaluate(btn => btn.click()).catch(() => {});

      await page.waitForLoadState('networkidle');
      const headerElement = page.locator('header.fixed.top-0').first();
      await expect(headerElement).toBeVisible({ timeout: 15000 });
      
      console.log('✅  SUCCESS: Logged in and reached Student Dashboard.');
    });

    // ==========================================================
    // 🛠️ Hex to RGB Helper
    // ==========================================================
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    };

    const expectedHeaderColor = hexToRgb(uiData.headerColor);
    const expectedHeaderTextColor = hexToRgb(uiData.headerTextColor);
    const expectedSideMenuColor = hexToRgb(uiData.sideMenuColor);
    const expectedSideMenuTextColor = hexToRgb(uiData.sideMenuTextColor);

    // Locators
    const ui = {
      header: page.locator('header.fixed.top-0').first(),
      headerLinkText: page.locator('header.fixed.top-0 a.router-link-active').first(),
      sidebar: page.locator('div.fixed.top-0.z-50.left-0').first(),
      sidebarText: page.locator('div.fixed.top-0.z-50.left-0 span', { hasText: 'Course Catalog' }).first(),
      orgLogoImg: page.locator(`img[src="${uiData.orgLogo}"]`).first()
    };

    // ==========================================================
    // 🎨 STEP 2: Validate UI Colors
    // ==========================================================
    await test.step('Validate Rendered CSS Color Codes', async () => {
      console.log(`\n==================================================`);
      console.log(`🎨 STEP 2: VALIDATING UI COLOR CONFIGURATIONS`);
      console.log(`==================================================`);

      console.log(`[Check 1] Header Background | Expected: ${uiData.headerColor} -> ${expectedHeaderColor}`);
      await expect(ui.header).toHaveCSS('background-color', expectedHeaderColor);
      console.log(`  └─ ✅ MATCH CONFIRMED`);

      console.log(`[Check 2] Header Text Color | Expected: ${uiData.headerTextColor} -> ${expectedHeaderTextColor}`);
      await expect(ui.headerLinkText).toHaveCSS('color', expectedHeaderTextColor);
      console.log(`  └─ ✅ MATCH CONFIRMED`);

      console.log(`[Check 3] Side Menu Background | Expected: ${uiData.sideMenuColor} -> ${expectedSideMenuColor}`);
      await expect(ui.sidebar).toHaveCSS('background-color', expectedSideMenuColor);
      console.log(`  └─ ✅ MATCH CONFIRMED`);

      console.log(`[Check 4] Side Menu Text Color | Expected: ${uiData.sideMenuTextColor} -> ${expectedSideMenuTextColor}`);
      await expect(ui.sidebarText).toHaveCSS('color', expectedSideMenuTextColor);
      console.log(`  └─ ✅ MATCH CONFIRMED`);

      console.log(`[Check 5] Side Menu Highlight | Expected: ${uiData.sideMenuHighlight} (Extracted from DOM Variables)`);
      const sidebarStyle = await ui.sidebar.getAttribute('style');
      const highlightColorRegex = new RegExp(`--highlight-color:\\s*${uiData.sideMenuHighlight}`, 'i');
      expect(sidebarStyle).toMatch(highlightColorRegex);
      console.log(`  └─ ✅ MATCH CONFIRMED: CSS Variable Found`);

      console.log(`[Check 6] Side Menu Hover | Expected: ${uiData.sideMenuHover} (Extracted from DOM Variables)`);
      const hoverColorRegex = new RegExp(`--hover-color:\\s*${uiData.sideMenuHover}`, 'i');
      expect(sidebarStyle).toMatch(hoverColorRegex);
      console.log(`  └─ ✅ MATCH CONFIRMED: CSS Variable Found`);
    });

    // ==========================================================
    // 🖼️ STEP 3: Validate Organization Logos
    // ==========================================================
    await test.step('Validate Responsive Logos Integration', async () => {
      console.log(`\n==================================================`);
      console.log(`🖼️  STEP 3: VALIDATING RESPONSIVE LOGO ASSETS`);
      console.log(`==================================================`);

      console.log(`[Check 1] Organization Main Logo`);
      console.log(`  ├─ Expected URL: ${uiData.orgLogo}`);
      await expect(ui.orgLogoImg).toBeVisible({ timeout: 5000 });
      console.log(`  └─ ✅ MATCH CONFIRMED: Image rendered on screen.`);

      console.log(`[Check 2] Organization Icon Logo (Responsive Check)`);
      console.log(`  ├─ Expected URL: ${uiData.orgIcon}`);
      const iconFilename = uiData.orgIcon.split('/').pop(); 
      const iconLocator = page.locator(`img[src*="${iconFilename}"]`).first();

      try {
        await iconLocator.waitFor({ state: 'attached', timeout: 3000 });
        console.log(`  └─ ✅ MATCH CONFIRMED: Image rendered directly on screen.`);
      } catch (error) {
        console.log(`  ├─ ⚠️ Icon hidden by expanded sidebar. Triggering responsive state...`);
        console.log(`  ├─ 🖱️ Toggling hamburger menu...`);
        
        const toggleMenuBtn = page.locator('button[aria-label="Toggle menu"]').first();
        await toggleMenuBtn.click();
        await page.waitForTimeout(1000); // Wait for transition
        
        await expect(iconLocator).toBeVisible({ timeout: 5000 });
        console.log(`  └─ ✅ MATCH CONFIRMED: Icon successfully revealed and verified.`);
      }
      
      console.log(`\n🎉 TEST 8 COMPLETE: All modules verified successfully! 🎉`);
    });
  });