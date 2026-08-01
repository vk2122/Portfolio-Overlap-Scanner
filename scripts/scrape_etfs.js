const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ETFS_FILE = path.join(__dirname, 'frontend/public/data/etfs.json');
const STOCKS_FILE = path.join(__dirname, 'frontend/public/data/stocks.json');

// Load Data
const etfs = JSON.parse(fs.readFileSync(ETFS_FILE, 'utf8'));
const stocks = JSON.parse(fs.readFileSync(STOCKS_FILE, 'utf8'));

// Helper to map Ticker -> ISIN
const tickerToIsinMap = new Map();
stocks.forEach(s => {
    if (s.ticker) tickerToIsinMap.set(s.ticker.toUpperCase(), s.isin);
});

function getIsin(ticker) {
    if (!ticker) return null;
    const t = ticker.toUpperCase().replace('NSE:', '').replace('BSE:', '').trim();
    return tickerToIsinMap.get(t) || t; // Return ISIN or mapped ticker
}

async function scrapeETF(browser, etf) {
    const ticker = etf.ticker;
    const url = `https://in.tradingview.com/symbols/NSE-${ticker}/holdings/`;
    console.log(`Scraping ${ticker} from ${url}...`);

    const page = await browser.newPage();
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for table selector (heuristic)
        // TradingView class names change, but we look for 'Fund composition' or table structure
        // Div class with "tv-widget-watch-list__row" or similar 
        // We might need to inspect the page manually to be sure, but generic approach:

        await page.waitForSelector('div[class*="listRow"]', { timeout: 5000 });

        const holdings = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('div[class*="listRow"]')); // Generalized selector
            return rows.map(row => {
                const tickerEl = row.querySelector('span[class*="symbolNameText"]'); // Heuristic
                const percentEl = row.querySelector('span[class*="cell"][class*="right"]'); // Heuristic

                // Use simple text extraction if classes are obfuscated
                const text = row.innerText.split('\n');
                // Usually: Ticker \n Name \n ... \n Weight%

                // Fallback: look for specific anchors
                const link = row.querySelector('a[href*="/symbols/"]');
                const tickerFromLink = link ? link.href.split('/symbols/')[1].split('/')[0].replace('NSE-', '').replace('BSE-', '') : null;

                // Extract last number which is usually %
                const cells = Array.from(row.querySelectorAll('span'));
                const weightText = cells[cells.length - 1]?.innerText.replace('%', '');

                if (tickerFromLink && !isNaN(parseFloat(weightText))) {
                    return {
                        ticker: tickerFromLink,
                        weight: parseFloat(weightText)
                    };
                }
                return null;
            }).filter(Boolean);
        });

        if (holdings.length > 0) {
            console.log(`  Found ${holdings.length} holdings for ${ticker}`);
            return holdings.map(h => ({
                isin: h.ticker, // Will be resolved later or kept as ticker
                weight: h.weight
            }));
        } else {
            console.log(`  No holdings found for ${ticker} (selector mismatch?)`);
            // Attempt fallback extraction logic
            return [];
        }

    } catch (e) {
        console.error(`  Error scraping ${ticker}: ${e.message}`);
        return [];
    } finally {
        await page.close();
    }
}

async function run() {
    const browser = await puppeteer.launch({ headless: false }); // Headless false to see what happens

    // Process a subset or all
    // For demo, let's look for HEALTHIETF specifically and a few others
    const targets = etfs.filter(e => e.ticker === 'HEALTHIETF' || e.ticker === 'NIFTYBEES' || e.ticker === 'BANKBEES');

    console.log(`Targeting ${targets.length} ETFs for test run...`);

    for (const etf of targets) {
        const holdingsRaw = await scrapeETF(browser, etf);

        if (holdingsRaw.length > 0) {
            // Resolve ISINs
            const holdings = holdingsRaw.map(h => ({
                isin: getIsin(h.isin) || h.isin, // Try resolve, else keep ticker
                weight: h.weight
            }));

            // Update ETF object in memory
            const idx = etfs.findIndex(e => e.ticker === etf.ticker);
            if (idx !== -1) {
                etfs[idx].holdings = holdings;
            }
        }

        // Polite delay
        await new Promise(r => setTimeout(r, 2000));
    }

    await browser.close();

    // Save ALL ETFs (including those not updated) back to file
    // Note: In a real full run, you'd iterate all.
    fs.writeFileSync(ETFS_FILE, JSON.stringify(etfs, null, 2));
    console.log('Saved updated ETFs to ' + ETFS_FILE);

    // Also sync backend
    const BACKEND_DB = path.join(__dirname, 'backend/src/mock-db.js');
    const dbContent = fs.readFileSync(BACKEND_DB, 'utf8');
    // We need to replace the ETFS part. This is tricky with simple string replace.
    // Better to re-generate the whole content.
    // ... code to regenerate mock-db.js ...
}

run().catch(console.error);
