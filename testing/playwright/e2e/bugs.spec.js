// Production Bugs Regression Tests
// Every production bug should have a corresponding playwright test reproducing and verifying the fix.
const { test, expect } = require('@playwright/test');
const { setupPageMonitoring } = require('../helpers/monitor');

test.describe('Production Bugs regression', () => {

  test('BUG-001: Single holding must produce a visible Clarity Report', async ({ page }) => {
    setupPageMonitoring(page);

    // Start with clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
    const valueInput = page.locator('input[placeholder="50000"]');

    // Add a single holding
    await searchInput.click();
    await searchInput.pressSequentially('ABB', { delay: 100 });
    const abbItem = page.locator('.result-item-enhanced', { hasText: 'ABB' }).first();
    await expect(abbItem).toBeVisible();
    await abbItem.click();
    await valueInput.click();
    await valueInput.fill('50000');
    await page.click('button:has-text("ADD")');

    // Wait for calculation to complete
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // BUG-001 assertion: With 1 holding, the report sections MUST be visible.
    // Before the fix, PortfolioStory and AnalyticsCards were gated behind holdings.length >= 2,
    // creating a dead zone where the status bar said "CLARITY REPORT READY" but nothing was shown.
    await expect(page.locator('#summary-block')).toBeVisible();

    // The empty state text must NOT be visible when a report exists
    await expect(page.locator('text=NO CLARITY REPORT YET')).toHaveCount(0);

    // Export button must be enabled with 1 holding + result
    const exportBtn = page.locator('#export-btn');
    await expect(exportBtn).toBeEnabled();
  });

  test('BUG-002: Scenario cards must display API-backed reason, not hardcoded overlap text', async ({ page }) => {
    setupPageMonitoring(page);

    // Hydrate with 2 unrelated equities — expect 0% overlap but scenarios still generated
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?p=ABB:EQUITY:50000,ACC:EQUITY:100000&g=growth:3-7');

    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // BUG-002 assertion: No scenario card should contain the hardcoded fabricated text
    // "High stock overlap inside" when the actual overlap is 0%.
    // Before the fix, ALL scenario cards displayed this text regardless of scenario type.
    const scenarioCards = page.locator('.scenario-card');
    const scenarioCount = await scenarioCards.count();

    if (scenarioCount > 0) {
      // Verify no scenario card contains the old hardcoded text
      for (let i = 0; i < scenarioCount; i++) {
        const cardText = await scenarioCards.nth(i).textContent();

        // The hardcoded fabrication must not appear
        expect(cardText).not.toContain('High stock overlap inside');

        // The "Reason" section must contain the API-backed reason
        expect(cardText).toMatch(/Reason/);
      }
    }
  });

  test('UI-001: Portfolio Story section must not have content overflow', async ({ page }) => {
    setupPageMonitoring(page);

    // Hydrate with holdings that produce a long story body
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/?p=ABB:EQUITY:50000,ACC:EQUITY:100000&g=growth:3-7');
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // The PortfolioStory section must have word-wrap and overflow-wrap properties
    const storySection = page.locator('section.details-zone.fadeIn').first();
    await expect(storySection).toBeVisible();

    // Verify the section's computed overflow-wrap is 'break-word'
    const overflowWrap = await storySection.evaluate(el => window.getComputedStyle(el).overflowWrap);
    expect(overflowWrap).toBe('break-word');

    // Verify no horizontal overflow — scrollWidth should not exceed clientWidth
    const overflow = await storySection.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
  });
});
