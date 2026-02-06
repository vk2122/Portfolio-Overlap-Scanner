
const STOCKS_URL = '/data/stocks.json';
const ETFS_URL = '/data/etfs.json';
const FUNDS_URL = '/data/funds.json';

// Cache for the session
let allStocks = [];
let allEtfs = [];
let allFunds = [];
let isLoaded = false;

export async function fetchMarketData() {
    if (isLoaded) return { stocks: allStocks, etfs: allEtfs, funds: allFunds };

    console.log("Fetching market data...");

    try {
        const [stocksRes, etfsRes, fundsRes] = await Promise.allSettled([
            fetch(STOCKS_URL),
            fetch(ETFS_URL),
            fetch(FUNDS_URL)
        ]);

        // Process Stocks
        if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
            allStocks = await stocksRes.value.json();
        }

        // Process ETFs
        if (etfsRes.status === 'fulfilled' && etfsRes.value.ok) {
            allEtfs = await etfsRes.value.json();
        }

        // Process Funds
        if (fundsRes.status === 'fulfilled' && fundsRes.value.ok) {
            allFunds = await fundsRes.value.json();
        }

    } catch (e) {
        console.error("Data fetch error:", e);
    }

    isLoaded = true;
    console.log(`Loaded: ${allStocks.length} stocks, ${allEtfs.length} ETFs, ${allFunds.length} funds`);
    return { stocks: allStocks, etfs: allEtfs, funds: allFunds };
}
