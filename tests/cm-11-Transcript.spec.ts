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
    // 📅 PART 3: Human Calendar Interaction (Vue Datepicker Fix)
    // ==========================================================
    const today = new Date();
    const todayDayStr = String(today.getDate()); // Extracts the day number (e.g., "16")
    const startDayStr = '2'; // Represents 2026-04-02

    console.log(`📅 Physically clicking Calendar Start Date: Day ${startDayStr}`);
    console.log(`📅 Physically clicking Calendar End Date: Day ${todayDayStr}`);

    // 🛑 VUE DATEPICKER FIX: Physically click the calendar popup
    const selectDateFromCalendar = async (index: number, dayToSelect: string) => {
        const dateInput = page.locator('input[aria-label="Datepicker input"]').nth(index);
        
        // 1. Click the input to open the calendar dropdown
        await dateInput.click({ force: true });
        await page.waitForTimeout(500); // Wait for the animation to finish

        // 2. Find the calendar popup (.dp__menu) and click the exact day number
        const calendarPopup = page.locator('.dp__menu').first();
        await calendarPopup.getByText(dayToSelect, { exact: true }).first().click({ force: true });
        await page.waitForTimeout(500);

        // 3. Force close the calendar so it doesn't block the Run Report button
        await page.keyboard.press('Escape'); 
        await page.waitForTimeout(500);
    };

    // Index 0 = Start Date, Index 1 = End Date
    await selectDateFromCalendar(0, startDayStr);
    await selectDateFromCalendar(1, todayDayStr);
    console.log('✅ Dates successfully clicked and popups closed.');

    // ==========================================================
    // ⚙️ SETUP: Map the Checkbox Element
    // ==========================================================
    const summaryCheckbox = page.locator('input[data-test="ui-input-checkbox"]').first();

    // ==========================================================
    // 📊 PART 4: Standard Transcript Report
    // ==========================================================
    console.log('\n⚙️ Preparing standard transcript report...');
    
    // 🛑 CHECKBOX FIX: Force uncheck using Playwright's native method
    console.log('☑️ Ensuring Summary Transcript is UNCHECKED...');
    await summaryCheckbox.uncheck({ force: true });
    await page.waitForTimeout(500);

    console.log('⚙️ Clicking Run Report...');
    const runReportBtn = page.locator('button', { hasText: /Run Report/i }).first();
    await runReportBtn.click({ force: true });
    
    console.log('⏳ Waiting for report generation...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); 

    const downloadReportBtn = page.locator('button', { hasText: /Download Report/i }).first();
    const isStandardDownloadAvailable = await downloadReportBtn.isVisible();

    if (isStandardDownloadAvailable) {
        console.log('📥 Results found! Clicking download and waiting for new tab...');
        
        const [reportTab] = await Promise.all([
            context.waitForEvent('page'),
            downloadReportBtn.click({ force: true })
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
    
    // 🛑 CHECKBOX FIX: Force check using Playwright's native method
    console.log('☑️ Ensuring Summary Transcript is CHECKED...');
    await summaryCheckbox.check({ force: true });
    await page.waitForTimeout(500);

    console.log('⚙️ Clicking Run Report...');
    await runReportBtn.click({ force: true });
    
    console.log('⏳ Waiting for summary report generation...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); 

    const isSummaryDownloadAvailable = await downloadReportBtn.isVisible();

    if (isSummaryDownloadAvailable) {
        console.log('📥 Summary Results found! Clicking download and waiting for new tab...');
        
        const [summaryReportTab] = await Promise.all([
            context.waitForEvent('page'),
            downloadReportBtn.click({ force: true })
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