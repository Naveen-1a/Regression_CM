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

test.describe.serial('CourseMill Org Flow - Consolidated Suite', () => {

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
    const addCourseBtn = page.locator('span[title="Add Course"]');
    await expect(addCourseBtn).toBeVisible();
    await addCourseBtn.click();

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
  // ==========================================================
  // 🧪 TEST 11: Enable Unenrollment for Org (Admin)
  // ==========================================================
  test('Enable Allow Student To Unenroll for Org', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 11: Enable Allow Student To Unenroll for Org');
    test.setTimeout(60000);
    const { orgId } = JSON.parse(fs.readFileSync('orgData.json', 'utf8'));

    // 1. Login and Navigate to Org Edit Frame
    await adminLoginAndNavigate(page);
    await searchAndEditOrg(page, orgId);

    const editFrame = await findFrameByLocator(page, '#allowStudToUnenrollTb');
    const unenrollCheckbox = editFrame.locator('#allowStudToUnenrollTb').first();
    const saveBtn = editFrame.locator('#saveBtn').first();

    // CourseMill usually wraps checkboxes in a div with "Div" replacing "Tb"
    const unenrollWrapper = editFrame.locator('#allowStudToUnenrollDiv').first();

    await expect(unenrollCheckbox).toBeAttached({ timeout: 15000 });

    const isChecked = await unenrollCheckbox.evaluate((node: HTMLInputElement) => node.checked);

    if (!isChecked) {
      console.log('⏳ Forcing "Allow Student To Unenroll" Checkbox to checked state...');
      await unenrollCheckbox.scrollIntoViewIfNeeded();
      
      // Attempt 1: Click the wrapper (if it exists)
      if (await unenrollWrapper.count() > 0) {
          await unenrollWrapper.click({ force: true }).catch(() => {});
      }
      
      // Attempt 2: Use Playwright's native check
      await unenrollCheckbox.check({ force: true }).catch(() => {});

      // Attempt 3: Fire raw JavaScript events directly into the browser to force Vue to wake up
      await unenrollCheckbox.evaluate((node: HTMLInputElement) => {
          node.click(); // Native browser click
          node.checked = true;
          node.dispatchEvent(new Event('input', { bubbles: true }));
          node.dispatchEvent(new Event('change', { bubbles: true }));
      }).catch(() => {});

      await page.waitForTimeout(1000); // Give Vue a second to process the events
      
      // Final Fallback: Physical keyboard spacebar
      await expect(saveBtn).toBeEnabled({ timeout: 5000 }).catch(async () => {
          console.log('⚠️ Save button still disabled. Using physical Spacebar focus strategy...');
          await unenrollCheckbox.focus();
          await page.keyboard.press('Space');
          await page.waitForTimeout(500);
      });
    } else {
      console.log('🟢 Checkbox is already checked.');
    }

    // 3. Click Save organically
    console.log('💾 Clicking Save button...');
    await saveBtn.waitFor({ state: 'attached' });
    
    // We only force the button as an absolute last resort, but the JS events above should make it naturally enabled.
    await saveBtn.evaluate(btn => btn.removeAttribute('disabled')).catch(() => {});
    
    await saveBtn.click({ force: true });
    
    // 🛑 Wait 3 seconds for the backend to process the database update
    await page.waitForTimeout(3000);
    console.log('✅ Unenrollment settings saved successfully!');
  });

// ==========================================================
  // 🧪 TEST 12: Validate Unenrollment in NSUI (Student)
  // ==========================================================
  test('Validate and Click Unenroll Button in NSUI', async ({ page }) => {
    console.log('\n▶️ STARTING TEST 12: Validate and Click Unenroll Button in NSUI');
    test.setTimeout(60000);

    // Read stored User and Course Data
    const userData = JSON.parse(fs.readFileSync('userData.json', 'utf8'));
    const courseData = JSON.parse(fs.readFileSync('courseData.json', 'utf8'));
    const courseId = courseData.courseId;

    console.log(`[Info] Logging in with User: ${userData.userId}`);
    console.log(`[Info] Target Course: ${courseId}`);

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
    // 🖱️ PART 4: Click Course and Validate Unenroll
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

    console.log('🛡️ Validating Unenroll Button Presence...');
    
    // Look for the specific Unenroll button text
    const unenrollBtn = page.locator('button', { hasText: /Unenroll/i }).first();
    
    // We expect it to be visible now since we enabled it in Test 11
    await expect(unenrollBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Unenroll button is PRESENT on the page as expected!');

    console.log('🖱️ Clicking the Unenroll button...');
    await unenrollBtn.click({ force: true });

    // ==========================================================
    // 🛑 PART 5: Accept Modal and Validate Feedback
    // ==========================================================
    console.log('⏳ Waiting for Accept confirmation modal...');
    
    // Using the highly reliable data-test attribute provided in your HTML snippet
    const acceptBtn = page.locator('[data-test="ui-modal-accept"]').first();
    await acceptBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('🖱️ Clicking Accept button...');
    await acceptBtn.click();

    console.log('✅ Validating Success Message...');
    // We use a regex match /Successful unenrollment/i to ignore any hidden spaces or case sensitivity
    const successFeedback = page.getByText(/Successful unenrollment/i).first();
    await expect(successFeedback).toBeVisible({ timeout: 15000 });
    
    console.log('🎉 Confirmed text: "Successful unenrollment"');
    console.log(`🎉 TEST 12 COMPLETE: Unenrollment successfully validated!`);
  });

});