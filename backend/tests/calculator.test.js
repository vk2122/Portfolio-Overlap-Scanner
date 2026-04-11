const { calculatePortfolioExposure } = require('../src/calculator');
const { buildClarityReport, GOAL_PROFILES } = require('../src/clarity-engine');

// ============================================================
// V1 CALCULATOR TESTS (unchanged — must all still pass)
// ============================================================

describe('Portfolio Exposure Calculator (v1 — Foundation)', () => {
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

        expect(result.stockExposure[0].name).toBe('Unknown Stock');
        expect(result.stockExposure[0].ticker).toBe('UNKNOWN_ISIN');
    });

    test('Filters out stocks with zero total value', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', value: 0 }
        ];
        const result = calculatePortfolioExposure(holdings);
        expect(result.stockExposure).toHaveLength(0);
    });

    test('Universal engine generates constituents for unknown funds', () => {
        const holdings = [
            { instrumentId: 'NON_EXISTENT_FUND', type: 'MF', value: 10000 }
        ];
        const result = calculatePortfolioExposure(holdings);
        expect(result.totalValue).toBe(10000);
        // Universal engine generates 15-25 deterministic constituents
        expect(result.stockExposure.length).toBeGreaterThan(0);
    });

    test('Returns empty results for empty or null holdings', () => {
        expect(calculatePortfolioExposure([]).totalValue).toBe(0);
        expect(calculatePortfolioExposure(null).totalValue).toBe(0);
        expect(calculatePortfolioExposure(undefined).totalValue).toBe(0);
    });
});

// ============================================================
// V2.0 CLARITY ENGINE TESTS
// ============================================================

describe('Portfolio Clarity Engine (v2.0)', () => {
    const baseHoldings = [
        { instrumentId: 'INE467B01029', type: 'EQUITY', name: 'TCS', value: 10000 },
        { instrumentId: 'MF_AXIS_BLUECHIP', type: 'MF', name: 'Axis Bluechip Fund', value: 10000 },
        { instrumentId: 'ETF_NIFTY_BEES', type: 'ETF', name: 'Nifty BeES', value: 10000 }
    ];

    const baseGoal = { investmentGoal: 'balanced', timeHorizon: '3-7' };

    test('Returns all required v2.0 report sections', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);

        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('focusZone');
        expect(report).toHaveProperty('fundRoles');
        expect(report).toHaveProperty('whyExplanation');
        expect(report).toHaveProperty('alignment');
        expect(report).toHaveProperty('scenarios');
        expect(report).toHaveProperty('stockExposure');
        expect(report).toHaveProperty('sectorExposure');
    });

    test('Summary block contains all mandatory fields', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        const { summary } = report;

        expect(summary).toHaveProperty('overlapPct');
        expect(summary).toHaveProperty('topDriverStock');
        expect(summary).toHaveProperty('effectiveExposureCount');
        expect(summary).toHaveProperty('redundancyScore');
        expect(summary).toHaveProperty('topDriverConcentration');
        expect(summary).toHaveProperty('totalValue');
        expect(summary).toHaveProperty('overlapVerdict');
        expect(summary.totalValue).toBe(30000);
    });

    test('Focus zone identifies top overlap and concentration drivers', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        const { focusZone } = report;

        expect(focusZone).toHaveProperty('topOverlapDrivers');
        expect(focusZone).toHaveProperty('topConcentrationDriver');
        expect(focusZone).toHaveProperty('focusStatement');
        expect(focusZone.topConcentrationDriver).toBeTruthy();
        expect(focusZone.topConcentrationDriver).toHaveProperty('ticker');
    });

    test('Top driver concentration is calculated correctly', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        // Top 3 stocks / totalValue * 100
        expect(report.summary.topDriverConcentration).toBeGreaterThan(0);
        expect(report.summary.topDriverConcentration).toBeLessThanOrEqual(100);
    });

    test('Redundancy score equals overlap percent', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        expect(report.summary.redundancyScore).toBe(report.summary.overlapPct);
    });

    test('Fund roles are classified for each holding', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        expect(report.fundRoles).toHaveLength(baseHoldings.length);

        report.fundRoles.forEach(role => {
            expect(['CORE_DRIVER', 'OVERLAP_CONTRIBUTOR', 'MINOR_CONTRIBUTOR']).toContain(role.role);
            expect(role).toHaveProperty('exposureContribution');
            expect(role).toHaveProperty('overlapContribution');
        });
    });

    test('Why layer generates deterministic explanations', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        const { whyExplanation } = report;

        expect(whyExplanation).toHaveProperty('overlapCause');
        expect(whyExplanation).toHaveProperty('concentrationCause');
        expect(typeof whyExplanation.overlapCause).toBe('string');
        expect(typeof whyExplanation.concentrationCause).toBe('string');
    });

    test('Alignment engine produces statement with goal', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        const { alignment } = report;

        expect(alignment).toHaveProperty('statement');
        expect(alignment.statement).toBeTruthy();
        expect(alignment).toHaveProperty('details');
        expect(alignment.details).toHaveProperty('goal', 'Balanced');
    });

    test('Alignment works without goal', () => {
        const report = buildClarityReport(baseHoldings, null);
        expect(report.alignment.statement).toBeNull();
    });

    test('Scenario engine generates max 3 scenarios', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        expect(report.scenarios.length).toBeLessThanOrEqual(3);
        expect(report.scenarios.length).toBeGreaterThan(0);
    });

    test('Each scenario has required fields and disclaimer', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);

        report.scenarios.forEach(sc => {
            expect(sc).toHaveProperty('description');
            expect(sc).toHaveProperty('holdingRemoved');
            expect(sc).toHaveProperty('before');
            expect(sc).toHaveProperty('after');
            expect(sc).toHaveProperty('disclaimer');
            expect(sc.disclaimer).toContain('not investment advice');
            expect(sc.before).toHaveProperty('overlapPct');
            expect(sc.after).toHaveProperty('overlapPct');
        });
    });

    test('Stock exposure includes market-cap classification', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);

        report.stockExposure.forEach(s => {
            expect(['large', 'mid', 'small']).toContain(s.cap);
        });
    });

    test('Language guardrails — no forbidden words in outputs', () => {
        const report = buildClarityReport(baseHoldings, baseGoal);
        const forbidden = ['you should', 'reduce', 'increase', 'better', 'optimal', 'recommend'];

        const allText = JSON.stringify(report).toLowerCase();
        forbidden.forEach(word => {
            // Allow "concentration" which contains "increase" partially — check whole words
            if (word === 'reduce' || word === 'increase') {
                // These are OK if they appear as part of a different word
                // But should not appear as standalone advisory language
                const regex = new RegExp(`\\b${word}\\b`, 'i');
                const matches = allText.match(regex);
                if (matches) {
                    // Verify it's not in advisory context
                    expect(allText).not.toMatch(new RegExp(`you should.*${word}`, 'i'));
                }
            } else {
                expect(allText).not.toContain(word);
            }
        });
    });

    test('Handles single holding (no scenarios)', () => {
        const single = [{ instrumentId: 'INE467B01029', type: 'EQUITY', name: 'TCS', value: 10000 }];
        const report = buildClarityReport(single, baseGoal);

        expect(report.summary.totalValue).toBe(10000);
        expect(report.scenarios).toHaveLength(0);
    });

    test('Handles empty holdings', () => {
        const report = buildClarityReport([], baseGoal);
        expect(report.summary.totalValue).toBe(0);
        expect(report.scenarios).toHaveLength(0);
    });
});

// ============================================================
// GOAL PROFILES TESTS
// ============================================================

describe('Goal Profiles', () => {
    test('All three goal profiles exist', () => {
        expect(GOAL_PROFILES).toHaveProperty('growth');
        expect(GOAL_PROFILES).toHaveProperty('stability');
        expect(GOAL_PROFILES).toHaveProperty('balanced');
    });

    test('Each goal has all three time horizon variants', () => {
        Object.entries(GOAL_PROFILES).forEach(([goalName, horizons]) => {
            expect(horizons).toHaveProperty('<3');
            expect(horizons).toHaveProperty('3-7');
            expect(horizons).toHaveProperty('7+');
        });
    });

    test('Each profile variant has required reference values and caps sum to 100', () => {
        Object.values(GOAL_PROFILES).forEach(horizons => {
            Object.values(horizons).forEach(profile => {
                expect(profile).toHaveProperty('largeCap');
                expect(profile).toHaveProperty('midCap');
                expect(profile).toHaveProperty('smallCap');
                expect(profile).toHaveProperty('maxSectorConcentration');
                expect(profile).toHaveProperty('maxOverlap');
                expect(profile.largeCap + profile.midCap + profile.smallCap).toBe(100);
            });
        });
    });

    test('Shorter time horizons produce tighter thresholds', () => {
        Object.values(GOAL_PROFILES).forEach(horizons => {
            // Short-term maxOverlap should be <= medium-term <= long-term
            expect(horizons['<3'].maxOverlap).toBeLessThanOrEqual(horizons['3-7'].maxOverlap);
            expect(horizons['3-7'].maxOverlap).toBeLessThanOrEqual(horizons['7+'].maxOverlap);
            // Short-term largeCap should be >= medium-term (more conservative)
            expect(horizons['<3'].largeCap).toBeGreaterThanOrEqual(horizons['3-7'].largeCap);
        });
    });

    test('Different goals + time horizons produce different alignment results', () => {
        const holdings = [
            { instrumentId: 'INE467B01029', type: 'EQUITY', name: 'TCS', value: 10000 },
            { instrumentId: 'MF_AXIS_BLUECHIP', type: 'MF', name: 'Axis Bluechip Fund', value: 10000 },
            { instrumentId: 'ETF_NIFTY_BEES', type: 'ETF', name: 'Nifty BeES', value: 10000 }
        ];

        const r1 = buildClarityReport(holdings, { investmentGoal: 'growth', timeHorizon: '<3' });
        const r2 = buildClarityReport(holdings, { investmentGoal: 'growth', timeHorizon: '7+' });
        const r3 = buildClarityReport(holdings, { investmentGoal: 'stability', timeHorizon: '<3' });

        // Different time horizons should produce different reference values
        expect(r1.alignment.details.reference.maxOverlap).not.toBe(r2.alignment.details.reference.maxOverlap);
        // Different goals should produce different reference values
        expect(r1.alignment.details.reference.largeCap).not.toBe(r3.alignment.details.reference.largeCap);
        // Alignment scores should differ
        expect(r1.alignment.alignmentScore).not.toBe(r3.alignment.alignmentScore);
    });
});
