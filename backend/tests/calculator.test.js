const { calculatePortfolioExposure } = require('../src/calculator');

describe('Portfolio Exposure Calculator', () => {
    test('Calculates individual stock exposure correctly', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', value: 10000 } // TCS
        ];
        const result = calculatePortfolioExposure(holdings);
        expect(result.totalValue).toBe(10000);
        expect(result.stockExposure[0].ticker).toBe('TCS');
        expect(result.stockExposure[0].exposurePct).toBe(100);
    });

    test('Calculates mutual fund overlap exposure correctly', () => {
        const holdings = [
            { instrumentId: 'MF_AXIS_BLUECHIP', type: 'MF', value: 10000 }
        ];
        // Axis Bluechip has TCS @ 6.5%, Axis Bank @ 9.8%
        const result = calculatePortfolioExposure(holdings);
        const tcs = result.stockExposure.find(s => s.ticker === 'TCS');
        const axis = result.stockExposure.find(s => s.ticker === 'AXISBANK');

        expect(tcs.mfVal).toBeCloseTo(650);
        expect(axis.mfVal).toBeCloseTo(980);
        expect(tcs.totalVal).toBe(tcs.mfVal);
    });

    test('Calculates ETF exposure correctly', () => {
        const holdings = [
            { instrumentId: 'ETF_NIFTY_BEES', type: 'ETF', value: 10000 }
        ];
        // Nifty BeES has Reliance @ 10.2%
        const result = calculatePortfolioExposure(holdings);
        const reliance = result.stockExposure.find(s => s.ticker === 'RELIANCE');

        expect(reliance.etfVal).toBeCloseTo(1020);
        expect(reliance.totalVal).toBe(reliance.etfVal);
        expect(reliance.mfVal).toBe(0);
        expect(reliance.directVal).toBe(0);
    });

    test('Aggregate exposure from Direct + MF + ETF correctly', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', value: 10000 }, // TCS Direct
            { instrumentId: 'MF_AXIS_BLUECHIP', type: 'MF', value: 10000 },  // TCS @ 6.5% = 650
            { instrumentId: 'ETF_NIFTY_BEES', type: 'ETF', value: 10000 }   // TCS @ 4.1% = 410
        ];
        const result = calculatePortfolioExposure(holdings);
        const tcs = result.stockExposure.find(s => s.ticker === 'TCS');

        // Total TCS = 10000 + 650 + 410 = 11060
        expect(tcs.totalVal).toBeCloseTo(11060);
        expect(tcs.directVal).toBe(10000);
        expect(tcs.mfVal).toBe(650);
        expect(tcs.etfVal).toBe(410);
    });

    test('Sorts stocks by exposure descending', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', value: 1000 },  // TCS (Lower)
            { instrumentId: 'INE002A01018', type: 'EQUITY', value: 5000 }   // Reliance (Higher)
        ];
        const result = calculatePortfolioExposure(holdings);

        expect(result.stockExposure[0].ticker).toBe('RELIANCE');
        expect(result.stockExposure[1].ticker).toBe('TCS');
    });

    test('Handles unknown stocks gracefully', () => {
        const holdings = [
            { instrumentId: 'UNKNOWN_ISIN', type: 'EQUITY', value: 5000 }
        ];
        const result = calculatePortfolioExposure(holdings);

        expect(result.stockExposure[0].name).toBe('Unknown');
        expect(result.stockExposure[0].ticker).toBe('UNKNOWN_ISIN');
    });

    test('Returns empty results for empty or null holdings', () => {
        expect(calculatePortfolioExposure([]).totalValue).toBe(0);
        expect(calculatePortfolioExposure(null).totalValue).toBe(0);
        expect(calculatePortfolioExposure(undefined).totalValue).toBe(0);
    });

    test('Filters out stocks with zero total value', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', value: 0 }
        ];
        const result = calculatePortfolioExposure(holdings);
        expect(result.stockExposure).toHaveLength(0);
    });

    test('Handles malformed fund data (missing in DB)', () => {
        const holdings = [
            { instrumentId: 'NON_EXISTENT_FUND', type: 'MF', value: 10000 }
        ];
        const result = calculatePortfolioExposure(holdings);
        expect(result.totalValue).toBe(10000);
        expect(result.stockExposure).toHaveLength(0); // No constituents found
    });
});
