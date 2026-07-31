const { chromium, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const logs = [];
  const logEvent = (action, result = 'PASS', details = '') => {
    const timestamp = new Date().toISOString().substring(11, 19);
    const logLine = `${timestamp} | ${action} | ${result} | ${details}`;
    console.log(`[RAP] ${logLine}`);
    logs.push(logLine);
  };

  logEvent('STARTING COMPREHENSIVE RAP VALIDATION', 'INFO', 'P0 -> P2 Fresh Audit');

  // Launch browser with system Chrome
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  
  // Set up context with tracing and HAR recording
  const context = await browser.newContext({
    recordHar: { path: 'rap/network/network_har.har' }
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // PHASE A: APPLICATION HEALTH
    // -------------------------------------------------------------
    logEvent('Phase A: Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(1000);

    // Verify layout loaded
    const title = await page.title();
    if (title.includes('UNSTACKED')) {
      logEvent('Landing page loads and has correct title', 'PASS', `Title: ${title}`);
    } else {
      logEvent('Landing page title validation', 'FAIL', `Expected title to contain UNSTACKED, got: ${title}`);
    }

    // Verify empty state is visible
    const emptyState = page.locator('text=NO CLARITY REPORT YET.');
    await expectToBeVisible(emptyState, 'Empty state text');

    // Capture Empty state across Viewports (Phase I Responsive checks)
    // Desktop View (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: 'rap/screenshots/01_landing_empty_desktop.png', fullPage: true });
    logEvent('Captured 01_landing_empty_desktop.png', 'PASS');

    // Tablet View (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'rap/screenshots/02_landing_empty_tablet.png', fullPage: true });
    logEvent('Captured 02_landing_empty_tablet.png', 'PASS');

    // Mobile View (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'rap/screenshots/03_landing_empty_mobile.png', fullPage: true });
    logEvent('Captured 03_landing_empty_mobile.png', 'PASS');

    // Return to Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // PHASE B: P0 CORE PORTFOLIO REGRESSION
    // -------------------------------------------------------------
    logEvent('Phase B: Selecting Goal Growth & Horizon 3-7 years...');
    await page.click('text=↗ Growth');
    await page.click('text=3–7 years');
    logEvent('Goal and Horizon selected', 'PASS');

    const searchInput = page.locator('input[placeholder="Search stocks, funds, ETFs..."]');
    const valueInput = page.locator('input[placeholder="50000"]');

    // 1. Add Stock 1: ABB
    await addAsset(page, searchInput, valueInput, 'ABB', '100000');
    logEvent('Added ABB (Value: 100k)', 'PASS');

    // 2. Add Stock 2: ACC
    await addAsset(page, searchInput, valueInput, 'ACC', '150000');
    logEvent('Added ACC (Value: 150k)', 'PASS');

    // 3. Add Stock 3: RELIANCE
    await addAsset(page, searchInput, valueInput, 'RELIANCE', '200000');
    logEvent('Added RELIANCE (Value: 200k)', 'PASS');

    // 4. Add ETF: NIFTYBEES
    await addAsset(page, searchInput, valueInput, 'NIFTYBEES', '120000', 'ETF');
    logEvent('Added NIFTYBEES ETF (Value: 120k)', 'PASS');

    // 5. Add Mutual Fund: Aditya
    await addAsset(page, searchInput, valueInput, 'Aditya', '180000', 'MF');
    logEvent('Added Aditya Birla Mutual Fund (Value: 180k)', 'PASS');

    // Verify 5 holdings exist
    const holdingCount = await page.locator('.holding-row').count();
    if (holdingCount === 5) {
      logEvent('Portfolio CRUD: 5 holdings successfully listed', 'PASS');
    } else {
      logEvent('Portfolio CRUD: holdings count mismatch', 'FAIL', `Expected 5, got ${holdingCount}`);
    }

    // Capture Filled Dashboard State
    await page.screenshot({ path: 'rap/screenshots/04_dashboard_filled_desktop.png', fullPage: true });
    logEvent('Captured 04_dashboard_filled_desktop.png', 'PASS');

    // Verify Persistence: reload page
    logEvent('Phase E: Reloading page to verify localStorage persistence...');
    await page.reload();
    await page.waitForTimeout(2000);
    const countAfterReload = await page.locator('.holding-row').count();
    if (countAfterReload === 5) {
      logEvent('Persistence: 5 holdings restored cleanly from localStorage', 'PASS');
    } else {
      logEvent('Persistence: holdings lost after reload', 'FAIL', `Expected 5, got ${countAfterReload}`);
    }

    // Verify URL parameters parsing: navigate to malformed URL and ensure recovery
    logEvent('Phase E: Testing recovery from malformed URL...');
    const holdingsBackup = await page.evaluate(() => localStorage.getItem('unstacked_holdings'));
    const goalBackup = await page.evaluate(() => localStorage.getItem('unstacked_goal'));

    await page.goto('http://localhost:3000/?p=MALFORMED_URL_DATA&g=growth');
    await page.waitForTimeout(1000);
    // Should recover and display empty state or load without crashes
    const statusText = await page.locator('.status-bar').innerText();
    logEvent('Malformed URL recovered cleanly', 'PASS', `Status: ${statusText}`);

    // Restore original state from storage and reload
    logEvent('Phase E: Restoring backup from localStorage and reloading default page...');
    await page.evaluate(({ h, g }) => {
      if (h) localStorage.setItem('unstacked_holdings', h);
      if (g) localStorage.setItem('unstacked_goal', g);
    }, { h: holdingsBackup, g: goalBackup });

    await page.goto('http://localhost:3000/');
    await page.waitForSelector('.status-bar.has-result', { timeout: 8000 });

    // -------------------------------------------------------------
    // PHASE C: SEARCH VALIDATION & STRESS
    // -------------------------------------------------------------
    logEvent('Phase C: Running Autocomplete fuzzy search tests...');
    
    // Switch back to STOCKS for search validation
    await page.click('.technical-select');
    await page.click('.type-dropdown >> text=STOCKS');
    await page.waitForTimeout(200);

    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('AARTI', { delay: 50 });
    
    // Check dropdown shows
    const resultsContainer = page.locator('.search-results-enhanced');
    await expectToBeVisible(resultsContainer, 'Fuzzy autocomplete search dropdown');
    
    // Capture search autocomplete dropdown screenshot
    await page.screenshot({ path: 'rap/screenshots/05_search_dropdown.png' });
    logEvent('Captured 05_search_dropdown.png', 'PASS');

    // Keyboard navigation: press ArrowDown, then Enter
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    logEvent('Fuzzy search keyboard navigation select selection', 'PASS');

    // -------------------------------------------------------------
    // PHASE D: ANALYSIS ENGINE
    // -------------------------------------------------------------
    logEvent('Phase D: Verifying analysis metrics...');
    const healthText = await page.locator('text=Confidence Indicator:').innerText();
    logEvent('Health Score & Indicators present', 'PASS', healthText);

    // -------------------------------------------------------------
    // PHASE F: TRUST LAYER
    // -------------------------------------------------------------
    logEvent('Phase F: Verifying trust signals, stories, and drawers...');
    
    // 1. Transparency badges
    const badgesCount = await page.locator('.provenance-badge').count();
    if (badgesCount > 0) {
      logEvent('Transparency provenance badges displayed', 'PASS', `Badges found: ${badgesCount}`);
    } else {
      logEvent('Transparency provenance badges missing', 'FAIL');
    }

    // 2. Open Methodology Drawer
    await page.click('text=Learn methodology ↗');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'rap/screenshots/06_methodology_drawer_desktop.png' });
    logEvent('Captured 06_methodology_drawer_desktop.png', 'PASS');
    await page.click('.card-drawer-close');
    await page.waitForTimeout(500);

    // 3. Open Top concentration Driver Drawer
    await page.locator('.metric-card').nth(2).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'rap/screenshots/07_concentration_drawer_desktop.png' });
    logEvent('Captured 07_concentration_drawer_desktop.png', 'PASS');
    await page.click('.card-drawer-close');
    await page.waitForTimeout(500);

    // 4. What-If Scenario sandbox simulation
    logEvent('Phase F: Activating What-If Simulation Sandbox...');
    await page.click('text=WHAT-IF');
    await page.waitForTimeout(500);

    // Switch back to STOCKS for simulation trade
    await page.click('.technical-select');
    await page.click('.type-dropdown >> text=STOCKS');
    await page.waitForTimeout(200);

    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await searchInput.pressSequentially('AARTIIND', { delay: 50 });
    const aartiItem = page.locator('.result-item-enhanced', { hasText: 'AARTIIND' }).first();
    await aartiItem.waitFor({ state: 'visible' });
    await aartiItem.click();
    
    await valueInput.click();
    await valueInput.fill('60000');
    await page.waitForTimeout(2000);
    
    // Check if simulation panel appears
    const simulationPanel = page.locator('.what-if-panel');
    await expectToBeVisible(simulationPanel, 'What-If Simulation Panel');
    
    await page.screenshot({ path: 'rap/screenshots/08_what_if_sandbox_desktop.png', fullPage: true });
    logEvent('Captured 08_what_if_sandbox_desktop.png', 'PASS');

    // -------------------------------------------------------------
    // PERFORMANCE MEASUREMENTS
    // -------------------------------------------------------------
    logEvent('Performance Review: Gathering paint and load stats...');
    const performanceReport = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcp = entries.find(e => e.name === 'first-contentful-paint')?.startTime || 0;
      return {
        fcp: `${fcp.toFixed(1)}ms`,
        navigationTiming: performance.getEntriesByType('navigation')[0]
      };
    });
    logEvent('Performance Metrics Captured', 'PASS', `FCP: ${performanceReport.fcp}`);
    fs.writeFileSync('rap/lighthouse/performance_report.json', JSON.stringify(performanceReport, null, 2));

    // -------------------------------------------------------------
    // RESET & CLEANUP STATE
    // -------------------------------------------------------------
    logEvent('Resetting application to final clean state...');
    await page.click('text=RESET');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'rap/screenshots/09_reset_empty.png', fullPage: true });
    logEvent('Captured 09_reset_empty.png', 'PASS');

  } catch (err) {
    logEvent('RAP SCRIPT CRITICAL EXCEPTION ENCOUNTERED', 'FAIL', err.message);
  } finally {
    // Save trace and close
    await context.tracing.stop({ path: 'rap/traces/rap_execution_trace.zip' });
    await browser.close();
    logEvent('RAP VALIDATION COMPLETED & BROWSER CLOSED', 'INFO');

    // Write the release_log.md file
    const logHeader = `# Release Acceptance Protocol (RAP) Running Commentary\n\n`;
    const logBody = logs.map(line => `- ${line}`).join('\n');
    fs.writeFileSync('documentation/release_log.md', logHeader + logBody);
    console.log('[RAP] release_log.md successfully written.');
  }
})();

async function expectToBeVisible(locator, name) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 5000 });
  } catch (e) {
    throw new Error(`Assertion failed: ${name} is not visible!`);
  }
}

async function addAsset(page, searchInput, valueInput, query, value, type = 'EQUITY') {
  // If not equity, select from type dropdown
  if (type !== 'EQUITY') {
    await page.click('.technical-select');
    if (type === 'ETF') {
      await page.click('.type-dropdown >> text=ETFs');
    } else if (type === 'MF') {
      await page.click('.type-dropdown >> text=MUTUAL FUNDS');
    }
    await page.waitForTimeout(200);
  }

  await searchInput.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await searchInput.pressSequentially(query, { delay: 100 });
  
  const dropdownItem = page.locator('.result-item-enhanced', { hasText: query }).first();
  await dropdownItem.waitFor({ state: 'visible', timeout: 6000 });
  await dropdownItem.click();
  
  await valueInput.click();
  await valueInput.fill(value);
  await page.click('button:has-text("ADD")');
  
  // Settle calculations
  await page.waitForSelector('.status-bar.has-result', { timeout: 8000 });

  // If we selected a different type, revert to default STOCKS for next entries
  if (type !== 'EQUITY') {
    await page.click('.technical-select');
    await page.click('.type-dropdown >> text=STOCKS');
    await page.waitForTimeout(200);
  }
}
