const { test, expect } = require('@playwright/test');
const { setupPageMonitoring } = require('../helpers/monitor');

test.describe('UNSTACKED Cumulative Regression Suite', () => {

  test('Phase 1 - Holdings CRUD, URL, and Storage Persistence', async ({ page }) => {
    setupPageMonitoring(page);

    // 1. Launch with clean storage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
    const valueInput = page.locator('input[placeholder="50000"]');

    // Add first holding (ABB, 50000)
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ABB', { delay: 100 });
    const abbItem = page.locator('.result-item-enhanced', { hasText: 'ABB' }).first();
    await expect(abbItem).toBeVisible();
    await abbItem.click();
    await valueInput.click();
    await valueInput.fill('50000');
    await page.click('button:has-text("ADD")');

    // Wait for background calculation cycle for 1st asset to complete
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // Add second holding (ACC, 100000)
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ACC', { delay: 100 });
    const accItem = page.locator('.result-item-enhanced', { hasText: 'ACC' }).first();
    await expect(accItem).toBeVisible();
    await accItem.click();
    await valueInput.click();
    await valueInput.fill('100000');
    await page.click('button:has-text("ADD")');

    // Verify both listed and analysis completes
    await expect(page.locator('.holding-row')).toHaveCount(2);
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // Delete first holding (ABB)
    await page.locator('.holding-row').first().locator('.icon-btn').click();
    await expect(page.locator('.holding-row')).toHaveCount(1);
    await expect(page.locator('.ticker').first()).toHaveText('ACC');

    // Wait for calculations to settle for the remaining 1 asset
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // 2. Storage Persistence check
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ABB', { delay: 100 });
    const abbItem2 = page.locator('.result-item-enhanced', { hasText: 'ABB' }).first();
    await expect(abbItem2).toBeVisible();
    await abbItem2.click();
    await valueInput.click();
    await valueInput.fill('50000');
    await page.click('button:has-text("ADD")');
    await expect(page.locator('.holding-row')).toHaveCount(2);
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // Reload the page and check if holdings are preserved in localStorage
    await page.reload();
    await expect(page.locator('.holding-row')).toHaveCount(2);

    // 3. URL Hydration check
    await page.goto('/?p=ACC:EQUITY:100000,ABB:EQUITY:50000&g=growth:3-7');
    await expect(page.locator('.holding-row')).toHaveCount(2);
    await expect(page.locator('button.pill.active').first()).toHaveText('↗ Growth');
  });

  test('Phase 2 - Trust Indicators, Story, Methodology Drawer, and Scenarios', async ({ page }) => {
    setupPageMonitoring(page);

    // Hydrate with 2 holdings to trigger analysis
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?p=ACC:EQUITY:100000,ABB:EQUITY:50000&g=growth:3-7');
    
    // Verify status bar finished calculation
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // 1. Transparency Badges check
    await expect(page.locator('.provenance-badge.verified').first()).toBeVisible();
    await expect(page.locator('.provenance-badge.estimated').first()).toBeVisible();

    // 2. Confidence Indicator check
    await expect(page.locator('text=Confidence Indicator:')).toBeVisible();
    await expect(page.locator('text=High Confidence (Verified Data)')).toBeVisible();

    // 3. Portfolio Story check
    await expect(page.locator('text=Elite Diversification Active')).toBeVisible();

    // 4. Methodology Drawer check (open and close behavior)
    await page.click('text=Learn methodology ↗');
    await expect(page.locator('.card-drawer-title')).toHaveText('Overlap Calculation Methodology');
    await page.locator('.card-drawer-close').click();
    await expect(page.locator('.card-drawer-title')).toHaveCount(0);

    // 5. Scenarios checklist check
    await expect(page.locator('text=EXPLORE SCENARIOS')).toBeVisible();
    await page.click('.scenario-card');
    await expect(page.locator('.scenario-detail')).toBeVisible();
  });
});
