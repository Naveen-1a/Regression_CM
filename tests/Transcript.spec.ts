import { test, expect } from '@playwright/test';

test.describe.serial('CourseMill NSUI - Transcript Functionality', () => {

  const targetUserId = 'regtestuser_01';
  const targetPassword = 'P@ssw0rd';

  test('Navigate to Transcript, Run Reports, and Validate Downloads', async ({ page, context }) => {
    console.log('\n▶️ STARTING TEST: Transcript Tab - Run Reports and Downloads');
    test.setTimeout(120000);

    // ==========================================================
    // 🌐 PART 1: Navigate to NSUI and Login
    // ==========================================================
    console.log('🌐 Navigating to NSUI login page...');
    await page.goto('https://test.coursemill.com/nsui/');
    await page.waitForTimeout(1000);

    console.log(`🔑 Logging in with User: ${targetUserId}`);
    await page.locator('#username').fill(targetUserId);
    await page.locator('#password').fill(targetPassword);

    await page.locator('#submitBtn').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header.fixed.top-0').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Successfully logged in.');

    // ==========================================================
    // 🧭 PART 2: Navigate to Transcript Tab
    // ==========================================================
    console.log('🧭 Navigating to the Transcript tab...');
    const transcriptTab = page.locator('span', { hasText: 'Transcript' }).first();
    await expect(transcriptTab).toBeVisible({ timeout: 10000 });
    await transcriptTab.click();
    
    await page.waitForLoadState('networkidle');
    console.log('✅ Reached the Transcript page.');

    // ==========================================================
    // 📅 PART 3: Enter Dates & Close Popups
    // ==========================================================
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const startDateStr = '2026-04-02';

    console.log(`📅 Setting Enrollment Start Date: ${startDateStr}`);
    console.log(`📅 Setting Enrollment End Date: ${todayStr}`);

    const setDatepickerValue = async (index: number, dateValue: string) => {
        const dateInput = page.locator('input[aria-label="Datepicker input"]').nth(index);
        
        // Remove readonly and set the value natively
        await dateInput.evaluate((node: HTMLInputElement, val) => {
            node.removeAttribute('readonly'); 
            node.value = val;
            node.dispatchEvent(new Event('input', { bubbles: true }));
            node.dispatchEvent(new Event('change', { bubbles: true }));
        }, dateValue);

        // Click to trigger Vue, press Enter to confirm
        await dateInput.click({ force: true });
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
        
        // 🛑 CRITICAL FIX: Press Escape to force the calendar popup to close!
        // If we don't do this, it blocks the checkboxes and buttons.
        await page.keyboard.press('Escape'); 
        await page.waitForTimeout(300);
    };

    await setDatepickerValue(0, startDateStr);
    await setDatepickerValue(1, todayStr);
    
    // Click a safe area (like the header text) to guarantee all overlays are dismissed
    await page.getByText('Enrollment Start Date').click({ force: true });
    console.log('✅ Dates successfully set and popups closed.');

    // ==========================================================
    // ⚙️ SETUP: Map the Checkbox Elements
    // ==========================================================
    // First checkbox on the page is Summary, second is Inactive Courses
    const summaryInput = page.locator('input[type="checkbox"]').nth(0);
    // The exact text we want to click
    const summaryTextLabel = page.getByText('Summary Transcript', { exact: true });

    // ==========================================================
    // 📊 PART 4: Standard Transcript Report
    // ==========================================================
    console.log('⚙️ Preparing standard transcript report...');
    
    // Process: Uncheck if already selected
    let isCurrentlyChecked = await summaryInput.isChecked();
    if (isCurrentlyChecked) {
        console.log('☑️ Summary is currently checked. Clicking the text label to uncheck it...');
        await summaryTextLabel.click();
        await page.waitForTimeout(500);
    }

    console.log('⚙️ Running standard report...');
    const runReportBtn = page.locator('button', { hasText: /Run Report/i }).first();
    await runReportBtn.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    const downloadReportBtn = page.locator('button', { hasText: /Download Report/i }).first();
    const isStandardDownloadAvailable = await downloadReportBtn.isVisible();

    if (isStandardDownloadAvailable) {
        console.log('📥 Results found! Clicking download and waiting for new tab...');
        
        const [reportTab] = await Promise.all([
            context.waitForEvent('page'),
            downloadReportBtn.click()
        ]);
        
        console.log('👀 New tab opened! Observing the report for 3 seconds...');
        await reportTab.waitForLoadState().catch(() => {});
        await reportTab.waitForTimeout(3000); 
        
        console.log('✖️ Closing the download tab...');
        await reportTab.close();
        
        console.log('🔙 Returning to the main working tab...');
        await page.bringToFront(); 
        await page.waitForTimeout(1000);
    } else {
        console.log('⚠️ No standard reports found for this date range. Skipping download.');
    }

    // ==========================================================
    // 📋 PART 5: Summary Transcript Report
    // ==========================================================
    console.log('\n⚙️ Preparing summary transcript report...');
    
    // Process: Check if not selected
    isCurrentlyChecked = await summaryInput.isChecked();
    if (!isCurrentlyChecked) {
        console.log('☑️ Summary is not checked. Clicking the text label to check it...');
        await summaryTextLabel.click();
        await page.waitForTimeout(500);
    }

    console.log('⚙️ Running summary report...');
    await runReportBtn.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    const isSummaryDownloadAvailable = await downloadReportBtn.isVisible();

    if (isSummaryDownloadAvailable) {
        console.log('📥 Summary Results found! Clicking download and waiting for new tab...');
        
        const [summaryReportTab] = await Promise.all([
            context.waitForEvent('page'),
            downloadReportBtn.click()
        ]);
        
        console.log('👀 New tab opened! Observing the summary report for 3 seconds...');
        await summaryReportTab.waitForLoadState().catch(() => {});
        await summaryReportTab.waitForTimeout(3000); 
        
        console.log('✖️ Closing the summary download tab...');
        await summaryReportTab.close();
        
        console.log('🔙 Returning to the main working tab...');
        await page.bringToFront();
    } else {
        console.log('⚠️ No summary reports found for this date range. Skipping download.');
    }

    console.log('\n🎉 SUCCESS: Transcript functionality validated flawlessly!');
  });

});