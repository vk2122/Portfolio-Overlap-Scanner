import { STOCKS, FUNDS } from '../data/mock-db.js';

export function calculatePortfolioExposure(holdings) {
    let totalPortfolioValue = 0;

    // Map to store exposure details per stock ISIN
    // Structure: ISIN -> { isin, name, ticker, totalValue, directVal, mfVal, etfVal }
    const exposureMap = new Map();

    // Helper to init map entry
    const getOrInitStock = (isin) => {
        if (!exposureMap.has(isin)) {
            const stockData = STOCKS.find(s => s.isin === isin);
            const name = stockData ? stockData.name : "Unknown Stock";
            const ticker = stockData ? stockData.ticker : isin;
            exposureMap.set(isin, {
                isin,
                name,
                ticker,
                totalValue: 0,
                directVal: 0,
                mfVal: 0,
                etfVal: 0
            });
        }
        return exposureMap.get(isin);
    };

    // 1. Calculate Total Value and Aggregate Holdings
    holdings.forEach(holding => {
        const value = parseFloat(holding.value);
        totalPortfolioValue += value;

        if (holding.type === 'EQUITY') {
            // Direct Exposure
            const stock = getOrInitStock(holding.id); // holding.id for equity is ISIN
            stock.directVal += value;
            stock.totalValue += value;
        } else {
            // Indirect (Fund) Exposure
            const fund = FUNDS.find(f => f.id === holding.id);
            if (fund && fund.constituents) {
                fund.constituents.forEach(item => {
                    const exposureVal = value * (item.weight / 100);
                    const stock = getOrInitStock(item.isin);

                    if (holding.type === 'MF') {
                        stock.mfVal += exposureVal;
                    } else {
                        stock.etfVal += exposureVal;
                    }
                    stock.totalValue += exposureVal;
                });
            }
        }
    });

    // 2. Convert to Array and Calculate Percentages
    const results = Array.from(exposureMap.values()).map(stock => {
        return {
            ...stock,
            exposurePercent: (totalPortfolioValue > 0) ? (stock.totalValue / totalPortfolioValue) * 100 : 0
        };
    });

    // 3. Sort by Total Exposure Descending
    results.sort((a, b) => b.exposurePercent - a.exposurePercent);

    return {
        totalPortfolioValue,
        stockExposures: results
    };
}
