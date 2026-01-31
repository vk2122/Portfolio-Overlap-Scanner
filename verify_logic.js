import { calculatePortfolioExposure } from './js/engine/calculator.js';
import { STOCKS, FUNDS } from './js/data/mock-db.js';

console.log("=== Portfolio Overlap Logic Verification ===");

// Scenario:
// 1. Direct Equity: HDFC Bank (₹50,000)
// 2. MF: HDFC Top 100 (₹1,00,000)
// 3. MF: Axis Bluechip (₹50,000)

// We need to look up IDs from the DB for the test input
const hdfcBank = STOCKS.find(s => s.ticker === 'HDFC');
const hdfcFund = FUNDS.find(f => f.name.includes('Top 100'));
const axisFund = FUNDS.find(f => f.name.includes('Axis Bluechip'));

if (!hdfcBank || !hdfcFund || !axisFund) {
    console.error("Critical: Could not find test instruments in Mock DB.");
    process.exit(1);
}

const holdings = [
    { type: 'EQUITY', id: hdfcBank.isin, value: 50000 },
    { type: 'MF', id: hdfcFund.id, value: 100000 },
    { type: 'MF', id: axisFund.id, value: 50000 }
];

console.log("Input Holdings:");
holdings.forEach(h => console.log(`- ${h.type} ${h.id}: ₹${h.value}`));

const result = calculatePortfolioExposure(holdings);

console.log("\n--- Results ---");
console.log(`Total Portfolio Value: ₹${result.totalPortfolioValue}`);
console.log("\nTop Stock Exposures:");

const top5 = result.stockExposures.slice(0, 5);
top5.forEach((stock, index) => {
    console.log(`${index + 1}. ${stock.ticker} (${stock.name})`);
    console.log(`   Total Exposure: ${stock.exposurePercent.toFixed(2)}% (₹${stock.totalValue.toFixed(2)})`);
    console.log(`   Breakdown: Direct: ₹${stock.directVal.toFixed(2)} | MF: ₹${stock.mfVal.toFixed(2)} | ETF: ₹${stock.etfVal.toFixed(2)}`);

    // Validation Checks
    if (stock.ticker === 'HDFC') {
        // Expected Logic roughly:
        // Direct: 50,000
        // HDFC Top 100 weight for HDFC Bank is 9.5% -> 100,000 * 0.095 = 9,500
        // Axis Bluechip weight for HDFC Bank is 8.9% -> 50,000 * 0.089 = 4,450
        // Total Expected: 50,000 + 9,500 + 4,450 = 63,950
        // Total Pf Value: 200,000
        // Exp Pct: 31.975%
        const expectedVal = 63950;
        const diff = Math.abs(stock.totalValue - expectedVal);
        if (diff < 10) {
            console.log("   ✅ CALCULATION VALIDATED");
        } else {
            console.log(`   ❌ CALCULATION MISMATCH. Expected ~${expectedVal}, got ${stock.totalValue}`);
        }
    }
});

if (top5.length === 0) {
    console.log("No exposures calculated.");
}
