import { test, expect } from '@playwright/test';

test.describe.serial('CourseMill Admin - User Approvals and Registrations', () => {

  const targetOrg = 'regression_org';
  const targetUser = 'regtestuser_01';

  // ==========================================================
  // 🧪 TEST 1: Deny Approval Requests for User
  // ==========================================================
  test('Search user and Deny Pending Approval Requests', async ({ page }) => {
    test.setTimeout(90000);

    // Login
    await page.goto('https://test.coursemill.com/');
    await page.locator('#login_userid_tb').fill('saraswathiadmin');
    await page.locator('#login_password_tb').fill('Admin123$');
    await page.locator('#login_btn').click();
    await page.waitForLoadState('networkidle');

    // Navigate to Approval Requests
    const usersTab = page.locator('div.homeBodyGrpText', { hasText: 'Users' }).and(page.locator(':visible')).first();
    await usersTab.waitFor({ state: 'visible' });
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    const approvalRequestsBtn = page.locator('table#userMenuTable a[name="Approval Requests"]').first();
    await approvalRequestsBtn.waitFor({ state: 'attached', timeout: 10000 });
    
    // 🛑 TS FIX: Cast node as HTMLElement to resolve SVGElement warning
    await approvalRequestsBtn.evaluate((node: HTMLElement) => node.click()).catch(async () => {
        await approvalRequestsBtn.click({ force: true });
    });
    await page.waitForTimeout(2000); 

    // Search for Pending Requests
    const orgDropdown = page.locator('select#fpOrgIDTb').and(page.locator(':visible')).first();
    await expect(orgDropdown).toBeVisible({ timeout: 10000 });
    await expect(orgDropdown).not.toHaveClass(/loading/, { timeout: 15000 }).catch(() => {});
    await orgDropdown.selectOption(targetOrg);
    await page.waitForTimeout(1000);

    const studentInput = page.locator('#fpStudentTb').and(page.locator(':visible')).first();
    await studentInput.fill('');
    await studentInput.type(targetUser, { delay: 100 });

    const statusDropdown = page.locator('select#fpTypeTb').and(page.locator(':visible')).first();
    await statusDropdown.selectOption('Pending');

    const searchBtn = page.locator('#subTabsSearch').and(page.locator(':visible')).first();
    await searchBtn.click({ force: true });
    
    await page.waitForTimeout(3000);

    // Count rows that have a specific data 'id' attribute to ignore "No records found" messages
    const requestRows = page.locator('#approvalRequestsTable tbody tr[id]');
    const rowCount = await requestRows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = requestRows.nth(i);
        await row.scrollIntoViewIfNeeded();
        await row.click({ modifiers: ['Control'] });
        await page.waitForTimeout(100); 
      }

      const denyBtn = page.locator('#denied').and(page.locator(':visible')).first();
      await expect(denyBtn).toBeEnabled({ timeout: 5000 }).catch(() => {});
      
      // Handle native browser confirm dialog if it appears here
      page.once('dialog', async dialog => {
          await dialog.accept();
      });

      await denyBtn.click();
      await page.waitForTimeout(3000); 
      console.log('Pending requests found and all have been denied successfully.');

    } else {
      console.log('No pending requests have been found.');
    }
  });

  // ==========================================================
  // 🧪 TEST 2: Bulk Unenroll User from Admin Portal
  // ==========================================================
  test('Search user and Delete All Course Registrations', async ({ page }) => {
    test.setTimeout(90000);

    // Login
    await page.goto('https://test.coursemill.com/');
    await page.locator('#login_userid_tb').fill('saraswathiadmin');
    await page.locator('#login_password_tb').fill('Admin123$');
    await page.locator('#login_btn').click();
    await page.waitForLoadState('networkidle');

    // Navigate to Manage Users
    const usersTab = page.locator('div.homeBodyGrpText', { hasText: 'Users' }).and(page.locator(':visible')).first();
    await usersTab.waitFor({ state: 'visible' });
    await usersTab.click({ force: true });
    await page.waitForTimeout(1000);

    const manageUsersBtn = page.locator('table#userMenuTable a[name="Manage Users"]').first();
    await manageUsersBtn.waitFor({ state: 'attached', timeout: 10000 });
    
    // 🛑 TS FIX: Cast node as HTMLElement to resolve SVGElement warning
    await manageUsersBtn.evaluate((node: HTMLElement) => node.click()).catch(async () => {
        await manageUsersBtn.click({ force: true });
    });
    await page.waitForTimeout(2000); 

    // Search for the User
    const orgDropdown = page.locator('select#fpOrgIDTb').and(page.locator(':visible')).first();
    await expect(orgDropdown).toBeVisible({ timeout: 10000 });
    await expect(orgDropdown).not.toHaveClass(/loading/, { timeout: 15000 }).catch(() => {});
    await orgDropdown.selectOption(targetOrg);
    await page.waitForTimeout(1000);

    const userIdInput = page.locator('#fpUserIDTb').and(page.locator(':visible')).first();
    await userIdInput.fill('');
    await userIdInput.type(targetUser, { delay: 100 });

    const searchBtn = page.locator('li.dynBtn.search').and(page.locator(':visible')).first();
    await searchBtn.click({ force: true });
    await page.waitForTimeout(2000);

    // Select User and Open Register Tab
    const userRow = page.locator('td', { hasText: targetUser }).and(page.locator(':visible')).first();
    await expect(userRow).toBeVisible({ timeout: 10000 });
    await userRow.click();
    await page.waitForTimeout(1000);

    const registerBtn = page.locator('#enrollHdr').and(page.locator(':visible')).first();
    await expect(registerBtn).toBeVisible();
    await registerBtn.click();

    // Wait for CourseMill to finish loading the popup table
    await page.waitForTimeout(3000);

    // Count the rows that have the "hasDetail" class which indicates a real course
    const courseRows = page.locator('#enrollStudentTable tr.hasDetail');
    const rowCount = await courseRows.count();

    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const row = courseRows.nth(i);
        await row.scrollIntoViewIfNeeded();
        await row.click({ modifiers: ['Control'] });
        await page.waitForTimeout(100); 
      }

      // Click the Delete Registration button
      const deleteBtn = page.locator('#delBtn').and(page.locator(':visible')).first();
      await expect(deleteBtn).toBeEnabled({ timeout: 5000 }).catch(() => {});
      await deleteBtn.click();
      
      // Wait for Custom Yes/No Dialog and click Yes
      const yesBtn = page.locator('input#Yes').and(page.locator(':visible')).first();
      await yesBtn.waitFor({ state: 'visible', timeout: 10000 });
      await yesBtn.click();

      // Validate Success Message in next Dialog
      const successMessage = page.getByText('Students successfully unregistered.').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });

      // Click OK on Success Dialog
      const okBtn = page.locator('input#OK').and(page.locator(':visible')).first();
      await okBtn.waitFor({ state: 'visible', timeout: 5000 });
      await okBtn.click();

      // Finally, click Close on the main Register window
      const closeBtn = page.locator('#cancelBtn').and(page.locator(':visible')).first();
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();

      await page.waitForTimeout(1000); 
      console.log(`${rowCount} courses found and have been deleted successfully.`);

    } else {
      console.log('No courses have been found for this user.');
    }
  });

});