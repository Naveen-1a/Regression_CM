import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Resource Page - UI, Search, Clear and Link Validation', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 🔐 Login
  await loginPage.navigate();
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // ✅ Validate login success
  const resourceTab = page.locator('a[href="/nsui/resources"]');
  await expect(resourceTab).toBeVisible();

  // 📂 Click Resource tab
  await resourceTab.click();

  // ✅ Wait for Resources page
  await expect(page).toHaveURL(/resources/);

  // ✅ Locators
  const searchBox = page.locator('#default-search');
  const searchBtn = page.getByRole('button', { name: 'Search' });
  const clearBtn = page.getByRole('button', { name: 'Clear' });
  const table = page.locator('table');

  // ✅ UI validation
  await expect(searchBox).toBeVisible();
  await expect(searchBtn).toBeVisible();
  await expect(clearBtn).toBeVisible();

  await expect(page.getByText('TYPE')).toBeVisible();
  await expect(page.getByText('NAME')).toBeVisible();
  await expect(page.getByText('DESCRIPTION')).toBeVisible();
  await expect(page.getByText('DATE POSTED')).toBeVisible();

  // 🔍 Search functionality
  await searchBox.fill('graduation');
  await searchBtn.click();

  // ✅ Wait for results to update
  await expect(table).toBeVisible();
  await expect(table).toContainText(/graduation/i);

  // 🔄 Clear functionality
  await clearBtn.click();
  await expect(searchBox).toHaveValue('');

  // 🔍 No records scenario
  await searchBox.fill('NoData123');
  await searchBtn.click();

  await expect(page.getByText(/No Results Found/i)).toBeVisible();

  await clearBtn.click();
  // ✅ Click resource link and handle new tab
  const firstResourceLink = page.locator('table tbody tr td a').first();

  const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  firstResourceLink.click()
  ]);

  await newPage.waitForLoadState();

  // ✅ Validate new tab URL
  await expect(newPage).toHaveURL(/cmtemp/);

  // ✅ Close tab
  await newPage.close();

});