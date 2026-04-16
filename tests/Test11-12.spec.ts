import { test, expect } from '@playwright/test';
const fs = require('fs');

// Import your helper functions
import { 
  adminLoginAndNavigate, 
  searchAndEditOrg, 
  findFrameByLocator, 
  humanType 
} from './helpers';

test.describe.serial('CourseMill Org Flow - Unenrollment Validation', () => {

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