import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Course Catalog Page Validation', async ({ page }) => {
  test.setTimeout(280000);

  console.log('🚀 Test Started');

  const loginPage = new LoginPage(page);

  // 🔐 Login
  console.log('🔐 Navigating to login page');
  await loginPage.navigate();

  console.log('🔐 Logging in with user');
  await loginPage.login('regtestuser_01', 'P@ssw0rd');

  // Navigate to catalog
  const catalogTab = page.locator('a[href="/nsui/courses"]');
  await expect(catalogTab).toBeVisible();

  console.log('📂 Navigating to Course Catalog');
  await catalogTab.click();
  await expect(page).toHaveURL(/courses/i);

  const searchInput = page.locator('input[type="search"]');
  await expect(searchInput).toBeVisible();

  // ===============================
  // 🔍 SEARCH
  // ===============================
  console.log('🔍 Performing search: Access Code');

  await searchInput.fill('Access Code');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForTimeout(2000);

  const resultText = page.locator('#cardsContainer .text-gray-500').first();
  await expect(resultText).toBeVisible();

  const text = (await resultText.textContent()) || '';
  console.log('📊 Search result text:', text);

  const match = text.match(/(\d+)-(\d+) of (\d+)/);

  const cards = page.locator('#cardsContainer .border-2.border-gray-300.rounded:visible');
  await expect(cards.first()).toBeVisible();

  const cardCount = await cards.count();
  console.log(`📦 Total visible cards: ${cardCount}`);

  if (match) {
    const total = parseInt(match[3]);
    console.log(`📊 Total records from UI: ${total}`);

    if (total === 0) {
      console.log('⚠️ No results found');
      expect(cardCount).toBe(0);
    } else {
      console.log('✅ Results found');
      expect(cardCount).toBeGreaterThan(0);
    }
  }

  const searchCourse = async (text: string) => {
    console.log(`🔍 Searching course: ${text}`);
    await searchInput.fill(text);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');
  };

  const clickCourse = async (courseName: string) => {
    console.log(`📘 Clicking course: ${courseName}`);

    const courseLink = page.getByRole('link', {
      name: new RegExp(courseName, 'i')
    }).first();

    await expect(courseLink).toBeVisible({ timeout: 10000 });
    await courseLink.click({ force: true });
  };

  const clickEnrollFromCard = async (courseName: string) => {
    console.log(`📝 Enrolling from card: ${courseName}`);

    const card = page.locator('div.border-2.border-gray-300').filter({
      hasText: courseName
    });

    const enrollBtn = card.getByRole('button', { name: /enroll/i });

    await expect(enrollBtn).toBeVisible();
    await enrollBtn.click();

    console.log('✅ Enroll button clicked');
  };

  const getRightPanelValue = (label: string) => {
    console.log(`📌 Fetching right panel value for: ${label}`);

    return page.locator('div.flex.flex-col.flex-wrap.w-full.lg\\:w-1\\/4')
      .locator('div.grid.grid-cols-2', {
        has: page.locator('span.text-gray-500', { hasText: label })
      })
      .locator('span.text-gray-800');
  };

  const clickCurriculum = async (curriculumName: string) => {
    console.log(`📚 Clicking curriculum: ${curriculumName}`);

    const curriculumCard = page.locator('div.border-2.border-gray-300').filter({
      has: page.locator('p.text-base a', { hasText: curriculumName })
    });

    const curriculumLink = curriculumCard.locator('a[href*="/courses/curriculum"]').first();

    await expect(curriculumLink).toBeVisible({ timeout: 10000 });
    await curriculumLink.click();
  };

  const clickEnrollFromCurriculumCard = async (curriculumName: string) => {
    console.log(`📝 Enrolling from curriculum card: ${curriculumName}`);

    const card = page.locator('div.border-2.border-gray-300').filter({
      has: page.locator('p.text-base a', { hasText: curriculumName })
    }).first();

    await expect(card).toBeVisible({ timeout: 10000 });

    const enrollBtn = card.getByRole('button', { name: /enroll/i });

    await expect(enrollBtn).toBeVisible();

    await Promise.all([
      page.waitForLoadState('networkidle'),
      enrollBtn.click()
    ]);

    console.log('✅ Curriculum enroll clicked');
  };

  const successMsg = page.locator('text=successfully enrolled');
  const approvalMsg = page.locator('text=Enrollment request sent for approval');

  const listViewBtn = page.locator('button').filter({
    has: page.locator('svg path[d^="M1.58333"]')
  });

  const gridViewBtn = page.locator('button').filter({
    has: page.locator('svg path[d^="M1.63636 1"]')
  }).first();

  // ===============================
  // 📦 CARD VALIDATION
  // ===============================
  console.log('📦 Validating first course card');

  const firstCard = cards.first();
  await expect(firstCard.locator('img')).toBeVisible();
  await expect(firstCard.locator('p.text-base a')).toBeVisible();
  await expect(firstCard.locator('text=Course ID')).toBeVisible();

  console.log('✅ Card validation completed');

  // ===============================
  // 🧹 CLEAR
  // ===============================
  console.log('🧹 Clearing search');

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(searchInput).toHaveValue('');

  // ===============================
  // ❌ INVALID SEARCH
  // ===============================
  console.log('❌ Performing invalid search');

  await searchInput.fill('invalid_course_123');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(resultText).toBeVisible();

  const invalidText = (await resultText.textContent()) || '';
  console.log('📊 Invalid search result text:', invalidText);

  const invalidMatch = invalidText.match(/(\d+)-(\d+) of (\d+)/);

  if (invalidMatch) {
    const total = parseInt(invalidMatch[3]);

    const invalidCards = page.locator('#cardsContainer .border-2.border-gray-300.rounded:visible');
    const invalidCardCount = await invalidCards.count();

    console.log(`📊 Invalid search total: ${total}`);
    console.log(`📦 Invalid cards count: ${invalidCardCount}`);

    expect(total).toBe(0);
    expect(invalidCardCount).toBe(0);
  }

  // ===============================
  // 🧹 CLEAR
  // ===============================
  console.log('🧹 Clearing search again');

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(searchInput).toHaveValue('');
  console.log('🏁 Search functionality test completed');

// ===============================
// 🔤 SORTING Test
// ===============================

const clickSort = async (option: string) => {
  console.log(`🔽 Opening sort dropdown for option: ${option}`);

  const sortBtn = page.locator('button.tw-inline-flex').filter({
    has: page.locator('span')
  }).first();

  await sortBtn.waitFor({ state: 'visible', timeout: 15000 });

  await sortBtn.click({ force: true });
  console.log('✅ Sort dropdown opened');

  const optionLocator = page.locator('a').filter({ hasText: option }).first();

  await optionLocator.waitFor({ state: 'visible', timeout: 10000 });
  await optionLocator.click({ force: true });

  console.log(`✅ Sort option selected: ${option}`);

  await page.waitForSelector('#cardsContainer p.text-base a', { timeout: 10000 });
  console.log('🔄 Cards reloaded after sorting');
};

// ===============================
// 📌 COMMON FUNCTION
// ===============================

const getCardTitles = async () => {
  console.log('📌 Fetching card titles');

  const elements = page.locator('#cardsContainer p.text-base a');

  await elements.first().waitFor({ state: 'visible', timeout: 10000 });

  const count = await elements.count();
  console.log(`📊 Total titles found: ${count}`);

  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await elements.nth(i).textContent();
    list.push((text || '').trim().toLowerCase());
  }

  return list;
};

// ===============================
// 🔼 TITLE (A-Z)
// ===============================

console.log('🔼 Sorting: Title (A-Z)');

const beforeTitle = await getCardTitles();

await clickSort('Title (A-Z)');

const afterAsc = await getCardTitles();

console.log('📊 Title A-Z:', afterAsc);
expect(afterAsc.length).toBeGreaterThan(0);

// ===============================
// 🔽 TITLE (Z-A)
// ===============================

console.log('🔽 Sorting: Title (Z-A)');

await clickSort('Title (Z-A)');

const afterDesc = await getCardTitles();

console.log('📊 Title Z-A:', afterDesc);

expect(afterDesc.length).toBeGreaterThan(0);

// ===============================
// 🔼 COURSE TYPE (A-Z)
// ===============================

console.log('🔼 Sorting: Course Type (A-Z)');

await clickSort('Course Type (A-Z)');

const typeAsc = await getCardTitles();

console.log('📊 Course Type A-Z:', typeAsc);

if (typeAsc.length === 0) {
  console.log('⚠️ Course Type A-Z returned no data (UI issue)');
}

// ===============================
// 🔽 COURSE TYPE (Z-A)
// ===============================

console.log('🔽 Sorting: Course Type (Z-A)');

await clickSort('Course Type (Z-A)');

const typeDesc = await getCardTitles();

console.log('📊 Course Type Z-A:', typeDesc);

// ===============================
// 🔼 DESCRIPTION (A-Z)
// ===============================

console.log('🔼 Sorting: Description (A-Z)');

await clickSort('Description (A-Z)');

const descAsc = await getCardTitles();

console.log('📊 Description A-Z:', descAsc);

// ===============================
// 🔽 DESCRIPTION (Z-A)
// ===============================

console.log('🔽 Sorting: Description (Z-A)');

await clickSort('Description (Z-A)');

const descDesc = await getCardTitles();

console.log('📊 Description Z-A:', descDesc);

// ===============================
// 🔢 CARD COUNT
// ===============================

const getCardCount = async () => {
  const count = await page.locator('#cardsContainer .grid > div').count();
  console.log('🔢 Card Count:', count);
  return count;
};

// ===============================
// 🔥 WAIT FOR CARDS
// ===============================

const waitForCards = async () => {
  console.log('⏳ Waiting for cards to load');

  const cards = page.locator('#cardsContainer .grid > div');

  for (let i = 0; i < 5; i++) {
    const count = await cards.count();
    console.log(`🔄 Attempt ${i + 1}: Card count = ${count}`);

    if (count > 0) {
      await cards.first().waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ Cards loaded successfully');
      return;
    }

    await page.waitForTimeout(1000);
  }

  throw new Error('❌ Cards not loaded');
};
console.log('🏁 Sorting test completed');
// ===============================
// 🔥 OPEN FILTER
// ===============================
const openFilter = async () => {
  console.log('🔍 Attempting to open filter');

  const btn = page.locator('button:has(svg path[d^="M13.5385"])').first();

  await btn.waitFor({ state: 'visible', timeout: 15000 });

  for (let i = 0; i < 3; i++) {
    try {
      console.log(`🔄 Click attempt ${i + 1} to open filter`);

      await btn.click();

      const dropdown = page.locator('button[aria-labelledby="filter-label"]').first();
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      console.log('✅ Filter opened successfully');
      return;
    } catch {
      console.log('⚠️ Filter open failed, retrying...');
      await page.waitForTimeout(1000);
    }
  }

  throw new Error('❌ Filter not opened');
};

// ===============================
// 🔥 TYPE FILTER
// ===============================
const applyTypeFilter = async (type: string) => {
  console.log(`🔽 Applying Type Filter: ${type}`);

  await openFilter();

  const dropdown = page.locator('button[aria-labelledby="filter-label"]').first();
  await dropdown.click();
  console.log('📂 Type dropdown opened');

  const option = page.locator('li, div')
    .filter({ hasText: new RegExp(`^${type}`, 'i') })
    .first();

  await option.click();
  console.log(`✅ Selected Type: ${type}`);

  await page.getByRole('button', { name: /search/i }).click();
  console.log('🔍 Search triggered for Type filter');

  await waitForCards();
  console.log('✅ Cards loaded after Type filter');
};

// ===============================
// 🔥 LOCATION FILTER
// ===============================
const applyLocationFilter = async (location: string) => {
  console.log(`📍 Applying Location Filter: ${location}`);

  await openFilter();

  const clearBtn = page.getByRole('button', { name: /clear/i });
  await clearBtn.click();
  console.log('🧹 Cleared previous filters');

  await waitForCards();

  await openFilter();

  const locationDropdown = page
    .locator('label:has-text("Location")')
    .locator('xpath=..')
    .locator('button');

  await locationDropdown.click();
  console.log('📂 Location dropdown opened');

  const option = page.locator('li, div')
    .filter({ hasText: new RegExp(`^${location}$`, 'i') })
    .first();

  await option.click();
  console.log(`✅ Selected Location: ${location}`);

  await page.getByRole('button', { name: /search/i }).click();
  console.log('🔍 Search triggered for Location filter');

  await waitForCards();
  console.log('✅ Cards loaded after Location filter');
};

// ===============================
// 🔥 TAG FILTER
// ===============================
const applyTagFilter = async (tag: string) => {
  console.log(`🏷️ Applying Tag Filter: ${tag}`);

  await openFilter();

  const tagDropdown = page
    .locator('label:has-text("Tags")')
    .locator('xpath=..')
    .locator('button');

  await tagDropdown.click();
  console.log('📂 Tag dropdown opened');

  const option = page.locator('li, div')
    .filter({ hasText: new RegExp(`^${tag}$`, 'i') })
    .first();

  await option.click();
  console.log(`✅ Selected Tag: ${tag}`);

  await page.getByRole('button', { name: /search/i }).click();
  console.log('🔍 Search triggered for Tag filter');

  await waitForCards();
  console.log('✅ Cards loaded after Tag filter');
};

const validateTagCount = async () => {
  console.log('📊 Validating Tag filter result count');

  const count = await getCardCount();
  console.log(`📦 Tag filter card count: ${count}`);

  expect(count).toBeGreaterThan(0);
};

// ===============================
// 🔥 INCLUDE ENROLLED FLOW (NEW)
// ===============================
const includeEnrolledCheckbox = page.locator('#includeEnrolled');

const toggleIncludeEnrolled = async () => {
  console.log('🔁 Toggling Include Enrolled checkbox');

  const isChecked = await includeEnrolledCheckbox.isChecked();
  console.log(`☑️ Checkbox initial state: ${isChecked}`);

  if (isChecked) {
    await includeEnrolledCheckbox.click();
    console.log('☑️ Include Enrolled unchecked');
  }

  await page.getByRole('button', { name: /search/i }).click();
  console.log('🔍 Search triggered after toggle');

  await waitForCards();
  console.log('✅ Cards loaded after toggling Include Enrolled');
};

// ===============================
// 🔽 TYPE TEST
// ===============================
console.log('🚀 Starting Type Filter Tests');

await applyTypeFilter('Web');
await applyTypeFilter('Instructor');

// ===============================
// 🔽 LOCATION TEST
// ===============================
console.log('🚀 Starting Location Filter Test');

await applyLocationFilter('Online');

// ===============================
// 🔽 TAG TEST
// ===============================
console.log('🚀 Starting Tag Filter Test');

await applyTagFilter('check');
await validateTagCount();

// ===============================
// 🧹 CLEAR FILTER AFTER TAG
// ===============================
console.log('🧹 Clearing filters after Tag test');

await openFilter();
const clearBtn = page.getByRole('button', { name: /clear/i });
await clearBtn.click();

await waitForCards();

console.log('🧹 Filters cleared after Tag filter');

// ===============================
// 🔥 INCLUDE ENROLLED VALIDATION
// ===============================
console.log('🔍 Validating Include Enrolled functionality');

await expect(includeEnrolledCheckbox).toBeChecked();
console.log('☑️ Include Enrolled is checked by default');

const countWithEnrolled = await getCardCount();

await toggleIncludeEnrolled();

const countWithoutEnrolled = await getCardCount();

console.log('📊 With Enrolled:', countWithEnrolled);
console.log('📊 Without Enrolled:', countWithoutEnrolled);

expect(countWithEnrolled).toBeGreaterThanOrEqual(countWithoutEnrolled);

await clearBtn.click();
console.log('🏁 Filter test completed');

// ===============================
// 🔄 LIST VIEW
// ===============================

console.log('🔄 Switching to List View');

await page.getByRole('button', { name: 'Clear' }).click();
console.log('🧹 Cleared search/filter');

await listViewBtn.click();
console.log('📋 List view button clicked');

// ✅ wait for table rows instead of table
const rows = page.locator('table tbody tr');
await expect(rows.first()).toBeVisible();
console.log('✅ List rows are visible');

// ===============================
// 📊 LIST COUNT VALIDATION
// ===============================

console.log('📊 Validating list count');

const listResultText = page.locator('.text-gray-500').filter({ hasText: /of/ }).first();

if (await listResultText.count() > 0) {
  const listText = (await listResultText.textContent()) || '';
  console.log('📄 Result text:', listText);

  const listMatch = listText.match(/(\d+)-(\d+) of (\d+)/);

  if (listMatch) {
    const end = parseInt(listMatch[2]);
    const rowCount = await rows.count();

    console.log(`📊 Rows displayed: ${rowCount}, Expected max: ${end}`);

    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(end);
  }
}

// ===============================
// 📋 HEADER VALIDATION
// ===============================

console.log('📋 Validating table headers');

const headers = ['ID', 'TITLE', 'TYPE', 'LOCATION', 'DATE', 'TIME', 'ENROLLED'];

for (const header of headers) {
  await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
  console.log(`✅ Header visible: ${header}`);
}

const firstRow = rows.first();
await expect(firstRow.locator('td')).toHaveCount(7);
console.log('✅ First row has correct column count');

// ===============================
// 🔤 SORTING VALIDATION (FIXED)
// ===============================

console.log('🔤 Validating sorting functionality');

const titleSort = page.locator('th div:has-text("Title")');

const getTitles = async () => {
  const titleCells = page.locator('table tbody tr td:nth-child(2)');
  const count = await titleCells.count();

  const titles: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await titleCells.nth(i).textContent();
    titles.push((text || '').trim());
  }

  console.log('📋 Extracted titles:', titles);
  return titles;
};

// 👉 FIRST CLICK → DESC
console.log('🔽 Sorting by Title DESC');
await titleSort.click();
await expect(page.locator('table tbody tr').first()).toBeVisible();

const firstSort = await getTitles();

const descSorted = [...firstSort].sort((a, b) => b.localeCompare(a));
expect(firstSort).toEqual(descSorted);
console.log('✅ DESC sorting validated');

// 👉 SECOND CLICK → ASC
console.log('🔼 Sorting by Title ASC');
await titleSort.click();
await expect(page.locator('table tbody tr').first()).toBeVisible();

const secondSort = await getTitles();

const ascSorted = [...secondSort].sort((a, b) => a.localeCompare(b));
expect(secondSort).toEqual(ascSorted);
console.log('✅ ASC sorting validated');

// ===============================
// 🔗 COURSE NAVIGATION
// ===============================

console.log('🔗 Navigating to course detail');

const firstTitleLink = page.locator('table tbody tr td:nth-child(2) a').first();
await expect(firstTitleLink).toBeVisible();

const href = await firstTitleLink.getAttribute('href');
console.log('🔗 Course link:', href);

await Promise.all([
  page.waitForNavigation(),
  firstTitleLink.click()
]);

console.log('✅ Navigated to course detail page');

// 🔙 Back
await page.goBack();
await expect(page).toHaveURL(/courses/i);
console.log('🔙 Returned to course catalog');

// ===============================
// 🔍 FILTER SELECTION
// ===============================

await openFilter();
console.log('🔽 Filter opened');

const selectType = async (type: string) => {
  console.log(`🔽 Selecting Type: ${type}`);

  const typeDropdown = page
    .locator('label:has-text("Type")')
    .locator('xpath=..')
    .locator('button');

  await typeDropdown.waitFor({ state: 'visible' });
  await typeDropdown.click();

  const option = page.locator('li, div, span')
    .filter({ hasText: new RegExp(`^${type}$`, 'i') })
    .first();

  await option.waitFor({ state: 'visible' });
  await option.click();

  console.log(`✅ Type selected: ${type}`);
};

await selectType('Web');

const selectTag = async (tag: string) => {
  console.log(`🔽 Selecting Tag: ${tag}`);

  const tagDropdown = page
    .locator('label:has-text("Tags")')
    .locator('xpath=..')
    .locator('button');

  await tagDropdown.waitFor({ state: 'visible' });
  await tagDropdown.click();

  const option = page.locator('li, div, span')
    .filter({ hasText: new RegExp(`^${tag}$`, 'i') })
    .first();

  await option.waitFor({ state: 'visible' });
  await option.click();

  console.log(`✅ Tag selected: ${tag}`);
};

await selectTag('check');

await page.getByRole('button', { name: /search/i }).click();
console.log('🔍 Applied filter search');

await page.waitForTimeout(3000);

await clearBtn.click();
console.log('🧹 Cleared filters');

await gridViewBtn.waitFor({ state: 'visible' });
await gridViewBtn.click();
console.log('🔲 Switched back to Grid View');

await page.waitForTimeout(3000);

// ===============================
// 🔥 FILTER BUTTON CLICK
// ===============================

const filterBtn = page.locator('button').filter({
  has: page.locator('svg path[d*="13.5385"]')
}).first();

await filterBtn.click();
await page.waitForSelector('#cardsContainer .border-2.border-gray-300');
console.log('🔽 Filter button clicked again');
console.log('🏁 List View Validation Test Completed');

// ===============================
// ✅ ICON + NUMBER PAGINATION VALIDATION
// ===============================

const validateAdvancedPagination = async () => {

  console.log('📄 Starting Advanced Pagination Validation');

  const pagination = page.locator('div.flex.justify-center.font-semibold').first();

  await expect(pagination).toBeVisible();
  console.log('✅ Pagination container visible');

  const buttons = pagination.locator('button');
  const totalButtons = await buttons.count();

  console.log(`🔢 Total pagination buttons: ${totalButtons}`);

  // 👉 Button Index Mapping (based on your HTML)
  const firstPageBtn = buttons.nth(0);  // << first
  const prevBtn = buttons.nth(1);       // <
  const page1 = buttons.nth(2);
  const page2 = buttons.nth(3);
  const nextBtn = buttons.nth(4);       // >
  const lastPageBtn = buttons.nth(5);   // >>

  // ===============================
  // 🔍 FIRST PAGE VALIDATION
  // ===============================

  console.log('🔍 Validating first page state');

  await expect(firstPageBtn).toBeDisabled();
  await expect(prevBtn).toBeDisabled();
  await expect(page1).toBeDisabled();

  console.log('✅ First page buttons disabled correctly');

  const cards = page.locator('div.border-2.border-gray-300');
  const firstPageData = await cards.first().innerText();

  console.log('📦 First page data:', firstPageData);

  // ===============================
  // ➡️ GO TO NEXT PAGE (Page 2)
  // ===============================

  console.log('➡️ Navigating to Page 2');

  await page2.click();
  await page.waitForLoadState('networkidle');

  const secondPageData = await cards.first().innerText();
  console.log('📦 Page 2 data:', secondPageData);

  expect(secondPageData).not.toBe(firstPageData);

  console.log('✅ Page navigation to Page 2 successful');

  // ===============================
  // ⬅️ GO BACK USING PREV
  // ===============================

  console.log('⬅️ Navigating back using Previous');

  await prevBtn.click();
  await page.waitForLoadState('networkidle');

  const backData = await cards.first().innerText();
  console.log('📦 Back to Page 1 data:', backData);

  expect(backData).toBe(firstPageData);

  console.log('✅ Previous navigation works correctly');

  // ===============================
  // ⏩ GO TO LAST PAGE
  // ===============================

  console.log('⏩ Navigating to last page');

  if (await lastPageBtn.isEnabled()) {
    await lastPageBtn.click();
    await page.waitForLoadState('networkidle');

    console.log('📄 Moved to last page');

    await expect(lastPageBtn).toBeDisabled();
    await expect(nextBtn).toBeDisabled();

    console.log('✅ Last page reached and next buttons disabled');
  } else {
    console.log('⚠️ Only one page available (last button disabled)');
  }

  // ===============================
  // 🔁 RETURN TO FIRST PAGE
  // ===============================

  console.log('🔁 Returning to first page');

  if (await firstPageBtn.isEnabled()) {
    await firstPageBtn.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Returned to first page');
  }

  console.log('🎉 Pagination validation completed');
};
await validateAdvancedPagination();

// ===============================
// Enrollment Functionality
// ===============================

console.log('🚀 Starting Enrollment Functionality Tests');

// ===============================
// ✅ SELF ENROLL FLOW
// ===============================
console.log('🔹 Self Enroll Flow - Course 01');

await searchCourse('Self Enroll 01');
console.log('🔍 Searched: Self Enroll 01');

await clickEnrollFromCard('Test Course - Self Enroll 01');
console.log('🖱️ Clicked Enroll on Course 01');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Navigated to My Courses');

// ===============================
// ✅ COURSE DETAIL PAGE
// ===============================
console.log('🔹 Navigating to Course Detail Page');

await catalogTab.click();

await searchCourse('Self Enroll 02');
console.log('🔍 Searched: Self Enroll 02');

await clickCourse('Test Course - Self Enroll 02');
console.log('🖱️ Opened Course Detail Page');

await expect(page).toHaveURL(/courses\/reg_/i);
console.log('✅ Course detail URL validated');

// title
await expect(page.locator('p.text-2xl.font-semibold'))
  .toHaveText('Test Course - Self Enroll 02');
console.log('✅ Course title validated');

const previewBtn = page.getByRole('button', { name: /preview/i });
const enrollBtn = page.getByRole('button', { name: /^enroll$/i });

await expect(previewBtn).toBeVisible();
await expect(enrollBtn).toBeVisible();
console.log('👀 Preview & Enroll buttons visible');

// ===============================
// 📌 RIGHT PANEL
// ===============================
console.log('📊 Validating Right Panel');

await expect(getRightPanelValue('Course ID')).toHaveText('reg_09');
await expect(getRightPanelValue('Type')).toHaveText('Web');
await expect(getRightPanelValue('Approval required to enroll')).toHaveText('No');

console.log('✅ Right panel values validated');

// ===============================
// 👀 PREVIEW WINDOW
// ===============================
console.log('👀 Opening Preview Window');

const [previewPage] = await Promise.all([
  page.waitForEvent('popup'),
  previewBtn.click()
]);

await previewPage.waitForLoadState();
console.log('✅ Preview loaded');

await previewPage.close();
console.log('❌ Preview window closed');

// ===============================
// ✅ ENROLL FROM DETAIL PAGE
// ===============================
console.log('🖱️ Clicking Enroll from Detail Page');

await enrollBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success from detail page');

const unenrollBtn = page.getByRole('button', { name: /unenroll/i });
await expect(unenrollBtn).toBeVisible();
console.log('🔁 Unenroll button visible');

// ===============================
// 🔄 LIST VIEW + ENROLL
// ===============================
console.log('🔹 List View Enrollment');

await catalogTab.first().click();
await listViewBtn.click();

console.log('📋 Switched to List View');

await searchCourse('Self Enroll 03');
console.log('🔍 Searched: Self Enroll 03');

await enrollBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success from List View');

await expect(page).toHaveURL(/myCourses/i);

// ===============================
// 🔐 ACCESS CODE FLOW (01)
// ===============================
console.log('🔐 Access Code Flow 01 - Start');

await catalogTab.click();
console.log('📂 Navigated to Catalog');

await searchCourse('Access code 01');
console.log('🔍 Searched: Access code 01');

await clickEnrollFromCard('Test Course - Self Enroll - Access code 01');
console.log('🖱️ Clicked Enroll (Access Code Course 01)');

const modal = page.locator('div.tw-max-w-screen-modal-sm');
const input = modal.locator('input[type="text"]');
const okBtn = modal.getByRole('button', { name: /ok/i });

await expect(modal).toBeVisible();
console.log('📦 Access Code modal opened');

// invalid
console.log('❌ Testing invalid access code');

await input.fill('123');
console.log('⌨️ Entered invalid code: 123');

await okBtn.click();
console.log('🖱️ Clicked OK with invalid code');

await expect(page.locator('text=Invalid self reg access code')).toBeVisible();
console.log('⚠️ Invalid access code error displayed');

// valid
console.log('✅ Testing valid access code');

await clickEnrollFromCard('Test Course - Self Enroll - Access code 01');
console.log('🖱️ Re-clicked Enroll');

await input.fill('1234');
console.log('⌨️ Entered valid code: 1234');

await okBtn.click();
console.log('🖱️ Clicked OK with valid code');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses page');


// ===============================
// 🔐 ACCESS CODE FLOW (02 - DETAIL PAGE)
// ===============================
console.log('🔐 Access Code Flow 02 - Detail Page - Start');

await catalogTab.click();
console.log('📂 Navigated to Catalog');

await searchCourse('Access code 02');
console.log('🔍 Searched: Access code 02');

await clickCourse('Test Course - Self Enroll - Access code 02');
console.log('🖱️ Opened Course Detail Page');

await expect(page).toHaveURL(/courses\/reg_/i);
console.log('✅ Course detail URL validated');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll button');

// cancel
console.log('❌ Cancel access code modal');
await modal.getByRole('button', { name: /cancel/i }).click();

// invalid
console.log('❌ Invalid code attempt');

await enrollBtn.click();
console.log('🖱️ Re-clicked Enroll');

await input.fill('123');
console.log('⌨️ Entered invalid code: 123');

await okBtn.click();
console.log('🖱️ Clicked OK with invalid code');

await expect(page.locator('text=Invalid self reg access code')).toBeVisible();
console.log('⚠️ Invalid access code error displayed');

// valid
console.log('✅ Valid code attempt');

await enrollBtn.click();
console.log('🖱️ Re-clicked Enroll');

await input.fill('1234');
console.log('⌨️ Entered valid code: 1234');

await okBtn.click();
console.log('🖱️ Clicked OK with valid code');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses page');


// ===============================
// 🔐 List View - ACCESS CODE FLOW (03)
// ===============================
console.log('🔐 Access Code Flow 03 - List View - Start');

await catalogTab.first().click();
console.log('📂 Navigated to Catalog');

await listViewBtn.click();
console.log('📋 Switched to List View');

await searchCourse('Access code 03');
console.log('🔍 Searched: Access code 03');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll button');

await input.fill('1234');
console.log('⌨️ Entered valid code: 1234');

await okBtn.click();
console.log('🖱️ Clicked OK');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses page');

console.log('✅ All Access Code Flows Completed Successfully');
// ===============================
// ✅ SELF ENROLL FLOW - Approval request 01
// ===============================
console.log('🟡 Approval Flow 01 - Start');

await catalogTab.click();
console.log('📂 Navigated to Catalog');

await searchCourse('Instructor approval 01');
console.log('🔍 Searched: Instructor approval 01');

await clickEnrollFromCard('Test Course - Self Enroll - Instructor Approval 01');
console.log('🖱️ Clicked Enroll (Approval Required Course 01)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('📩 Approval message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🌐 Redirected to Courses page after request');

await page.waitForTimeout(2000);

await searchCourse('Instructor approval 01');
console.log('🔍 Re-searched to validate approval status');

const validateWaitingForApproval = async (courseName: string) => {
  console.log(`🔎 Validating Waiting for Approval for: ${courseName}`);

  const courseCard = page.locator('div.border-2.border-gray-300').filter({
    hasText: courseName
  });

  const waitingText = courseCard.locator('text=Waiting for Approval');

  await expect(waitingText).toBeVisible({ timeout: 10000 });

  console.log('⏳ Waiting for Approval status verified');
};

await validateWaitingForApproval('Test Course - Self Enroll - Instructor Approval 01');


// ===============================
// ✅ SELF ENROLL FLOW - Approval request 02
// ===============================
console.log('🟡 Approval Flow 02 - Start');

await clearBtn.click();
console.log('🧹 Cleared previous search/filter');

await searchCourse('Instructor Approval 02');
console.log('🔍 Searched: Instructor Approval 02');

await clickCourse('Test Course - Self Enroll - Instructor Approval 02');
console.log('🖱️ Opened Course Detail Page');

await expect(page).toHaveURL(/courses\/reg_/i);
console.log('✅ Course detail URL validated');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll (Approval Required Course 02)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('📩 Approval request message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🌐 Redirected to Courses page');

await searchCourse('Instructor approval 02');
console.log('🔍 Re-searched for validation');

await validateWaitingForApproval('Test Course - Self Enroll - Instructor Approval 02');


// ===============================
// ✅ SELF ENROLL FLOW - Approval request 03
// ===============================
console.log('🟡 Approval Flow 03 - Start');

await listViewBtn.click();
console.log('📋 Switched to List View');

await searchCourse('Instructor Approval 03');
console.log('🔍 Searched: Instructor Approval 03');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll (Approval Required Course 03)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('📩 Approval request message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🌐 Redirected to Courses page');

await page.waitForTimeout(2000);

console.log('✅ Approval Flow Completed for all scenarios');

// ===============================
// ✅ SELF ENROLL FLOW - Due Date
// ===============================
console.log('📅 Due Date Flow - Start');

await searchCourse('Due Date');
console.log('🔍 Searched: Due Date');

await clickEnrollFromCard('Test Course - Self Enroll - Due Date');
console.log('🖱️ Clicked Enroll on Due Date course');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses page');

await searchCourse('Due Date');
console.log('🔍 Re-searched Due Date course for validation');

const courseCard = page.locator('div.border-2.border-gray-300').filter({
  hasText: 'Test Course - Self enroll - Due Date'
});

const dueBadge = courseCard.locator('span.absolute.right-0.top-0');

await expect(dueBadge).toBeVisible();
console.log('🏷️ Due badge is visible on course card');

const dueDateSection1 = courseCard.locator('dl');

await expect(dueDateSection1.locator('text=Due Date')).toBeVisible();
console.log('📌 Due Date label visible in card');

const dueDateValue1 = dueDateSection1.locator('dd').first();

await expect(dueDateValue1).not.toHaveText('--');
console.log('📅 Due Date value is present in card');

await clickCourse('Test Course - Self Enroll - Due Date');
console.log('🖱️ Navigated to Course Detail Page');

const dueDateSection = page.locator('dl');

// validate label
await expect(dueDateSection.locator('text=Due Date')).toBeVisible();
console.log('📌 Due Date label visible in detail page');

// validate value
const dueDateValue = dueDateSection.locator('dd').first();

await expect(dueDateValue).toBeVisible();
console.log('📅 Due Date value visible in detail page');

await expect(dueDateValue).not.toHaveText('--');
console.log('✅ Due Date value is valid (not empty)');

console.log('✅ Due Date Flow Completed Successfully');

// ===============================
// ✅ SELF ENROLL FLOW - Expiry Date
// ===============================
console.log('⏳ Expiry Date Flow - Start');

await catalogTab.click();
console.log('📂 Navigated to Catalog');

await searchCourse('Expiry date');
console.log('🔍 Searched: Expiry date');

await clickEnrollFromCard('Test Course - Self Enroll - Expiry date');
console.log('🖱️ Clicked Enroll on Expiry Date course');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses page');

await searchCourse('Expiry date');
console.log('🔍 Re-searched Expiry date for validation');

await clickCourse('Test Course - Self Enroll - Expiry date');
console.log('🖱️ Navigated to Course Detail Page');

const accessExpiryValue = page.locator('div.grid.grid-cols-2', {
  has: page.locator('span.text-gray-500', {
    hasText: 'Access expires after'
  })
}).locator('span.text-gray-800');

await expect(accessExpiryValue).toBeVisible();
console.log('👀 Access expiry value is visible');

await expect(accessExpiryValue).not.toHaveText('--');
console.log('✅ Access expiry value is valid (not empty)');

console.log('✅ Expiry Date Flow Completed Successfully');

// ===============================
// ✅ SELF ENROLL FLOW - Prerequisites Flow
// ===============================
console.log('🔗 Prerequisites Flow - Start');

await catalogTab.click();
console.log('📂 Navigated to Catalog');

await searchCourse('Prerequisites');
console.log('🔍 Searched: Prerequisites');

await clickEnrollFromCard('Test Course - Self Enroll - Prerequisites');
console.log('🖱️ Clicked Enroll on Prerequisites course');

const prereqError = page.locator('text=Prerequisite(s) have not been enrolled');

await expect(prereqError).toBeVisible();
console.log('⚠️ Prerequisite error displayed (Grid View)');

await listViewBtn.click();
console.log('📋 Switched to List View');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll in List View');

await expect(prereqError).toBeVisible();
console.log('⚠️ Prerequisite error displayed (List View)');

await gridViewBtn.waitFor({ state: 'visible' });
await gridViewBtn.click();
console.log('🔲 Switched back to Grid View');

await clickCourse('Test Course - Self Enroll - Prerequisites');
console.log('🖱️ Opened Course Detail Page');

await expect(page).toHaveURL(/courses\/reg_/i);
console.log('✅ Course detail URL validated');

await clickEnrollFromCard('Test Course - Self Enroll - Prerequisites');
console.log('🖱️ Attempted enroll again from detail page');

await expect(prereqError).toBeVisible();
console.log('⚠️ Prerequisite error still shown');

const prereqLink = page.locator('div.grid.grid-cols-2', {
  has: page.locator('span.text-gray-500', {
    hasText: 'Prerequisite Course(s)'
  })
}).locator('a');

await expect(prereqLink).toBeVisible();
console.log('🔗 Prerequisite course link visible');

await prereqLink.click();
console.log('🖱️ Clicked prerequisite course link');

await enrollBtn.click();
console.log('🖱️ Enrolled in prerequisite course');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses after prerequisite enrollment');

const contentLink = page.locator('td a', {
  hasText: 'Image'
});

await expect(contentLink).toBeVisible();
console.log('📄 Content link (Image) visible');

const [newPage] = await Promise.all([
  page.waitForEvent('popup'),
  contentLink.click()
]);

console.log('🆕 Opened content in new tab');

await newPage.waitForLoadState();
console.log('⏳ New page loaded');

await newPage.close();
console.log('❌ Closed content tab');

const row = page.locator('tbody tr').filter({
  has: page.locator('td a', { hasText: 'Image' })
});

const statusCell = row.locator('td').nth(2);

await expect(statusCell).toBeVisible();
console.log('👀 Status cell visible');

await expect(statusCell).toHaveText('Completed');
console.log('✅ Prerequisite course marked as Completed');

await catalogTab.click();
console.log('📂 Navigated back to Catalog');

await searchCourse('Prerequisites');
console.log('🔍 Re-searched Prerequisites course');

await clickEnrollFromCard('Test Course - Self Enroll - Prerequisites');
console.log('🖱️ Attempting final enrollment');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('🎉 Final enrollment successful');

await expect(page).toHaveURL(/myCourses/i);
console.log('🌐 Redirected to My Courses');

console.log('✅ Prerequisites Flow Completed Successfully');
// ===============================
// ✅ SELF ENROLL FLOW - Curriculum
// ===============================
console.log('🎯 Curriculum Self Enroll Flow - Start');

await catalogTab.click();
console.log('➡️ Navigated to Catalog');

await searchCourse('Self Enroll 001');
console.log('🔍 Searching Curriculum: Self Enroll 001');

await clickEnrollFromCurriculumCard('Test Curriculum - Self Enroll 001');
console.log('🖱️ Clicked Enroll on Curriculum Card');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await page.waitForTimeout(2000);
await expect(page).toHaveURL(/myCourses/);
console.log('🔗 Redirected to My Courses after enrollment');

// ===============================
// ✅ COURSE DETAIL PAGE
// ===============================
console.log('📄 Navigating to Curriculum Detail Page');

await catalogTab.click();

await searchCourse('Self Enroll 002');
console.log('🔍 Searching Curriculum: Self Enroll 002');

await clickCurriculum('Test Curriculum - Self Enroll 002');
console.log('🖱️ Opened Curriculum Detail Page');

await expect(page).toHaveURL(/courses\/curriculum\/regcurr002/i);
console.log('✅ URL validation passed for curriculum detail page');

// title
const curriculumTitle = page.locator('p.text-2xl.font-semibold').first();

await expect(curriculumTitle).toHaveText('Test Curriculum - Self Enroll 002');
console.log('📌 Curriculum title validated');

await expect(enrollBtn).toBeVisible();
console.log('👁️ Enroll button visible on detail page');

// ===============================
// 📌 RIGHT PANEL
// ===============================
console.log('📊 Validating right panel details');

await expect(getRightPanelValue('Curriculum ID')).toHaveText('regcurr002');
console.log('🆔 Curriculum ID validated');

await expect(getRightPanelValue('Approval required to enroll')).toHaveText('No');
console.log('✅ Approval requirement validated (No)');

// ===============================
// ✅ ENROLL FROM DETAIL PAGE
// ===============================
console.log('🖱️ Clicking Enroll from detail page');

await enrollBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success from detail page');

await expect(page).toHaveURL(/myCourses/);
console.log('🔗 Redirected to My Courses after enrollment');

// ===============================
// 🔄 LIST VIEW + ENROLL
// ===============================
console.log('🔄 Switching to List View for enrollment');

await catalogTab.first().click();
await listViewBtn.click();

await searchCourse('Self Enroll 003');
console.log('🔍 Searching Curriculum: Self Enroll 003');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll in List View');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success from list view');

await expect(page).toHaveURL(/myCourses/i);
console.log('🔗 Redirected to My Courses after list view enrollment');

await page.waitForTimeout(2000);
console.log('⏱️ Wait completed for stabilization');

console.log('🎉 Curriculum Self Enroll Flow Completed');
// ===============================
// 🔐 ACCESS CODE FLOW (01)
// ===============================
console.log('🔐 Curriculum Access Code Flow 01 - Start');

await catalogTab.click();
console.log('➡️ Navigated to Catalog');

await searchCourse('Access code 001');
console.log('🔍 Searching Curriculum: Access code 001');

await clickEnrollFromCurriculumCard('Test Curriculum - Self Enroll - Access Code 001');
console.log('🖱️ Clicked Enroll (Access Code 001)');

await expect(modal).toBeVisible();
console.log('📦 Access Code modal is visible');

// invalid
console.log('❌ Testing INVALID access code');

await input.fill('123');
await okBtn.click();

await expect(page.locator('text=Invalid self reg access code')).toBeVisible();
console.log('⚠️ Invalid access code validation message displayed');

// valid
console.log('✅ Testing VALID access code');

await clickEnrollFromCurriculumCard('Test Curriculum - Self Enroll - Access Code 001');

await input.fill('1234');
await okBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🔗 Redirected to My Courses after successful enrollment');


// ===============================
// 🔐 ACCESS CODE FLOW (02 - DETAIL PAGE)
// ===============================
console.log('🔐 Curriculum Access Code Flow 02 - Detail Page');

await catalogTab.click();
console.log('➡️ Navigated to Catalog');

await searchCourse('Access code 002');
console.log('🔍 Searching Curriculum: Access code 002');

await clickCurriculum('Test Curriculum - Self Enroll - Access Code 002');
console.log('🖱️ Opened Curriculum Detail Page');

await expect(page).toHaveURL(/courses\/curriculum\/regcurr005/i);
console.log('✅ URL validated for curriculum detail page');

// title
await expect(curriculumTitle).toHaveText('Test Curriculum - Self Enroll - Access Code 002');
console.log('📌 Curriculum title validated');

await expect(enrollBtn).toBeVisible();
console.log('👁️ Enroll button visible');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll button');

// cancel
console.log('❌ Cancelling access code modal');
await modal.getByRole('button', { name: /cancel/i }).click();

// invalid
console.log('❌ Testing INVALID code in detail page');

await enrollBtn.click();
await input.fill('123');
await okBtn.click();

await expect(page.locator('text=Invalid self reg access code')).toBeVisible();
console.log('⚠️ Invalid access code message displayed');

// valid
console.log('✅ Testing VALID code in detail page');

await enrollBtn.click();
await input.fill('1234');
await okBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🔗 Redirected to My Courses');


// ===============================
// 🔐 List View - ACCESS CODE FLOW (03)
// ===============================
console.log('🔐 Curriculum Access Code Flow 03 - List View');

await catalogTab.first().click();
console.log('➡️ Navigated to Catalog (List View)');

await listViewBtn.click();
console.log('🔄 Switched to List View');

await searchCourse('Access code 003');
console.log('🔍 Searching Curriculum: Access code 003');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll in List View');

await input.fill('1234');
console.log('⌨️ Entered valid access code');

await okBtn.click();

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🔗 Redirected to My Courses');

await page.waitForTimeout(2000);
console.log('⏱️ Wait completed for stabilization');

console.log('🎉 All Curriculum Access Code Flows Completed');

// ===============================
// ✅ SELF ENROLL FLOW - Approval request 01
// ===============================
console.log('🟡 Curriculum Approval Flow 01 - Start');

await catalogTab.click();
console.log('➡️ Navigated to Catalog');

await searchCourse('Instructor approval 001');
console.log('🔍 Searching Curriculum: Instructor approval 001');

await clickEnrollFromCurriculumCard('Test Curriculum - Self Enroll - Instructor Approval 001');
console.log('🖱️ Clicked Enroll (Approval required)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('⏳ Approval request message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🔗 Stayed on Courses page after approval request');

await page.waitForTimeout(2000);

await searchCourse('Instructor approval 001');
console.log('🔍 Re-searching to validate approval status');

const validateWaitingForApprovalcurr = async (curriculumName: string) => {
  console.log(`🔎 Validating "Waiting for Approval" for: ${curriculumName}`);

  const currCard = page.locator('div.border-2.border-gray-300').filter({
    hasText: curriculumName
  });

  const waitingText = currCard.locator('text=Waiting for Approval');

  await expect(waitingText).toBeVisible({ timeout: 10000 });

  console.log('✅ "Waiting for Approval" status is visible');
};

await validateWaitingForApprovalcurr('Test Curriculum - Self Enroll - Instructor Approval 001');


// ===============================
// ✅ SELF ENROLL FLOW - Approval request 02
// ===============================
console.log('🟡 Curriculum Approval Flow 02 - Detail Page');

await clearBtn.click();
console.log('🧹 Cleared filters');

await searchCourse('Instructor Approval 002');
console.log('🔍 Searching Curriculum: Instructor Approval 002');

await clickCurriculum('Test Curriculum - Self Enroll - Instructor Approval 002');
console.log('🖱️ Opened Curriculum Detail Page');

await expect(page).toHaveURL(/courses\/curriculum\/regcurr008/i);
console.log('✅ URL validated for curriculum detail page');

// title
await expect(page.locator('p.text-2xl.font-semibold'))
  .toHaveText('Test Curriculum - Self Enroll - Instructor Approval 002');
console.log('📌 Curriculum title validated');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll (Approval required)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('⏳ Approval request message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🔗 Stayed on Courses page after approval request');

await searchCourse('Instructor approval 002');
console.log('🔍 Re-searching to validate approval status');

await validateWaitingForApprovalcurr('Test Curriculum - Self Enroll - Instructor Approval 002');


// ===============================
// ✅ SELF ENROLL FLOW - Approval request 03
// ===============================
console.log('🟡 Curriculum Approval Flow 03 - List View');

await listViewBtn.click();
console.log('🔄 Switched to List View');

await searchCourse('Instructor Approval 003');
console.log('🔍 Searching Curriculum: Instructor Approval 003');

await enrollBtn.click();
console.log('🖱️ Clicked Enroll (Approval required)');

await expect(approvalMsg).toBeVisible({ timeout: 10000 });
console.log('⏳ Approval request message displayed');

await expect(page).toHaveURL(/Courses/i);
console.log('🔗 Stayed on Courses page after approval request');

await page.waitForTimeout(3000);
console.log('⏱️ Wait completed for stabilization');

console.log('🎉 All Curriculum Approval Flows Completed');

// ===============================
// ✅ SELF ENROLL FLOW - Expiration Date
// ===============================
console.log('📅 Curriculum Expiration Date Flow - Start');

await searchCourse('Expiration Date');
console.log('🔍 Searching Curriculum: Expiration Date');

await clickEnrollFromCurriculumCard('Test Curriculum - Self Enroll - Expiration Date');
console.log('🖱️ Clicked Enroll for Expiration Date curriculum');

await expect(successMsg).toBeVisible({ timeout: 10000 });
console.log('✅ Enrollment success message displayed');

await expect(page).toHaveURL(/myCourses/i);
console.log('🔗 Redirected to My Courses');

await searchCourse('Expiration Date');
console.log('🔍 Re-searching Curriculum for validation');

await page.waitForLoadState('networkidle');
console.log('⏳ Page reached network idle state');

const curriculumLink = page.locator('p.text-base a', {
  hasText: /Expiration Date/i
}).first();

await expect(curriculumLink).toBeVisible();
console.log('👁️ Curriculum link is visible');

await curriculumLink.click();
console.log('🖱️ Opened Curriculum Detail Page');

await expect(page).toHaveURL(/curriculum\/regcurr/i);
console.log('✅ Navigated to curriculum detail page');

const getCurriculumDetailValue = (label: string) => {
  return page.locator('div.flex.flex-col.flex-wrap.w-full.lg\\:w-1\\/4')
    .locator('div.grid.grid-cols-2', {
      has: page.locator('span.text-gray-500', { hasText: label })
    })
    .locator('span.text-gray-800');
};

const rightPanel = page.locator('div.flex.flex-col.flex-wrap.w-full.lg\\:w-1\\/4');

await expect(rightPanel.getByText('Curriculum Details')).toBeVisible();
console.log('📊 Right panel "Curriculum Details" is visible');

await expect(getCurriculumDetailValue('Student Must Complete In'))
  .toHaveText(/8 Day\(s\)/);
console.log('📅 "Student Must Complete In" value validated');

const durationText = await getCurriculumDetailValue('Student Must Complete In').textContent();
console.log('📌 Duration text:', durationText);

const days = parseInt(durationText || '0');
console.log('🔢 Parsed days:', days);

const expectedDate = new Date();
expectedDate.setDate(expectedDate.getDate() + days);

const expectedFormatted = expectedDate.toISOString().split('T')[0];
console.log('📆 Expected Expiration Date:', expectedFormatted);

const actualExpiration = await getCurriculumDetailValue('Expiration Date').textContent();
console.log('📆 Actual Expiration Date from UI:', actualExpiration);

expect(actualExpiration?.trim()).toBe(expectedFormatted);
console.log('✅ Expiration date validation passed');

console.log('🎉 Curriculum Expiration Date Flow Completed');

console.log('🏁 Test Completed Successfully');
});