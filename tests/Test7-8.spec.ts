import { test, expect } from '@playwright/test';

const fs = require('fs');



// Import your helper functions

import {

  adminLoginAndNavigate,

  searchAndEditOrg,

  findFrameByLocator,

  humanType

} from './helpers';



test.describe.serial('CourseMill Org Flow - UI Colors & Logos (Isolated)', () => {



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

     

      // 🛑 BRUTE-FORCE HUMAN SIMULATION:

      // 1. Click to focus the field

      await field.locator.click();

      await page.waitForTimeout(100);



      // 2. Select All (Ctrl+A / Cmd+A) and Delete

      await page.keyboard.press('Control+A'); // Windows/Linux

      await page.keyboard.press('Meta+A');    // Mac

      await page.waitForTimeout(100);

      await page.keyboard.press('Backspace');

      await page.waitForTimeout(100);



      // 3. Type slowly, ensuring every character triggers a physical keydown/keyup event

      await field.locator.type(field.value, { delay: 100 });

     

      // 4. Press Enter and Tab. Color pickers usually require this to "lock in" the selected color.

      await field.locator.press('Enter');

      await field.locator.press('Tab');

     

      // 5. Fire a backup JS event just in case Vue needs an extra nudge

      await field.locator.evaluate(node => {

        node.dispatchEvent(new Event('input', { bubbles: true }));

        node.dispatchEvent(new Event('change', { bubbles: true }));

      }).catch(() => {});



      await page.waitForTimeout(500); // Let the UI digest the change before moving to the next box

    }



    console.log('💾 Clicking Save button...');

    const saveBtn = editFrame.locator('#saveBtn').first();

    await saveBtn.waitFor({ state: 'visible' });

   

    // Perform a standard click first to ensure Vue registers it naturally

    await saveBtn.click();

   

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



});