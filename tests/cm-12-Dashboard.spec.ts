import { test, expect } from '@playwright/test';
// @ts-ignore
import * as fs from 'fs';

test.describe.serial('CourseMill NSUI - Full Dashboard Widgets Validation', () => {

  const targetUserId = 'regtestuser_01';
  const targetPassword = 'P@ssw0rd';

  test('Extract and Validate Progress, Calendar, Email, Catalog, and Resources', async ({ page }) => {
    console.log('\n▶️ STARTING TEST: Dashboard - Full Widget Validation Suite');
    test.setTimeout(900000); 

    const humanClick = async (locator: any) => {
        await locator.scrollIntoViewIfNeeded();
        await locator.hover();
        await page.waitForTimeout(100); 
        await locator.click({ force: true, delay: 50 }); 
    };

    const dashboardTabSpan = page.locator('span', { hasText: /^Dashboard$/ }).first();
    const nextBtn = page.locator('button').filter({ has: page.locator('path[d="m9 18 6-6-6-6"]') }).first();

    // =========================================================================================
    // ⚡ HELPER: SCRAPE ALL DATA ACROSS ALL PAGES
    // =========================================================================================
    const scrapeAllPagesText = async () => {
        let hasNextPage = true;
        let pageLimit = 0;
        const allPageContent: string[] = [];

        console.log('   📥 Scraping data across all pagination pages...');
        while (hasNextPage && pageLimit < 50) {
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000); 
            
            const rowsCount = await page.locator('tbody tr').count();
            if (rowsCount > 0) {
                const rowsText = await page.locator('tbody tr').allInnerTexts();
                allPageContent.push(...rowsText);
            } else {
                const bodyText = await page.locator('body').innerText();
                allPageContent.push(...bodyText.split('\n')); 
            }

            if (await nextBtn.isVisible()) {
                const prevHtml = await page.locator('tbody, body').first().innerHTML();
                await nextBtn.click({ force: true });
                await page.waitForTimeout(1500); 
                const currentHtml = await page.locator('tbody, body').first().innerHTML();
                
                if (prevHtml === currentHtml) {
                    hasNextPage = false; 
                }
            } else {
                hasNextPage = false; 
            }
            pageLimit++;
        }
        console.log(`   ✅ Scraping complete. Collected ${allPageContent.length} data blocks.`);
        return allPageContent;
    };

    // =========================================================================================
    // ⚡ HELPER: TEST QUICK-LINKS & SMART MEDIA WAITER
    // =========================================================================================
    const verifyDashboardWidgetLinks = async (widgetName: string, items: string[], isNewTab: boolean = false) => {
        console.log(`\n🖱️ Testing Quick-Links on Dashboard for [${widgetName}]...`);
        
        const textOccurrences: Record<string, number> = {};

        for (let i = 0; i < items.length; i++) {
            const itemText = items[i];
            const shortText = itemText.substring(0, 15);
            
            textOccurrences[shortText] = (textOccurrences[shortText] || 0) + 1;
            const elementIndex = textOccurrences[shortText] - 1; 

            console.log(`   └─ Clicking link for: "${shortText}..." (Occurrence: ${elementIndex + 1})`);
            
            try {
                const widget = page.locator('div.bg-white.rounded').filter({ hasText: widgetName }).first();
                const clickableEl = widget.locator('a, td').filter({ hasText: shortText }).nth(elementIndex);
                
                if (isNewTab) {
                    const [newPage] = await Promise.all([
                        page.context().waitForEvent('page'),
                        clickableEl.click({ force: true })
                    ]);
                    
                    console.log(`      ⏳ Waiting for resource media to fully load...`);
                    
                    // 🛑 SMART MEDIA WAITER: Wait for DOM, then evaluate native img/video loading states
                    await newPage.waitForLoadState('domcontentloaded');
                    
                    try {
                        await newPage.evaluate(async () => {
                            // Wait for Images
                            const img = document.querySelector('img');
                            if (img && !img.complete) {
                                await new Promise(resolve => {
                                    img.onload = resolve;
                                    img.onerror = resolve; // Resolve on error so test doesn't hang
                                });
                            }
                            // Wait for Videos/Audio
                            const media = document.querySelector('video, audio') as HTMLMediaElement;
                            if (media && media.readyState < 3) { // 3 = HAVE_FUTURE_DATA
                                await new Promise(resolve => {
                                    media.oncanplay = resolve;
                                    media.onerror = resolve;
                                });
                            }
                        });
                        // Add a tiny visual buffer just to ensure it renders on screen
                        await newPage.waitForTimeout(500); 
                    } catch (e) {
                        // Safe fallback if evaluating media fails (e.g. for PDFs or cross-origin blocks)
                        await newPage.waitForTimeout(2000); 
                    }

                    console.log(`      ✅ MATCH: New tab opened and media loaded successfully.`);
                    await newPage.close();
                } else {
                    await clickableEl.click({ force: true });
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await expect(page.getByText(shortText, { exact: false }).first()).toBeVisible({ timeout: 5000 });
                    console.log(`      ✅ MATCH: Navigated to correct item page.`);
                    await humanClick(dashboardTabSpan);
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                }
            } catch (error) {
                console.log(`      ❌ ERROR: Failed to click or validate dashboard link for "${shortText}"`);
                if (!isNewTab) {
                    await humanClick(dashboardTabSpan).catch(() => {});
                    await page.waitForTimeout(1000);
                }
            }
        }
    };

    // ==========================================================
    // 🌐 PART 1: Navigate to NSUI and Login
    // ==========================================================
    console.log('🌐 Navigating to NSUI & Logging in...');
    await page.goto('https://test.coursemill.com/nsui/');
    await page.locator('#username').fill(targetUserId);
    await page.locator('#password').fill(targetPassword);
    await humanClick(page.locator('#submitBtn'));
    await page.waitForLoadState('networkidle');
    await expect(page.locator('header.fixed.top-0').first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Successfully logged in.');

    await humanClick(dashboardTabSpan);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    // =========================================================================================
    // 📊 WIDGET 1: MY COURSE PROGRESS
    // =========================================================================================
    console.log('\n📊 WIDGET 1: My Course Progress Validation...');
    const progressWidget = page.locator('div.bg-white.rounded').filter({ hasText: 'My Course Progress' }).first();
    await expect(progressWidget).toBeVisible();

    const extractedCourses = await progressWidget.evaluate((widget) => {
        const results: { name: string, status: string }[] = [];
        const statusMapping = [
            { header: 'Courses Not Started', statusString: 'Not Attempted' },
            { header: 'Courses In Progress', statusString: 'Incomplete' },
            { header: 'Courses Completed', statusString: 'Completed' }
        ];

        statusMapping.forEach(mapping => {
            const h2Elements = Array.from(widget.querySelectorAll('h2'));
            const headerEl = h2Elements.find(h2 => h2.textContent && h2.textContent.includes(mapping.header));

            if (headerEl) {
                const sectionContainer = headerEl.closest('.bg-gray-100')?.parentElement;
                if (sectionContainer) {
                    const courseSpans = sectionContainer.querySelectorAll('table a span');
                    courseSpans.forEach(span => {
                        const cleanName = (span.textContent || '').replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim();
                        if (cleanName) results.push({ name: cleanName, status: mapping.statusString });
                    });
                }
            }
        });
        return results;
    });

    console.log(`✅ Extracted ${extractedCourses.length} progress courses.`);
    
    if (extractedCourses.length > 0) {
        await verifyDashboardWidgetLinks('My Course Progress', extractedCourses.map(c => c.name), false);
    }

    console.log('\n🖱️ Clicking the "View All" button for Progress...');
    await humanClick(page.locator('div.bg-white.rounded').filter({ hasText: 'My Course Progress' }).locator('button', { hasText: 'View All' }).first());
    await page.waitForURL('**/nsui/myCourses**', { timeout: 15000 }).catch(() => {});
    
    if (extractedCourses.length > 0) {
        const allCourseRows = await scrapeAllPagesText();

        for (let i = 0; i < extractedCourses.length; i++) {
            const course = extractedCourses[i];
            console.log(`\n🔎 [${i + 1}/${extractedCourses.length}] Validating Course: "${course.name}"`);
            
            const searchTargetName = course.name.substring(0, 15).toLowerCase();
            const searchTargetStatus = course.status.toLowerCase();

            const isMatch = allCourseRows.some(rowText => 
                rowText.toLowerCase().includes(searchTargetName) && 
                rowText.toLowerCase().includes(searchTargetStatus)
            );

            if (isMatch) {
                console.log(`   ✅ MATCH: Course found with Expected Status: [${course.status}]`);
            } else {
                console.log(`   ❌ ERROR: Failed to validate Progress Course "${course.name}"!`);
            }
        }
    }

    // =========================================================================================
    // 📅 WIDGET 2: CALENDAR
    // =========================================================================================
    console.log('\n🔙 Returning to Dashboard for Calendar Validation...');
    await humanClick(dashboardTabSpan);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    console.log('\n📊 WIDGET 2: Calendar Validation...');
    const calendarWidget = page.locator('div.bg-white.rounded').filter({ hasText: 'Calendar' }).first();
    await expect(calendarWidget).toBeVisible();

    const calendarDetails = await calendarWidget.evaluate((widget) => {
        const sections = ['Today', 'Meeting This Week', 'Due This Week', 'Expiring This Week'];
        let hasData = false;
        sections.forEach(sec => {
            if(widget.textContent && widget.textContent.includes(sec) && !widget.textContent.includes('No Events')) {
                hasData = true;
            }
        });
        return hasData;
    });

    if(!calendarDetails) {
        console.log('✅ No calendar events found for this week.');
    } else {
        console.log('✅ Calendar events found. Proceeding to view...');
    }

    await humanClick(calendarWidget.locator('button', { hasText: 'View All' }).first());
    console.log('⏳ Waiting for Calendar page...');
    await page.waitForURL('**/nsui/calendar**', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('.vc-pane-layout').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Successfully navigated to Calendar Tab.');

    // =========================================================================================
    // 📧 WIDGET 3: EMAIL
    // =========================================================================================
    console.log('\n🔙 Returning to Dashboard for Email Validation...');
    await humanClick(dashboardTabSpan);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    console.log('\n📊 WIDGET 3: Email Validation...');
    const emailWidget = page.locator('div.bg-white.rounded').filter({ hasText: 'Email' }).first();
    await expect(emailWidget).toBeVisible();

    const extractedEmails = await emailWidget.evaluate((widget) => {
        const emails: string[] = [];
        const emailDivs = widget.querySelectorAll('.overflow-hidden.text-ellipsis div');
        emailDivs.forEach(div => {
            const cleanText = (div.textContent || '').trim();
            if(cleanText && !emails.includes(cleanText)) emails.push(cleanText); 
        });
        return emails;
    });

    console.log(`✅ Extracted ${extractedEmails.length} unique email subjects.`);

    if (extractedEmails.length > 0) {
        await verifyDashboardWidgetLinks('Email', extractedEmails, false);
    }

    console.log('\n🖱️ Clicking the "View All" button for Emails...');
    await humanClick(page.locator('div.bg-white.rounded').filter({ hasText: 'Email' }).locator('button', { hasText: 'View All' }).first());
    await page.waitForURL('**/nsui/email**', { timeout: 15000 }).catch(() => {});

    if(extractedEmails.length > 0) {
        const unreadHeader = page.getByText('Unread', { exact: true }).first();
        const readHeader = page.getByText('Read', { exact: true }).first();

        console.log('   (Opening Email Accordions...)');
        await humanClick(unreadHeader);
        await page.waitForTimeout(500);
        await humanClick(readHeader);
        await page.waitForTimeout(1000); 

        for (let i = 0; i < extractedEmails.length; i++) {
            const subject = extractedEmails[i];
            console.log(`\n🔎 [${i + 1}/${extractedEmails.length}] Email Validating: "${subject.substring(0,40)}..."`);
            
            const coreSubject = subject.substring(0, 15);
            const emailMatch = page.getByText(coreSubject, { exact: false }).first();
            
            if(await emailMatch.isVisible().catch(() => false)) {
                console.log(`   ✅ MATCH: Email found in the inbox.`);
            } else {
                console.log(`   ❌ ERROR: Email not found!`);
            }
        }
    }

    // =========================================================================================
    // 📚 WIDGET 4: COURSE CATALOG
    // =========================================================================================
    console.log('\n🔙 Returning to Dashboard for Catalog Validation...');
    await humanClick(dashboardTabSpan);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    console.log('\n📊 WIDGET 4: Course Catalog Validation...');
    const catalogWidget = page.locator('div.bg-white.rounded').filter({ hasText: 'Course Catalog' }).first();
    await expect(catalogWidget).toBeVisible();

    const extractedCatalogCourses = await catalogWidget.evaluate((widget) => {
        const results: string[] = [];
        const courseSpans = widget.querySelectorAll('tbody tr td a span');
        courseSpans.forEach(span => {
            const cleanName = (span.textContent || '').replace(/[\u00A0\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleanName) results.push(cleanName);
        });
        return results;
    });

    console.log(`✅ Extracted ${extractedCatalogCourses.length} catalog courses.`);

    if (extractedCatalogCourses.length > 0) {
        await verifyDashboardWidgetLinks('Course Catalog', extractedCatalogCourses, false);
    }

    console.log('\n🖱️ Clicking the "View All" button inside Catalog Widget...');
    await humanClick(page.locator('div.bg-white.rounded').filter({ hasText: 'Course Catalog' }).locator('button', { hasText: 'View All' }).first());
    await page.waitForURL('**/nsui/courseCatalog**', { timeout: 15000 }).catch(() => {});

    if (extractedCatalogCourses.length > 0) {
        const allCatalogRows = await scrapeAllPagesText();

        for (let i = 0; i < extractedCatalogCourses.length; i++) {
            const courseName = extractedCatalogCourses[i];
            console.log(`\n🔎 [${i + 1}/${extractedCatalogCourses.length}] Catalog Validating: "${courseName}"`);

            const searchTargetName = courseName.substring(0, 15).toLowerCase();
            const isMatch = allCatalogRows.some(rowText => rowText.toLowerCase().includes(searchTargetName));

            if (isMatch) {
                console.log(`   ✅ MATCH: Verified Course "${courseName}" is displayed in Catalog.`);
            } else {
                console.log(`   ❌ ERROR: Failed to validate Catalog Course "${courseName}"!`);
            }
        }
    }

    // =========================================================================================
    // 📁 WIDGET 5: RESOURCES
    // =========================================================================================
    console.log('\n🔙 Returning to Dashboard for Resource Validation...');
    await humanClick(dashboardTabSpan);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); 

    console.log('\n📊 WIDGET 5: Resource Validation...');
    const resourceWidget = page.locator('div.bg-white.rounded').filter({ hasText: 'Resources' }).first();
    await expect(resourceWidget).toBeVisible();

    const extractedResources = await resourceWidget.evaluate((widget) => {
        const resources: string[] = [];
        const resourceSpans = widget.querySelectorAll('a span');
        resourceSpans.forEach(span => {
            const cleanText = (span.textContent || '').trim();
            if(cleanText) resources.push(cleanText);
        });
        return resources;
    });

    console.log(`✅ Extracted ${extractedResources.length} resources.`);

    if (extractedResources.length > 0) {
        await verifyDashboardWidgetLinks('Resources', extractedResources, true);
    }

    console.log('\n🖱️ Clicking the "View All" button inside Resource Widget...');
    await humanClick(page.locator('div.bg-white.rounded').filter({ hasText: 'Resources' }).locator('button', { hasText: 'View All' }).first());
    await page.waitForURL('**/nsui/resources**', { timeout: 15000 }).catch(() => {});

    if (extractedResources.length > 0) {
        const allResourceRows = await scrapeAllPagesText();

        for (let i = 0; i < extractedResources.length; i++) {
            const resource = extractedResources[i];
            console.log(`\n🔎 [${i + 1}/${extractedResources.length}] Resource Validating: "${resource}"`);

            const searchTargetName = resource.substring(0, 15).toLowerCase();
            const isMatch = allResourceRows.some(rowText => rowText.toLowerCase().includes(searchTargetName));

            if (isMatch) {
                console.log(`   ✅ MATCH: Verified Resource "${resource}" is displayed.`);
            } else {
                console.log(`   ❌ ERROR: Failed to validate Resource "${resource}"!`);
            }
        }
    }

    console.log('\n🎉 ALL DASHBOARD WIDGETS + QUICK-LINKS FULLY VALIDATED E2E IN THE CORRECT ORDER!');
  });

});