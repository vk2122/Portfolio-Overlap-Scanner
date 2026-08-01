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

    // 3. Portfolio Story check (Reconciled TRUST-001 story title)
    await expect(page.locator('section.details-zone h4').first()).toHaveText(/Low Overlap|Balanced|Elite Diversification/);

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

  test('Phase 2.1 - Scroll Layout: No sticky/fixed collisions in normal flow', async ({ page }) => {
    setupPageMonitoring(page);

    // Hydrate with 2 holdings for a standard report
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?p=ACC:EQUITY:100000,ABB:EQUITY:50000&g=growth:3-7');
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // 1. Holdings zone must NOT have position: sticky
    const holdingsZone = page.locator('#holdings-zone');
    await expect(holdingsZone).toBeVisible();
    const holdingsPosition = await holdingsZone.evaluate(el => window.getComputedStyle(el).position);
    expect(['static', 'relative']).toContain(holdingsPosition);

    // 2. Footer must NOT have position: fixed
    const footer = page.locator('footer.disclaimer-section');
    await expect(footer).toBeVisible();
    const footerPosition = await footer.evaluate(el => window.getComputedStyle(el).position);
    expect(['static', 'relative']).toContain(footerPosition);

    // 3. Main flow must not have horizontal overflow
    const mainFlow = page.locator('.main-flow');
    const hasOverflow = await mainFlow.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(hasOverflow).toBe(false);

    // 4. Footer must be scrollable (not viewport-pinned) — verify it is below the fold
    const footerBox = await footer.boundingBox();
    const mainBox = await mainFlow.boundingBox();
    // Footer's top edge must be at or below the main content's bottom edge
    expect(footerBox.y).toBeGreaterThanOrEqual(mainBox.y + mainBox.height - 5);
  });

  test('Phase 2.1 - Long report (10 holdings) has no layout collisions', async ({ page }) => {
    setupPageMonitoring(page);

    // Hydrate with 10 holdings via URL
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?p=ACC:EQUITY:100000,ABB:EQUITY:50000,TCS:EQUITY:80000,RELIANCE:EQUITY:70000,INFY:EQUITY:60000,HDFCBANK:EQUITY:55000,SBIN:EQUITY:45000,ITC:EQUITY:40000,LT:EQUITY:35000,WIPRO:EQUITY:30000&g=balanced:3-7');
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // Verify all 10 holdings rendered
    await expect(page.locator('.holding-row')).toHaveCount(10);

    // Scroll to the bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Footer must be visible after scrolling to bottom
    const footer = page.locator('footer.disclaimer-section');
    await expect(footer).toBeVisible();

    // No element should have negative bounding box (clipped off-screen)
    const summaryBlock = page.locator('#summary-block');
    if (await summaryBlock.count() > 0) {
      const summaryBox = await summaryBlock.boundingBox();
      expect(summaryBox).not.toBeNull();
      expect(summaryBox.height).toBeGreaterThan(0);
    }
  });
});
