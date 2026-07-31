const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('[RAP Script] Launching browser...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  
  // Set viewport to a nice standard desktop size
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Visit landing page (Empty state, Dark theme)
  console.log('[RAP Script] Visiting http://localhost:3000/...');
  await page.goto('http://localhost:3000/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/');
  
  await page.waitForTimeout(1000);
  console.log('[RAP Script] Capturing 01_landing_empty_dark.png...');
  await page.screenshot({ path: 'rap/screenshots/01_landing_empty_dark.png', fullPage: true });

  // 3. Select Goal
  console.log('[RAP Script] Selecting Investment Goal...');
  await page.click('text=↗ Growth');
  await page.click('text=3–7 years');

  // 4. Add first asset (ABB)
  console.log('[RAP Script] Adding first asset: ABB...');
  const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
  const valueInput = page.locator('input[placeholder="50000"]');

  await searchInput.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await searchInput.pressSequentially('ABB', { delay: 100 });

  const abbItem = page.locator('.result-item-enhanced', { hasText: 'ABB' }).first();
  await abbItem.waitFor({ state: 'visible' });
  await abbItem.click();
  await valueInput.click();
  await valueInput.fill('100000');
  await page.click('button:has-text("ADD")');

  // Wait for clarity report calculation to settle
  await page.waitForSelector('.status-bar.has-result', { timeout: 10000 });

  // 5. Add second asset (ACC)
  console.log('[RAP Script] Adding second asset: ACC...');
  await searchInput.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await searchInput.pressSequentially('ACC', { delay: 100 });

  const accItem = page.locator('.result-item-enhanced', { hasText: 'ACC' }).first();
  await accItem.waitFor({ state: 'visible' });
  await accItem.click();
  await valueInput.click();
  await valueInput.fill('150000');
  await page.click('button:has-text("ADD")');

  // Wait for calculation to settle
  await page.waitForTimeout(2000);
  console.log('[RAP Script] Capturing 03_dashboard_filled.png...');
  await page.screenshot({ path: 'rap/screenshots/03_dashboard_filled.png', fullPage: true });

  // 6. Open Methodology Drawer
  console.log('[RAP Script] Opening Methodology Drawer...');
  await page.click('text=Learn methodology ↗');
  await page.waitForTimeout(500);
  console.log('[RAP Script] Capturing 04_methodology_drawer.png...');
  await page.screenshot({ path: 'rap/screenshots/04_methodology_drawer.png' });

  // Close Methodology Drawer
  await page.click('.card-drawer-close');
  await page.waitForTimeout(500);

  // 7. Open Top Concentration Driver Drawer
  console.log('[RAP Script] Opening Top Concentration Driver Drawer...');
  await page.locator('.metric-card').nth(2).click(); // Top Driver is the 3rd card
  await page.waitForTimeout(1000);
  console.log('[RAP Script] Capturing 05_concentration_drawer.png...');
  await page.screenshot({ path: 'rap/screenshots/05_concentration_drawer.png' });

  // Close Drawer
  await page.click('.card-drawer-close');
  await page.waitForTimeout(500);

  // 8. Open What-If sandbox mode
  console.log('[RAP Script] Toggling What-If mode...');
  await page.click('text=WHAT-IF');
  await page.waitForTimeout(500);
  
  // Fill hypothetical asset AARTIIND
  console.log('[RAP Script] Adding hypothetical trade: AARTIIND...');
  await searchInput.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await searchInput.pressSequentially('AARTIIND', { delay: 100 });

  const aartiItem = page.locator('.result-item-enhanced', { hasText: 'AARTIIND' }).first();
  await aartiItem.waitFor({ state: 'visible' });
  await aartiItem.click();
  await valueInput.click();
  await valueInput.fill('50000');

  await page.waitForTimeout(2000); // Wait for simulation recalculation
  console.log('[RAP Script] Capturing 06_what_if_sandbox.png...');
  await page.screenshot({ path: 'rap/screenshots/06_what_if_sandbox.png', fullPage: true });

  // Click Reset
  console.log('[RAP Script] Clicking Reset...');
  await page.click('text=RESET');
  await page.waitForTimeout(1000);
  console.log('[RAP Script] Capturing 07_reset_empty.png...');
  await page.screenshot({ path: 'rap/screenshots/07_reset_empty.png', fullPage: true });

  console.log('[RAP Script] Closing browser...');
  await browser.close();
  console.log('[RAP Script] Done!');
})();
