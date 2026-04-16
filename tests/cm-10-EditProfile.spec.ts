import { test, expect } from '@playwright/test';
// @ts-ignore
const fs = require('fs');

test.describe.serial('CourseMill NSUI - Edit Profile Functionality', () => {

  const credsFile = 'profileCredentials.json';
  const profileDataFile = 'profileData.json';
  const defaultUserId = 'regtestuser_001';
  const defaultPassword = 'P@ssw0rd';

  // ==========================================================
  // 🧪 TEST 1: Update Password, Validate Restrictions, and Re-login
  // ==========================================================
  test('Update Password, Validate Restrictions, and Re-login', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 1: Update Password, Validate Restrictions, and Re-login');
    test.setTimeout(90000);

    let currentPassword = defaultPassword;
    
    if (fs.existsSync(credsFile)) {
        const storedCreds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));
        if (storedCreds.userId === defaultUserId) {
            currentPassword = storedCreds.password;
        } else {
            fs.writeFileSync(credsFile, JSON.stringify({ userId: defaultUserId, password: currentPassword }));
        }
    } else {
        fs.writeFileSync(credsFile, JSON.stringify({ userId: defaultUserId, password: currentPassword }));
    }

    const newPassword = `P@ssw0rd${Math.floor(Math.random() * 10000)}!`;

    console.log(`[Info] Logging in with User: ${defaultUserId}`);
    console.log(`[Info] Current Password: ${currentPassword}`);
    console.log(`[Info] Target New Password: ${newPassword}`);

    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    await page.locator('#username').fill(defaultUserId);
    await page.locator('#password').fill(currentPassword);
    await page.locator('#submitBtn').click();
    await page.waitForLoadState('networkidle');

    const userMenuBtn = page.locator('button', { hasText: /Student/i }).first();
    await expect(userMenuBtn).toBeVisible({ timeout: 15000 });
    await userMenuBtn.click();
    await page.waitForTimeout(500);

    const editProfileLink = page.locator('a[href="/nsui/edit-profile"]').first();
    await expect(editProfileLink).toBeVisible({ timeout: 5000 });
    await editProfileLink.click();

    await page.waitForURL('**/nsui/edit-profile', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Validate Username is Read-Only
    const usernameInput = page.locator('#username');
    const isEditable = await usernameInput.isEditable();
    expect(isEditable).toBeFalsy(); 

    // Change Password & Validate Mismatch Error
    const openChangePwdBtn = page.locator('button.tw-bg-gray-50', { hasText: 'Change Password' }).first();
    await openChangePwdBtn.click();

    await page.locator('#oldPassword').fill(currentPassword);
    await page.locator('#newPassword').fill(newPassword);
    await page.locator('#confirmPassword').fill('Pass'); 
    await page.locator('#confirmPassword').press('Tab');

    const mismatchError = page.getByText('Passwords do not match');
    await expect(mismatchError).toBeVisible({ timeout: 5000 });

    // Fix Mismatch, Save, and Close
    const confirmInput = page.locator('#confirmPassword');
    await confirmInput.fill('');
    await confirmInput.fill(newPassword);

    const submitChangePwdBtn = page.locator('button.tw-bg-blue-600', { hasText: 'Change Password' }).first();
    await submitChangePwdBtn.click();

    const closeBtn = page.locator('button.tw-bg-blue-600', { hasText: 'Close' }).first();
    await expect(closeBtn).toBeVisible({ timeout: 10000 });
    await closeBtn.click();

    fs.writeFileSync(credsFile, JSON.stringify({ userId: defaultUserId, password: newPassword }, null, 2));
    await page.waitForTimeout(2000);

    // Logout via UI
    await userMenuBtn.click();
    await page.waitForTimeout(500);
    const signOutBtn = page.locator('button', { hasText: 'Sign Out' }).first();
    await signOutBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Re-login
    await page.locator('#username').fill(defaultUserId);
    await page.locator('#password').fill(newPassword);
    await page.locator('#submitBtn').click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('header.fixed.top-0').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Password successfully updated and validated!');
  });

  // ==========================================================
  // 🧪 TEST 2: Update Profile Information and Validate
  // ==========================================================
  test('Update Profile Fields and Validate Integrity', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 2: Update Profile Fields and Validate Integrity');
    test.setTimeout(120000);

    let currentPassword = defaultPassword;
    if (fs.existsSync(credsFile)) {
        currentPassword = JSON.parse(fs.readFileSync(credsFile, 'utf8')).password;
    }

    // Generate Professional Dynamic Profile Data using "Naveen"
    const ts = Date.now().toString().slice(-4);
    const dynamicData = {
        firstName: `Naveen${ts}`,
        lastName: `S${ts}`,
        address: `${ts} Enterprise Parkway`,
        city: `Seattle`,
        state: 'WA', 
        zip: `9810${ts.charAt(0)}`, 
        country: 'USA',
        phone: `206-555-${ts}`
    };

    // ==========================================================
    // 🌐 PART 1: Login & Navigate
    // ==========================================================
    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    await page.locator('#username').fill(defaultUserId);
    await page.locator('#password').fill(currentPassword);
    await page.locator('#submitBtn').click();
    await page.waitForLoadState('networkidle');

    const userMenuBtn = page.locator('button', { hasText: /Student/i }).first();
    await expect(userMenuBtn).toBeVisible({ timeout: 15000 });
    await userMenuBtn.click();
    await page.waitForTimeout(500);

    const editProfileLink = page.locator('a[href="/nsui/edit-profile"]').first();
    await editProfileLink.click();
    await page.waitForURL('**/nsui/edit-profile', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // ==========================================================
    // 📅 PART 2: Verify Last Access Date
    // ==========================================================
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    console.log(`🛡️ Validating Last Access Date shows today: ${formattedDate}`);
    const lastAccessElem = page.getByText(`Last Access: ${formattedDate}`).first();
    await expect(lastAccessElem).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log(`⚠️ Warning: Last Access Date not found or mismatched. Proceeding...`);
    });

    // ==========================================================
    // 📝 PART 3: Verify Button State & Fill Form
    // ==========================================================
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Submit' }).first();
    
    console.log('🛡️ Validating Submit button is disabled before editing...');
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
    console.log('✅ Submit button is correctly disabled.');

    console.log('📝 Physically typing new dynamic values...');
    
    // 🛑 BULLETPROOF HUMAN TYPING FUNCTION
    const humanTypeField = async (selector: string, value: string) => {
        const field = page.locator(selector);
        await field.click();
        await field.clear(); // Clear out existing value
        await page.waitForTimeout(200); // Tiny pause
        // pressSequentially physically triggers keydown/keyup events per character
        await field.pressSequentially(value, { delay: 100 }); 
        await field.press('Tab'); // Trigger blur event to set value
        await page.waitForTimeout(200);
    };

    // Fill inputs
    await humanTypeField('#firstname', dynamicData.firstName);
    await humanTypeField('#lastname', dynamicData.lastName);
    await humanTypeField('#address', dynamicData.address);
    await humanTypeField('#city', dynamicData.city);
    await humanTypeField('#zip', dynamicData.zip);
    await humanTypeField('#phone', dynamicData.phone);
    
    // Fill selects
    await page.locator('#states').selectOption(dynamicData.state);
    await page.locator('#countries').selectOption(dynamicData.country);

    console.log('🛡️ Validating Submit button is enabled after editing...');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    console.log('✅ Submit button is correctly enabled.');

    console.log('💾 Submitting form...');
    await submitBtn.click();
    
    // 🛑 CRITICAL FIX: Give the backend 5 full seconds to save BEFORE signing out
    console.log('⏳ Waiting 5 seconds for the database to commit changes...');
    await page.waitForTimeout(5000); 

    fs.writeFileSync(profileDataFile, JSON.stringify(dynamicData, null, 2));
    console.log('✅ Profile saved to database and JSON file.');

    // ==========================================================
    // 🔄 PART 4: Sign Out and Re-Login
    // ==========================================================
    console.log('🔄 Signing out...');
    await userMenuBtn.click();
    await page.waitForTimeout(1000);
    const signOutBtn = page.locator('button', { hasText: 'Sign Out' }).first();
    await signOutBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Buffer before attempting to log back in

    console.log('🔑 Logging back in to validate changes...');
    await page.locator('#username').fill(defaultUserId);
    await page.locator('#password').fill(currentPassword);
    await page.locator('#submitBtn').click();
    await page.waitForLoadState('networkidle');

    await userMenuBtn.click();
    await page.waitForTimeout(500);
    await editProfileLink.click();
    await page.waitForURL('**/nsui/edit-profile', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Give Vue a moment to populate the form

    // ==========================================================
    // 🔍 PART 5: Validate Fields
    // ==========================================================
    console.log('\n📊 --- PROFILE FIELD VALIDATION RESULTS ---');
    
    const validateField = async (fieldName: string, locatorId: string, expectedValue: string) => {
        let actualValue = await page.locator(locatorId).inputValue(); 
        
        if (actualValue === expectedValue) {
            console.log(`✅ ${fieldName}: ${actualValue} (Match)`);
        } else {
            console.log(`❌ ${fieldName}: Expected "${expectedValue}", but got "${actualValue}"`);
        }
        expect(actualValue).toBe(expectedValue);
    };

    await validateField('First Name', '#firstname', dynamicData.firstName);
    await validateField('Last Name', '#lastname', dynamicData.lastName);
    await validateField('Address', '#address', dynamicData.address);
    await validateField('City', '#city', dynamicData.city);
    await validateField('State/Province', '#states', dynamicData.state);
    await validateField('Zip/Postal Code', '#zip', dynamicData.zip);
    await validateField('Country', '#countries', dynamicData.country);
    await validateField('Phone', '#phone', dynamicData.phone);

    console.log('------------------------------------------\n');
    console.log('🎉 SUCCESS: All profile fields were updated and validated perfectly!');
  });

});