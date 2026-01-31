
// URLs for local data (in public folder)
const STOCKS_URL = '/data/stocks.json';
const FUNDS_URL = '/data/funds.json';

// Cache for the session
let allStocks = [];
let allFunds = [];
let isLoaded = false;

// Fallback data
import { STOCKS as MOCK_STOCKS, FUNDS as MOCK_FUNDS } from './mock-db.js';

export async function fetchMarketData() {
    if (isLoaded) return { stocks: allStocks, funds: allFunds };

    console.log("Fetching market data (Next.js)...");

    try {
        // Parallel Fetch
        // Note: In Next.js client-side, relative paths to public work.
        // In Server Components, we might need full URL, but this is likely called from Client Component (Search).
        // We will assume Client Side usage for now.
        const [stocksRes, fundsRes] = await Promise.allSettled([
            fetch(STOCKS_URL),
            fetch(FUNDS_URL)
        ]);

        // Process Stocks
        if (stocksRes.status === 'fulfilled') {
            const raw = await stocksRes.value.json();
            if (Array.isArray(raw)) {
                allStocks = raw.map(s => ({
                    ticker: s.Symbol || s.symbol || s.ticker,
                    name: s['Company Name'] || s.name || s.Name,
                    isin: s['ISIN Value'] || s.isin || s.ISIN || `IN_UNK_${Math.random()}`,
                    type: 'EQUITY'
                })).filter(s => s.ticker);
            } else {
                allStocks = Object.entries(raw).map(([name, ticker]) => ({
                    ticker: ticker,
                    name: name,
                    isin: ticker,
                    type: 'EQUITY'
                }));
            }
        }

        // Process Funds
        if (fundsRes.status === 'fulfilled') {
            const raw = await fundsRes.value.json();
            if (Array.isArray(raw)) {
                allFunds = raw.map(f => ({
                    id: String(f.schemeCode),
                    name: f.schemeName,
                    type: (f.schemeName.includes('ETF') || f.schemeName.includes('Exchange Traded')) ? 'ETF' : 'MF',
                    constituents: []
                }));
            }
        }

    } catch (e) {
        console.error("Data fetch error:", e);
    }

    // Deduplicate Stocks
    const stockMap = new Map();
    MOCK_STOCKS.forEach(s => stockMap.set(s.ticker.toUpperCase(), s));
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
    return { stocks: allStocks, funds: allFunds };
}
