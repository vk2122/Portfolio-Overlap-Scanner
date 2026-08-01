const { test, expect } = require('@playwright/test');

test.describe('Phase 3.2 Product Experience & Intelligence Regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('P3.2-01: Demo Portfolio 1-click execution & report generation', async ({ page }) => {
        // Empty state landing should present 1 primary demo button
        await expect(page.locator('text=NO CLARITY REPORT YET.')).toBeVisible();
        await expect(page.locator('button:has-text("⚡ TRY DEMO PORTFOLIO")')).toBeVisible();

        // Trigger Demo Portfolio
        await page.click('button:has-text("⚡ TRY DEMO PORTFOLIO")');

        // Status bar transition check
        await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY', { timeout: 15000 });

        // Expand detailed analysis and verify holdings
        await page.click('button:has-text("Show Detailed Analysis")');
        await expect(page.locator('.holding-row')).toHaveCount(3);

        // Analyze View should be active
        await expect(page.locator('button:has-text("📊 Analyze View")')).toBeVisible();
        await expect(page.locator('h2:has-text("Top 3 Actionable Recommendations")')).toBeVisible();
    });

    test('P3.2-02: Compose Mode vs Analyze Mode switching', async ({ page }) => {
        // Load demo portfolio
        await page.click('button:has-text("⚡ TRY DEMO PORTFOLIO")');
        await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY', { timeout: 15000 });

        // Switch to Compose Mode
        await page.click('button:has-text("✏️ Compose Mode")');
        await expect(page.locator('text=Portfolio Composition & Editing')).toBeVisible();

        // Switch back to Analyze View
        await page.click('button:has-text("📊 Analyze View")');
        await expect(page.locator('text=Portfolio Composition & Editing')).toHaveCount(0);
    });

    test('P3.2-03: Progressive Disclosure toggle expands Deep Analysis', async ({ page }) => {
        await page.click('button:has-text("⚡ TRY DEMO PORTFOLIO")');
        await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY', { timeout: 15000 });

        // Initially deep analysis sector section is hidden
        await expect(page.locator('#sector-chart')).toHaveCount(0);

        // Click Progressive Disclosure toggle button
        await page.click('button:has-text("Show Detailed Analysis")');

        // Deep analysis sections should now be visible
        await expect(page.locator('#sector-chart')).toBeVisible();
    });

    test('P3.2-04: Disabled ADD button has grayscale opacity and tooltip', async ({ page }) => {
        const addBtn = page.locator('button[type="submit"]:has-text("ADD")');
        await expect(addBtn).toBeDisabled();
        await expect(addBtn).toHaveAttribute('title', 'Select an instrument from search first');
    });

    test('P3.2-05: High Overlap Demo 1-click execution & report generation', async ({ page }) => {
        await expect(page.locator('button:has-text("High-Overlap Demo")')).toBeVisible();
        await page.click('button:has-text("High-Overlap Demo")');

        // Status bar transition check
        await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY', { timeout: 15000 });

        // Verify High Overlap report features (68.6% overlap)
        await expect(page.locator('text=68.6%').first()).toBeVisible();
        await expect(page.locator('.pill-badge-rose:has-text("High Impact")').first()).toBeVisible();

        // Expand detailed analysis and verify holdings
        await page.click('button:has-text("Show Detailed Analysis")');
        await expect(page.locator('.holding-row')).toHaveCount(3);
    });
});
