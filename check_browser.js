import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to http://localhost:5177/...');
  await page.goto('http://localhost:5177/');
  await page.waitForTimeout(3000);

  // Set the search term to 'Emily' to test row highlighting
  console.log('Searching for "Emily" to test highlight...');
  const searchInput = page.locator('.search-input');
  await searchInput.fill('Emily');
  await page.waitForTimeout(500);

  console.log('Clicking "Group Tables" button...');
  const btn = page.locator('button:has-text("Group Tables")');
  await btn.click();
  await page.waitForTimeout(1000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: '/Users/domhoney/Antigravity/honey-wc2026-sweep/drawer_screenshot_enhanced.png' });

  await browser.close();
}

run().catch(err => console.error('Playwright script error:', err));
