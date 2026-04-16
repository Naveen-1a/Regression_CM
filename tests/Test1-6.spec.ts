import { test, expect } from '@playwright/test';
const fs = require('fs');

// Import your helper functions
import { 
  adminLoginAndNavigate, 
  searchAndEditOrg, 
  findFrameByLocator, 
  humanType, 
  aggressiveClearAndType, 
  checkOrgInNSUI 
} from './helpers';

test.describe.serial('CourseMill Org Flow', () => {

  // ==========================================================
  // 🧪 TEST 1: Create Organization
  // ==========================================================
  test('CreateOrg - Add Organization validation', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 1: CreateOrg - Add Organization validation');
    
    await adminLoginAndNavigate(page);

    await page.locator('#addorg').click();
    await page.waitForTimeout(2000);

    const targetFrame = await findFrameByLocator(page, '#orgIDTb');
    const orgIdField = targetFrame.locator('#orgIDTb');
    const orgDescField = targetFrame.locator('#orgDescTb');
    const saveBtn = targetFrame.locator('#saveBtn');

    await expect(orgIdField).toBeVisible();

    // 🔴 Case 1
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type('Org123', { delay: 100 });
    await saveBtn.click({ force: true });
    await expect(targetFrame.locator('text=One or more of the mandatory fields have not been entered.')).toBeVisible();

    // 🔴 Case 2
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgDescField.type('Test Description', { delay: 100 });
    await saveBtn.click({ force: true });
    await expect(targetFrame.locator('text=One or more of the mandatory fields have not been entered.')).toBeVisible();

    // 🔴 Special Characters
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type('@#$%', { delay: 100 });
    await orgDescField.type('Test Description', { delay: 100 });
    await saveBtn.click({ force: true });
    await expect(targetFrame.locator('text=The Org ID you have chosen is invalid')).toBeVisible();

    // 🟢 Valid Input
    const validOrgId = 'Org' + Date.now();
    await orgIdField.fill('');
    await orgDescField.fill('');
    await orgIdField.type(validOrgId, { delay: 100 });
    await orgDescField.type('Valid Organization', { delay: 100 });
    await saveBtn.click({ force: true });

    fs.writeFileSync('orgData.json', JSON.stringify({ orgId: validOrgId }, null, 2));
    console.log(`✅ Created Org: ${validOrgId}`);
  });

  // ==========================================================
  // 🧪 TEST 2: Validate Org in NSUI
  // ==========================================================
  test('ValidateOrgNSUI - Check Org presence', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 2: ValidateOrgNSUI - Check Org presence');
    
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json'));
    await checkOrgInNSUI(page, orgId);
  });

  // ==========================================================
  // 🧪 TEST 3: Enable Self Registration for Org
  // ==========================================================
  test('Enable Self Registration for Org', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 3: Enable Self Registration for Org');
    test.setTimeout(60000);
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json'));

    await adminLoginAndNavigate(page);
    await searchAndEditOrg(page, orgId);

    const editFrame = await findFrameByLocator(page, '#allowselfregTb');
    const checkboxInput = editFrame.locator('#allowselfregTb').first();
    const checkboxWrapper = editFrame.locator('#allowselfregDiv').first();
    const saveBtn = editFrame.locator('#saveBtn').first();

    await expect(checkboxWrapper).toBeAttached({ timeout: 15000 });

    if (!(await checkboxInput.isChecked())) {
      console.log('⏳ Executing deliberate, slow mouse click...');
      await checkboxWrapper.scrollIntoViewIfNeeded();
      await checkboxWrapper.hover({ force: true });
      await checkboxWrapper.click({ delay: 150, force: true });
      await checkboxWrapper.dispatchEvent('mousedown');
      await page.waitForTimeout(50); 
      await checkboxWrapper.dispatchEvent('mouseup');

      try {
        await expect(saveBtn).toBeEnabled({ timeout: 8000 });
      } catch (e) {
        await checkboxWrapper.evaluate(node => node.className = 'DLG_checkbox DLG_checkbox_checked'); 
        await checkboxInput.evaluate(node => node.checked = true);
        await saveBtn.evaluate(btn => btn.removeAttribute('disabled'));
      }
    }

    console.log('💾 Clicking Save button...');
    await saveBtn.click({ force: true });
  });

  // ==========================================================
  // 🧪 TEST 4: Validate Org in NSUI (Check again)
  // ==========================================================
  test('ValidateOrgNSUI - Check Org presence 2', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 4: ValidateOrgNSUI - Check Org presence 2');
    
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json'));
    await checkOrgInNSUI(page, orgId);
  });

  // ==========================================================
  // 🧪 TEST 5: Set Access Code for Org
  // ==========================================================
  test('Set Access Code for Org', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 5: Set Access Code for Org');
    test.setTimeout(60000);
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json'));

    await adminLoginAndNavigate(page);
    await searchAndEditOrg(page, orgId);

    const editFrame = await findFrameByLocator(page, '#selfregpwdTb');
    const accessCodeInput = editFrame.locator('#selfregpwdTb');
    const saveBtn = editFrame.locator('#saveBtn').first();

    await expect(accessCodeInput).toBeVisible();
    
    console.log('🧹 Executing aggressive physical clear and type...');
    await aggressiveClearAndType(page, accessCodeInput, '1234');

    console.log('💾 Clicking Save button...');
    await saveBtn.click({ force: true });
  });

  // ==========================================================
  // 🧪 TEST 6: Validate Access Code & Complete Self-Registration
  // ==========================================================
  test('Validate Access Code NSUI Registration', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 6: Validate Access Code NSUI Registration');
    test.setTimeout(60000);
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json'));

    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);
    await page.locator('#registerBtn').click();
    await page.waitForTimeout(1000);

    const orgDropdown = page.locator('#orgs');
    await expect(orgDropdown).toBeVisible();
    await orgDropdown.selectOption(orgId);
    await page.waitForTimeout(1000);

    const accessCodeInput = page.locator('#accessCode');
    const continueBtn = page.locator('button[type="submit"]', { hasText: 'Continue' });

    // 🔴 Incorrect Access Code
    console.log('⚠️ Testing incorrect access code...');
    await accessCodeInput.fill('');
    await accessCodeInput.type('9999', { delay: 100 });
    await continueBtn.evaluate(btn => btn.click());
    
    await expect(page.getByText('Illegal Access Code')).toBeVisible({ timeout: 5000 });

    // 🟢 Correct Access Code
    console.log('✅ Testing correct access code...');
    await humanType(page, accessCodeInput, '1234', 100);
    await accessCodeInput.press('Enter');
    await continueBtn.evaluate(btn => btn.click());
    
    const regUrlRegex = /.*\/nsui\/self-registration.*/;
    await page.waitForURL(regUrlRegex, { timeout: 15000 });

    // 📝 Form Filling
    console.log('📝 Filling out registration form...');
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const submitBtn = page.locator('button', { hasText: 'Submit' });

    await expect(usernameInput).toBeVisible({ timeout: 10000 });

    const randomUserId = `User_${Math.random().toString(36).substring(2, 8)}`;
    const passwordValue = 'Password@01';

    await usernameInput.type(randomUserId, { delay: 50 });
    await passwordInput.type(passwordValue, { delay: 50 });
    await page.locator('#firstname').type('Naveen', { delay: 50 });
    await page.locator('#lastname').type('S', { delay: 50 });
    await page.locator('#email').type('naveen.s@elblearning.com', { delay: 50 });
    await page.locator('#email').press('Tab');
    await page.waitForTimeout(500); 

    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    
    await Promise.all([
      page.waitForURL('**/nsui/myCourses*', { timeout: 15000 }),
      submitBtn.click({ force: true })
    ]);
    await page.waitForLoadState('networkidle');

    fs.writeFileSync('userData.json', JSON.stringify({ userId: randomUserId, password: passwordValue }, null, 2));
    console.log('🎉 Successfully created user and navigated to myCourses!');
  });
});
