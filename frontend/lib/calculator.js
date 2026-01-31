import { STOCKS, FUNDS } from './mock-db.js';

/**
 * Calculates stock-level exposure from a portfolio of holdings.
 * @param {Array} holdings - List of user holdings { instrumentId, type, name, value }
 */
export function calculatePortfolioExposure(holdings) {
    if (!holdings || holdings.length === 0) {
        return { totalValue: 0, stockExposure: [] };
    }

    let totalValue = 0;
    const exposureMap = new Map(); // isin -> exposure object

    // Helper to get or create entry in exposure map
    const getStockEntry = (isin) => {
        if (!exposureMap.has(isin)) {
            const stockInfo = STOCKS.find(s => s.isin === isin);
            exposureMap.set(isin, {
                isin: isin,
                ticker: stockInfo ? stockInfo.ticker : isin,
                name: stockInfo ? stockInfo.name : "Unknown",
                totalVal: 0,
                directVal: 0,
                mfVal: 0,
                etfVal: 0
            });
        }
        return exposureMap.get(isin);
    };

    // Calculate distributions
    holdings.forEach(h => {
        const val = parseFloat(h.value);
        totalValue += val;

        if (h.type === 'EQUITY') {
            const entry = getStockEntry(h.instrumentId);
            entry.directVal += val;
            entry.totalVal += val;
        } else {
            const fund = FUNDS.find(f => f.id === h.instrumentId);
            if (fund && fund.constituents) {
                fund.constituents.forEach(c => {
                    const indirectVal = val * (c.weight / 100);
                    const entry = getStockEntry(c.isin);
                    if (h.type === 'MF') entry.mfVal += indirectVal;
                    if (h.type === 'ETF') entry.etfVal += indirectVal;
                    entry.totalVal += indirectVal;
                });
            }
        }
    });

    // Finalize results
    const stockExposure = Array.from(exposureMap.values())
        .map(s => ({
            ...s,
            exposurePct: (totalValue > 0) ? (s.totalVal / totalValue) * 100 : 0
        }))
        .filter(s => s.totalVal > 0)
        .sort((a, b) => b.totalVal - a.totalVal);

    return {
        totalValue,
        stockExposure
    };
}
