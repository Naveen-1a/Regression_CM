import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Calendar Page Validation', async ({ page }) => {
  console.log('🚀 Test Started: Calendar Page Validation');

  const loginPage = new LoginPage(page);

  // 🔐 Login
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔑 Logging in with valid credentials');
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  console.log('🔍 Verifying Calendar tab visibility');
  const calendarTab = page.locator('a[href="/nsui/mycalendar"]');
  await expect(calendarTab).toBeVisible();
  console.log('✅ Calendar tab is visible');

  // 📂 Click Calendar tab
  console.log('📂 Clicking Calendar tab');
  await calendarTab.click();

  console.log('⏳ Waiting for Calendar page to load');
  await page.waitForLoadState('networkidle');

  // ✅ Validate URL
  console.log('🌐 Validating Calendar page URL');
  await expect(page).toHaveURL(/calendar/);
  console.log('✅ Navigated to Calendar page');

  // ===============================
  // 📅 CALENDAR VALIDATIONS START
  // ===============================
  console.log('📅 Starting Calendar validations');

  // ✅ 1. Month & Year validation
  console.log('🗓️ Validating month and year display');
  const monthTitle = page.locator('.vc-title span').first();
  await expect(monthTitle).toBeVisible();

  const uiText = await monthTitle.textContent();

  const currentDate = new Date();
  const expectedMonth = currentDate.toLocaleString('default', { month: 'long' });
  const expectedYear = currentDate.getFullYear();

  const expectedText = `${expectedMonth} ${expectedYear}`;
  expect(uiText?.trim()).toBe(expectedText);
  console.log(`✅ Month & Year validated: ${expectedText}`);

  // ✅ 2. Week headers validation
  console.log('📆 Validating week headers');
  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (const day of weekHeaders) {
    await expect(page.locator(`.vc-weekday:has-text("${day}")`)).toBeVisible();
  }
  console.log('✅ Week headers validated');

  // ✅ 3. Dates validation
  console.log('🔢 Validating dates count');
  const allDates = page.locator('.vc-day.in-month');
  await expect(allDates.first()).toBeVisible();

  const count = await allDates.count();
  console.log(`📊 Total visible dates: ${count}`);

  expect(count).toBeGreaterThanOrEqual(28);
  expect(count).toBeLessThanOrEqual(31);
  console.log('✅ Dates count validation passed');

  // ✅ 4. Current date highlight
  console.log('📍 Validating current date highlight');
  const today = page.locator('.vc-day.is-today .day-label');

  await expect(today).toHaveCount(1);
  await expect(today).toBeVisible();

  const uiDate = await today.textContent();
  const systemDate = new Date().getDate().toString();

  expect(uiDate?.trim()).toBe(systemDate);
  console.log(`✅ Today’s date validated: ${systemDate}`);

  // ===============================
  // 🔄 MONTH NAVIGATION
  // ===============================
  console.log('🔄 Testing month navigation');

  const nextBtn = page.locator('.vc-next');
  const prevBtn = page.locator('.vc-prev');

  const currentMonthText = await monthTitle.textContent();

  // 👉 Next month
  console.log('➡️ Navigating to next month');
  await nextBtn.click();
  await page.waitForTimeout(1000);

  const nextMonth = await monthTitle.textContent();
  expect(nextMonth).not.toBe(currentMonthText);
  console.log('✅ Next month navigation successful');

  // 👉 Back
  console.log('⬅️ Navigating back to current month');
  await prevBtn.click();
  await page.waitForTimeout(1000);

  await expect(monthTitle).toHaveText(currentMonthText || '');
  console.log('✅ Returned to original month');

  // ===============================
  // 🎨 WEEKEND VALIDATION
  // ===============================
  console.log('🎨 Validating weekend highlights');

  const saturday = page.locator('.vc-day.weekday-7');
  const sunday = page.locator('.vc-day.weekday-1');

  expect(await saturday.count()).toBeGreaterThan(0);
  expect(await sunday.count()).toBeGreaterThan(0);
  console.log('✅ Weekend days validated');

  // ===============================
  // 🔄 PAGE REFRESH VALIDATION
  // ===============================
  console.log('🔄 Refreshing page and validating state');

  await page.reload();
  await expect(monthTitle).toBeVisible();
  console.log('✅ Calendar visible after refresh');

  // ===============================
  // ⚡ RAPID NAVIGATION
  // ===============================
  console.log('⚡ Testing rapid navigation');

  for (let i = 0; i < 3; i++) {
    await nextBtn.click();
  }

  for (let i = 0; i < 3; i++) {
    await prevBtn.click();
  }

  await expect(monthTitle).toBeVisible();
  console.log('✅ Rapid navigation handled correctly');

  console.log('🎉 Test Completed: Calendar Page Validation');
});