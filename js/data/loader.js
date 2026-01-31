
// URLs for local data (downloaded to avoid CORS/Fetch issues on localhost)
const STOCKS_URL = './js/data/stocks.json';
const FUNDS_URL = './js/data/funds.json';

// Cache for the session
let allStocks = [];
let allFunds = [];
let isLoaded = false;

// Fallback data
import { STOCKS as MOCK_STOCKS, FUNDS as MOCK_FUNDS } from './mock-db.js';

export async function fetchMarketData() {
    if (isLoaded) return { stocks: allStocks, funds: allFunds };

    console.log("Fetching local market data...");

    try {
        // Parallel Fetch
        const [stocksRes, fundsRes] = await Promise.allSettled([
            fetch(STOCKS_URL),
            fetch(FUNDS_URL)
        ]);

        // Process Stocks
        if (stocksRes.status === 'fulfilled') {
            const raw = await stocksRes.value.json();
            // Format check: The downloaded file appears to be {"Name": "Symbol"} object.
            if (Array.isArray(raw)) {
                // Handle if it were an array
                allStocks = raw.map(s => ({
                    ticker: s.Symbol || s.symbol || s.ticker,
                    name: s['Company Name'] || s.name || s.Name,
                    isin: s['ISIN Value'] || s.isin || s.ISIN || `IN_UNK_${Math.random()}`,
                    type: 'EQUITY'
                })).filter(s => s.ticker);
            } else {
                // Handle Object format: { "Name": "Symbol" }
                allStocks = Object.entries(raw).map(([name, ticker]) => ({
                    ticker: ticker,
                    name: name,
                    isin: `INE_SYNTH_${ticker}`, // Synthetic ISIN for listing purposes
                    type: 'EQUITY'
                }));
            }
        } else {
            console.warn("Stocks fetch failed", stocksRes.reason);
        }

        // Process Funds
        if (fundsRes.status === 'fulfilled') {
            const raw = await fundsRes.value.json();
            // mfapi.in returns array of { schemeCode, schemeName, ... }
            if (Array.isArray(raw)) {
                allFunds = raw.map(f => ({
                    id: String(f.schemeCode),
                    name: f.schemeName,
                    type: (f.schemeName.includes('ETF') || f.schemeName.includes('Exchange Traded')) ? 'ETF' : 'MF',
                    constituents: []
                }));
            }
        } else {
            console.warn("Funds fetch failed", fundsRes.reason);
        }

    } catch (e) {
        console.error("Data fetch error:", e);
    }

    // Merge with Mock Data (Mock data at top for demo purposes)
    // We filter mock items from the fetched list to avoid noticeable dupes if possible, 
    // but names might differ. Simple prepend is safest for v1.

    // Prefix Mock ISINs are real, Synthetic are not. 
    // We want Listing to start with Real/Mock ones so user sees data they can overlap with.

    // Deduplicate Stocks (Prefer Mock Data as it has constituent logic if any, though stocks don't carry constituents in this app context, Mock has Real ISINs)
    const stockMap = new Map();
    // Add Mock First
    MOCK_STOCKS.forEach(s => stockMap.set(s.ticker.toUpperCase(), s));
    // Add Fetched (only if not exists)
    allStocks.forEach(s => {
        if (!stockMap.has(s.ticker.toUpperCase())) {
            stockMap.set(s.ticker.toUpperCase(), s);
        }
    });
    allStocks = Array.from(stockMap.values());

    // Deduplicate Funds
    const fundMap = new Map();
    MOCK_FUNDS.forEach(f => fundMap.set(f.id, f));
    allFunds.forEach(f => {
        if (!fundMap.has(f.id)) {
            fundMap.set(f.id, f);
        }
    });
    allFunds = Array.from(fundMap.values());

    isLoaded = true;
    console.log(`Loaded ${allStocks.length} Stocks and ${allFunds.length} Funds.`);
    return { stocks: allStocks, funds: allFunds };
}
