const { test, expect } = require('@playwright/test');
const { setupPageMonitoring } = require('../helpers/monitor');

test.describe('UNSTACKED Smoke Suite', () => {
  test('verify application loads, search autocomplete works, and basic analysis completes', async ({ page }) => {
    const monitor = setupPageMonitoring(page);

    // 1. Launch Application with clean localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await expect(page).toHaveTitle(/UNSTACKED/);

    // Verify empty state is visible
    await expect(page.locator('text=NO CLARITY REPORT YET.')).toBeVisible();

    // 2. Select Goal
    await page.click('text=↗ Growth');
    await page.click('text=3–7 years');

    // 3. Search for ABB stock and add it
    const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ABB', { delay: 100 });
    
    // Wait for autocomplete dropdown item specifically containing ABB
    const abbDropdownItem = page.locator('.result-item-enhanced', { hasText: 'ABB' }).first();
    await expect(abbDropdownItem).toBeVisible();
    await abbDropdownItem.click();

    // Fill value
    const valueInput = page.locator('input[placeholder="50000"]');
    await valueInput.click();
    await valueInput.fill('100000');

    // Click Add
    await page.click('button:has-text("ADD")');

    // Verify holding is listed in holdings list
    await expect(page.locator('.holding-row')).toHaveCount(1);
    await expect(page.locator('.ticker').first()).toHaveText('ABB');

    // Wait for background calculation cycle for 1st asset to complete
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // 4. Add second holding (ACC) to trigger full analysis
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ACC', { delay: 100 });
    
    // Wait for autocomplete dropdown item specifically containing ACC
    const accDropdownItem = page.locator('.result-item-enhanced', { hasText: 'ACC' }).first();
    await expect(accDropdownItem).toBeVisible();
    await accDropdownItem.click();

    await valueInput.click();
    await valueInput.fill('150000');
    await page.click('button:has-text("ADD")');

    // Verify 2 holdings exist
    await expect(page.locator('.holding-row')).toHaveCount(2);

    // 5. Verify analysis completes successfully
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    // Verify no console errors occurred during the flow
    monitor.verifyNoErrors();
  });
});
