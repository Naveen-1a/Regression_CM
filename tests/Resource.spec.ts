import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Resource Page - UI, Search, Clear and Link Validation', async ({ page }) => {
  console.log('🚀 Test Started: Resource Page Validation');

  const loginPage = new LoginPage(page);

  // 🔐 Login
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔑 Logging in with valid credentials');
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  const resourceTab = page.locator('a[href="/nsui/resources"]');
  await expect(resourceTab).toBeVisible();
  console.log('✅ Login successful, Resource tab visible');

  // 📂 Click Resource tab
  await resourceTab.click();
  console.log('📂 Clicked Resource tab');

  // ✅ Wait for Resources page
  await expect(page).toHaveURL(/resources/);
  console.log('✅ Navigated to Resources page');

  // ✅ Locators
  const searchBox = page.locator('#default-search');
  const searchBtn = page.getByRole('button', { name: 'Search' });
  const clearBtn = page.getByRole('button', { name: 'Clear' });
  const table = page.locator('table');

  // ✅ UI validation
  console.log('🔍 Validating UI elements');

  await expect(searchBox).toBeVisible();
  console.log('✔️ Search box visible');

  await expect(searchBtn).toBeVisible();
  console.log('✔️ Search button visible');

  await expect(clearBtn).toBeVisible();
  console.log('✔️ Clear button visible');

  await expect(page.getByText('TYPE')).toBeVisible();
  await expect(page.getByText('NAME')).toBeVisible();
  await expect(page.getByText('DESCRIPTION')).toBeVisible();
  await expect(page.getByText('DATE POSTED')).toBeVisible();
  console.log('✔️ Table headers validated');

  // 🔍 Search functionality
  console.log('🔍 Performing search: graduation');

  await searchBox.fill('graduation');
  await searchBtn.click();

  // ✅ Wait for results to update
  await expect(table).toBeVisible();
  await expect(table).toContainText(/graduation/i);
  console.log('✅ Search results displayed correctly');

  // 🔄 Clear functionality
  console.log('🧹 Clearing search');

  await clearBtn.click();
  await expect(searchBox).toHaveValue('');
  console.log('✅ Search box cleared');

  // 🔍 No records scenario
  console.log('🔍 Testing No Results scenario');

  await searchBox.fill('NoData123');
  await searchBtn.click();

  await expect(page.getByText(/No Results Found/i)).toBeVisible();
  console.log('⚠️ No Results Found message displayed');

  await clearBtn.click();
  console.log('🧹 Cleared search after no results');

  // ✅ Click resource link and handle new tab
  console.log('🔗 Clicking first resource link');

  const firstResourceLink = page.locator('table tbody tr td a').first();

  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    firstResourceLink.click()
  ]);

  await newPage.waitForLoadState();
  console.log('🆕 New tab opened');

  // ✅ Validate new tab URL
  await expect(newPage).toHaveURL(/cmtemp/);
  console.log('✅ New tab URL validated');

  // ✅ Close tab
  await newPage.close();
  console.log('❌ New tab closed');
  // 🔥 IMPORTANT FIX
await page.bringToFront();
await page.waitForLoadState('networkidle');
console.log('🌐 Returned to main page & network idle');

  console.log('🎉 Test Completed: Resource Page Validation');
});