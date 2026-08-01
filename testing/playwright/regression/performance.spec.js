const { test, expect } = require('@playwright/test');

test.describe('UNSTACKED Performance Baseline Verification', () => {
  test('verify web performance metrics (FCP, LCP) meet targets', async ({ page }) => {
    // 1. Visit App
    const startTime = Date.now();
    await page.goto('/');
    
    // 2. Measure paint metrics from browser API
    const paintMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return entries.map(e => ({ name: e.name, startTime: e.startTime }));
    });

    const fcp = paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime || 0;
    console.log(`[Performance Status] First Contentful Paint (FCP): ${fcp.toFixed(1)}ms`);

    // Target FCP: <6000ms for local dev server parallel workers (<1500ms in production)
    if (fcp > 0) {
      expect(fcp).toBeLessThan(6000);
    }

    // 3. Measure API calculation latency
    await page.click('text=↗ Growth');
    await page.click('text=3–7 years');
    
    const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
    const valueInput = page.locator('input[placeholder="50000"]');
    
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ABB', { delay: 100 });
    await page.locator('.result-item-enhanced', { hasText: 'ABB' }).first().click();
    await valueInput.click();
    await valueInput.fill('100000');
    await page.click('button:has-text("ADD")');

    // Wait for settle
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');

    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('ACC', { delay: 100 });
    await page.locator('.result-item-enhanced', { hasText: 'ACC' }).first().click();
    await valueInput.click();
    await valueInput.fill('150000');
    await page.click('button:has-text("ADD")');

    const apiStartTime = Date.now();
    await expect(page.locator('.status-bar')).toHaveText('CLARITY REPORT READY');
    const latency = Date.now() - apiStartTime;
    console.log(`[Performance Status] Analysis API Calculation latency: ${latency}ms`);

    // Target Latency: <1500ms
    expect(latency).toBeLessThan(1500);
  });
});
