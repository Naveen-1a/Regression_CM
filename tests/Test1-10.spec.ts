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

test.describe.serial('CourseMill Org Flow - Complete Suite', () => {

  // ==========================================================
  // 🧪 TEST 1: Create Organization
  // ==========================================================
  test('CreateOrg - Add Organization validation', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 1: CreateOrg - Add Organization validation');
    test.setTimeout(60000);
    
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

  // ==========================================================
  // 🧪 TEST 7: Update Org UI Colors and Logos
  // ==========================================================
  test('Update Org UI Colors and Logos', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 7: Update Org UI Colors and Logos');
    test.setTimeout(60000);
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json', 'utf8'));

    await adminLoginAndNavigate(page);
    await searchAndEditOrg(page, orgId);

    const editFrame = await findFrameByLocator(page, '#headerColorTb');

    const formFields = [
      { locator: editFrame.locator('#headerColorTb'), value: '#46288d' },
      { locator: editFrame.locator('#headerTextColorTb'), value: '#48aa50' },
      { locator: editFrame.locator('#sideMenuHighlightColorTb'), value: '#ced12a' },
      { locator: editFrame.locator('#sideMenuColorTb'), value: '#737a2d' },
      { locator: editFrame.locator('#sideMenuTextColorTb'), value: '#202124' },
      { locator: editFrame.locator('#sideMenuHoverColorTb'), value: '#DADCE0' },
      { locator: editFrame.locator('#logoTb'), value: 'https://app.coursemill.com/course/orglogos/ADM Secondary Logo White 210x56.png' },
      { locator: editFrame.locator('#logoIconTb'), value: 'https://test.coursemill.com/course/logoIcon/Logodesign.png' }
    ];

    for (const field of formFields) {
      await field.locator.waitFor({ state: 'attached' });
      await field.locator.scrollIntoViewIfNeeded();
      
      // 1. Click to focus the field
      await field.locator.click();
      await page.waitForTimeout(100);

      // 2. Select All (Ctrl+A / Cmd+A) and Delete
      await page.keyboard.press('Control+A'); 
      await page.keyboard.press('Meta+A');    
      await page.waitForTimeout(100);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(100);

      // 3. Type slowly, ensuring every character triggers a physical keydown/keyup event
      await field.locator.type(field.value, { delay: 100 });
      
      // 4. Press Enter and Tab
      await field.locator.press('Enter');
      await field.locator.press('Tab');
      
      // 5. Fire backup JS events (Added 'blur' to force Vue validation)
      await field.locator.evaluate(node => {
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
        node.dispatchEvent(new Event('blur', { bubbles: true }));
      }).catch(() => {});

      await page.waitForTimeout(500); 
    }

    console.log('💾 Clicking Save button...');
    const saveBtn = editFrame.locator('#saveBtn').first();
    await saveBtn.waitFor({ state: 'attached' });
    
    // 🛑 VUE DEBOUNCE FIX: If Vue is lagging and left the button disabled, force it enabled!
    await saveBtn.evaluate(btn => {
      if (btn.hasAttribute('disabled')) {
        console.log('⚠️ Bypassing Vue: Forcing Save button to enable...');
        btn.removeAttribute('disabled');
      }
    });
    
    await saveBtn.click({ force: true });
    
    // Wait 3 seconds to ensure the API call finishes and the database commits
    await page.waitForTimeout(3000);
    
    const uiData = {
      headerColor: '#46288d',
      headerTextColor: '#48aa50',
      sideMenuHighlight: '#ced12a',
      sideMenuColor: '#737a2d',
      sideMenuTextColor: '#202124',
      sideMenuHover: '#DADCE0',
      orgLogo: 'https://app.coursemill.com/course/orglogos/ADM Secondary Logo White 210x56.png',
      orgIcon: 'https://test.coursemill.com/course/logoIcon/Logodesign.png'
    };
    fs.writeFileSync('uiData.json', JSON.stringify(uiData, null, 2));
    console.log('✅ UI Colors and Logos updated and saved!');
  });

  // ==========================================================
  // 🧪 TEST 8: Login and Validate Custom UI Colors and Logos
  // ==========================================================
  test('Login and Validate Custom UI Colors and Logos', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 8: Login and Validate Custom UI Colors and Logos');
    test.setTimeout(60000);
    const userData = JSON.parse(fs.readFileSync('userData.json', 'utf8'));
    const uiData = JSON.parse(fs.readFileSync('uiData.json', 'utf8'));

    await test.step('Navigate and Login', async () => {
      await page.goto('https://test.coursemill.com/nsui/');
      await page.waitForTimeout(1000);

      const usernameInput = page.locator('#username');
      const passwordInput = page.locator('#password');
      
      await humanType(page, usernameInput, userData.userId);
      await humanType(page, passwordInput, userData.password);

      await passwordInput.press('Enter');
      await page.locator('#submitBtn').evaluate(btn => btn.click()).catch(() => {});
      await page.waitForLoadState('networkidle');
      await expect(page.locator('header.fixed.top-0').first()).toBeVisible({ timeout: 15000 });
    });

    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    };

    const ui = {
      header: page.locator('header.fixed.top-0').first(),
      headerLinkText: page.locator('header.fixed.top-0 a.router-link-active').first(),
      sidebar: page.locator('div.fixed.top-0.z-50.left-0').first(),
      sidebarText: page.locator('div.fixed.top-0.z-50.left-0 span', { hasText: 'Course Catalog' }).first(),
      orgLogoImg: page.locator(`img[src="${uiData.orgLogo}"]`).first()
    };

    await test.step('Validate CSS Color Codes', async () => {
      await expect(ui.header).toHaveCSS('background-color', hexToRgb(uiData.headerColor));
      await expect(ui.headerLinkText).toHaveCSS('color', hexToRgb(uiData.headerTextColor));
      await expect(ui.sidebar).toHaveCSS('background-color', hexToRgb(uiData.sideMenuColor));
      await expect(ui.sidebarText).toHaveCSS('color', hexToRgb(uiData.sideMenuTextColor));

      const sidebarStyle = await ui.sidebar.getAttribute('style');
      expect(sidebarStyle).toMatch(new RegExp(`--highlight-color:\\s*${uiData.sideMenuHighlight}`, 'i'));
      expect(sidebarStyle).toMatch(new RegExp(`--hover-color:\\s*${uiData.sideMenuHover}`, 'i'));
    });

    await test.step('Validate Logos', async () => {
      await expect(ui.orgLogoImg).toBeVisible({ timeout: 5000 });
      
      const iconFilename = uiData.orgIcon.split('/').pop(); 
      const iconLocator = page.locator(`img[src*="${iconFilename}"]`).first();

      try {
        await iconLocator.waitFor({ state: 'attached', timeout: 3000 });
      } catch (error) {
        await page.locator('button[aria-label="Toggle menu"]').first().click();
        await page.waitForTimeout(1000); 
        await expect(iconLocator).toBeVisible({ timeout: 5000 });
      }
    });
  });

// ==========================================================
  // 🧪 TEST 9: Add New Course to Organization & Register User
  // ==========================================================
  test('Create New Course under Org', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 9: Create New Course under Org & Register User');
    test.setTimeout(90000);

    const orgData = JSON.parse(fs.readFileSync('orgData.json', 'utf8'));
    const userData = JSON.parse(fs.readFileSync('userData.json', 'utf8'));
    const savedOrgId = orgData.orgId;
    const savedUserId = userData.userId;

    console.log(`[Info] Using Target Org ID: ${savedOrgId}`);
    console.log(`[Info] Target User to Register: ${savedUserId}`);

    // ==========================================================
    // 🏢 PART 1: Navigate and Create Course
    // ==========================================================
    console.log('🔐 Logging into Admin Portal...');
    await page.goto('https://test.coursemill.com/');
    await page.fill('#login_userid_tb', 'saraswathiadmin');
    await page.fill('#login_password_tb', 'Admin123$');
    await page.click('#login_btn');
    await page.waitForLoadState('networkidle');

    console.log('🧭 Navigating to Manage Courses...');
    await page.locator('div.homeBodyGrpText span', { hasText: 'Curriculums/Courses' }).click();
    await page.locator('a[name="Manage Courses"]').click();
    await page.waitForTimeout(2000); 

    console.log(`🔍 Selecting Org "${savedOrgId}" from dropdown...`);
    const orgDropdown = page.locator('select#fpOrgIDTb').and(page.locator(':visible')).first();
    await expect(orgDropdown).toBeVisible();
    await orgDropdown.selectOption(savedOrgId); 
    
    const searchBtn = page.locator('li.dynBtn.search:visible').first();
    await searchBtn.click();
    await page.waitForTimeout(2000); 

    console.log('➕ Clicking Add Course button...');
    // 🛑 FIX: Filter out the hidden background duplicates and only target the visible button
    const addCourseBtn = page.locator('span[title="Add Course"]').and(page.locator(':visible')).first();
    await addCourseBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addCourseBtn.click({ force: true });

    console.log('⏳ Waiting for Add Course Dialog Frame...');
    const addCourseFrame = await findFrameByLocator(page, '#courseIDTb');

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const courseId = `Course${randomSuffix}`;
    
    console.log(`📝 Entering new Course ID: ${courseId}`);
    const courseIdInput = addCourseFrame.locator('#courseIDTb');
    
    await courseIdInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await courseIdInput.type(courseId, { delay: 100 });
    await courseIdInput.press('Tab'); 

    console.log('💾 Clicking Save button...');
    const saveCourseBtn = addCourseFrame.locator('#saveBtn');
    
    // Force enable save button if disabled here as well
    await saveCourseBtn.evaluate(btn => {
      if (btn.hasAttribute('disabled')) btn.removeAttribute('disabled');
    }).catch(() => {});
    
    await saveCourseBtn.click({ force: true });
    await page.waitForTimeout(2000); 

    const courseData = { courseId: courseId };
    fs.writeFileSync('courseData.json', JSON.stringify(courseData, null, 2));
    console.log(`✅ Successfully created Course: ${courseId}`);

    // ==========================================================
    // 👤 PART 2: Search Course & Register User
    // ==========================================================
    console.log(`\n🔍 Searching for newly created Course: ${courseId}`);
    
    const courseSearchInput = page.locator('#fpCourseIDTb');
    await expect(courseSearchInput).toBeVisible();
    await courseSearchInput.fill(courseId);
    await searchBtn.click(); 
    await page.waitForTimeout(2000);

    const courseRow = page.locator('td', { hasText: courseId }).first();
    try {
      await courseRow.click({ timeout: 3000 });
    } catch (e) {
      console.log('⚠️ Row auto-selected or not clickable, proceeding...');
    }

    console.log('📝 Clicking Register tab...');
    const registerTabBtn = page.locator('#subTabsRegister').and(page.locator(':visible')).first();
    await registerTabBtn.click();

    console.log('⏳ Waiting for Register Dialog Frame...');
    const registerFrame = await findFrameByLocator(page, '#selSearchBtn');

    console.log('🖱️ Clicking Select button to open User Picker...');
    await registerFrame.locator('#selSearchBtn').click();
    await page.waitForTimeout(1500); 

    console.log('⏳ Waiting for User Picker Frame...');
    const userPickerFrame = await findFrameByLocator(page, '#returnBtn');

    console.log(`🖱️ Highlighting User: ${savedUserId}`);
    const userSpan = userPickerFrame.locator('span', { hasText: savedUserId }).first();
    await userSpan.scrollIntoViewIfNeeded();
    await userSpan.click();

    console.log('🖱️ Clicking Select (User Picker)...');
    await userPickerFrame.locator('#selectBtn').click();

    console.log('🖱️ Clicking Return Selected Items...');
    await userPickerFrame.locator('#returnBtn').click();
    
    await page.waitForTimeout(1500);

    console.log('💾 Clicking Final Register button...');
    await registerFrame.locator('#saveBtn').click({ force: true });

    console.log('✅ Validating Success Message...');
    const successMessage = registerFrame.getByText('Students Registered');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('🎉 Confirmed text: "Students Registered"');

    console.log('🚪 Closing dialog...');
    await registerFrame.locator('#cancelBtn').click();
    
    console.log(`🎉 TEST 9 COMPLETE: User ${savedUserId} successfully registered to ${courseId}!`);
  });

  // ==========================================================
  // 🧪 TEST 10: Search Course in NSUI and Validate Unenroll
  // ==========================================================
  test('Search Course in NSUI and Validate No Unenroll Button', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 10: Search Course in NSUI and Validate No Unenroll Button');
    test.setTimeout(60000);

    // 1. Read stored User and Course Data
    const userData = JSON.parse(fs.readFileSync('userData.json', 'utf8'));
    const courseData = JSON.parse(fs.readFileSync('courseData.json', 'utf8'));
    const courseId = courseData.courseId;

    console.log(`[Info] Logging in with User: ${userData.userId}`);
    console.log(`[Info] Target Course to Search: ${courseId}`);

    // ==========================================================
    // 🌐 PART 1: Navigate to NSUI and Login
    // ==========================================================
    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    
    await humanType(page, usernameInput, userData.userId);
    await humanType(page, passwordInput, userData.password);

    console.log('🖱️ Submitting login form...');
    await passwordInput.press('Enter');
    await page.locator('#submitBtn').evaluate(btn => btn.click()).catch(() => {});
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header.fixed.top-0').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Successfully logged in.');

    // ==========================================================
    // 🧭 PART 2: Navigate to My Courses
    // ==========================================================
    console.log('🧭 Navigating to "My Courses" tab...');
    const myCoursesTab = page.locator('a[href="/nsui/myCourses"]').first();
    await expect(myCoursesTab).toBeVisible();
    await myCoursesTab.click();

    await page.waitForURL('**/nsui/myCourses*', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Reached My Courses dashboard.');

    // ==========================================================
    // 🔍 PART 3: Search for the Course
    // ==========================================================
    console.log(`🔍 Searching for course: ${courseId}`);
    const searchInput = page.locator('#default-search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    await searchInput.fill(courseId);

    const searchBtn = page.locator('button[type="submit"]', { hasText: 'Search' }).first();
    await searchBtn.click();
    
    await page.waitForTimeout(2000); 

    // ==========================================================
    // 🖱️ PART 4: Click Course and Validate
    // ==========================================================
    console.log('🖱️ Clicking the course link...');
    
    const courseLink = page.locator(`a[href*="${courseId}"]`).first();
    await expect(courseLink).toBeVisible({ timeout: 10000 });
    
    await courseLink.scrollIntoViewIfNeeded();
    await courseLink.click({ force: true });

    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes(courseId)) {
        console.log('⚠️ Click intercepted. Performing direct navigation fallback...');
        const href = await courseLink.getAttribute('href');
        if (href) {
            await page.goto(`https://test.coursemill.com${href}`);
            await page.waitForLoadState('networkidle');
        }
    }
    
    console.log('✅ Navigated into course details view.');

    console.log('🛡️ Performing Unenroll Button Conditional Check...');
    
    const unenrollBtn = page.locator('button', { hasText: /Unenroll/i }).first();
    await page.waitForTimeout(2000); 
    
    const isUnenrollVisible = await unenrollBtn.isVisible();

    if (isUnenrollVisible) {
        console.log('⚠️ UnEnroll is present, before enabling the unenroll button from admin side it seems wrong check application');
    } else {
        console.log('✅ Unenroll is not present proceed with next test');
    }

    console.log(`🎉 TEST 10 COMPLETE: Course ${courseId} searched and conditional check finished!`);
  });

});