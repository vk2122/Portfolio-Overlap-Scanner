const { calculatePortfolioExposure } = require('./calculator');

/**
 * UNSTACKED v2.0 — Portfolio Clarity Engine
 * 
 * Layers on top of the existing Analysis Engine (calculator.js) to provide:
 * 1. Direction Engine — Focus zone, driver concentration, redundancy, fund roles
 * 2. Why Layer — Deterministic template-based explanations
 * 3. Alignment Engine — Goal vs portfolio comparison
 * 4. Exploration Engine — Scenario-based simulations
 * 
 * NO advisory language. NO recommendations. Purely explanatory.
 */

// ============================================================
// MARKET-CAP HEURISTIC
// Hardcoded Nifty 50 + Nifty Next 50 tickers as "large cap"
// Everything else treated as mid/small cap
// ============================================================
const LARGE_CAP_TICKERS = new Set([
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR',
    'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'ITC', 'LT', 'AXISBANK',
    'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA',
    'TITAN', 'ULTRACEMCO', 'WIPRO', 'NESTLEIND', 'TATAMOTORS',
    'ADANIENT', 'ADANIPORTS', 'POWERGRID', 'NTPC', 'JSWSTEEL',
    'TATASTEEL', 'M&M', 'BAJAJFINSV', 'TECHM', 'ONGC', 'HDFCLIFE',
    'DIVISLAB', 'DRREDDY', 'CIPLA', 'BRITANNIA', 'EICHERMOT',
    'APOLLOHOSP', 'COALINDIA', 'SBILIFE', 'GRASIM', 'BAJAJ-AUTO',
    'HEROMOTOCO', 'INDUSINDBK', 'TATACONSUM', 'UPL', 'BPCL', 'HINDALCO',
    // Nifty Next 50
    'ADANIGREEN', 'ADANIPOWER', 'AMBUJACEM', 'BANKBARODA', 'BERGEPAINT',
    'BIOCON', 'BOSCHLTD', 'CHOLAFIN', 'COLPAL', 'DABUR', 'DLF',
    'GAIL', 'GODREJCP', 'HAVELLS', 'ICICIPRULI', 'ICICIGI', 'INDIGO',
    'IOC', 'IRCTC', 'JINDALSTEL', 'LICI', 'LUPIN', 'MARICO',
    'MCDOWELL-N', 'MOTHERSON', 'NAUKRI', 'PEL', 'PIDILITIND',
    'PNB', 'SAIL', 'SHREECEM', 'SIEMENS', 'SRF', 'TORNTPHARM',
    'TRENT', 'VEDL', 'ZOMATO', 'ZYDUSLIFE'
]);

// Tickers commonly in Nifty Midcap 100
const MID_CAP_TICKERS = new Set([
    'MPHASIS', 'PERSISTENT', 'LTTS', 'COFORGE', 'TATAELXSI', 'LTIM',
    'MINDTREE', 'VOLTAS', 'PAGEIND', 'ASTRAL', 'POLYCAB', 'PIIND',
    'IDFCFIRSTB', 'FEDERALBNK', 'MFSL', 'MAXHEALTH', 'AUROPHARMA',
    'ABCAPITAL', 'ABFRL', 'ACC', 'CANBK', 'CONCOR', 'CUMMINSIND',
    'DIXON', 'EMAMILTD', 'GLAND', 'GMRINFRA', 'GODREJPROP', 'HDFCAMC',
    'INDUSTOWER', 'JUBLFOOD', 'LICHSGFIN', 'MUTHOOTFIN', 'OBEROIRLTY',
    'OFSS', 'PETRONET', 'RECLTD', 'SBICARD', 'TATAPOWER', 'TVSMOTOR',
    'UNIONBANK', 'UBL', 'YESBANK'
]);

/**
 * Classify a stock ticker into large/mid/small cap bucket
 */
function classifyMarketCap(ticker) {
    const t = (ticker || '').toUpperCase();
    if (LARGE_CAP_TICKERS.has(t)) return 'large';
    if (MID_CAP_TICKERS.has(t)) return 'mid';
    return 'small';
}

// ============================================================
// GOAL PROFILES — 3×3 matrix: goal × time horizon
// Shorter horizons → tighter thresholds, more conservative
// ============================================================
const GOAL_PROFILES = {
    growth: {
        '<3': {
            label: 'Growth (Short-Term)',
            largeCap: 55, midCap: 30, smallCap: 15,
            maxSectorConcentration: 30,
            maxOverlap: 30,
            maxConcentration: 25
        },
        '3-7': {
            label: 'Growth (Medium-Term)',
            largeCap: 40, midCap: 35, smallCap: 25,
            maxSectorConcentration: 35,
            maxOverlap: 40,
            maxConcentration: 35
        },
        '7+': {
            label: 'Growth (Long-Term)',
            largeCap: 30, midCap: 35, smallCap: 35,
            maxSectorConcentration: 40,
            maxOverlap: 50,
            maxConcentration: 45
        }
    },
    stability: {
        '<3': {
            label: 'Stability (Short-Term)',
            largeCap: 85, midCap: 12, smallCap: 3,
            maxSectorConcentration: 20,
            maxOverlap: 15,
            maxConcentration: 15
        },
        '3-7': {
            label: 'Stability (Medium-Term)',
            largeCap: 75, midCap: 20, smallCap: 5,
            maxSectorConcentration: 25,
            maxOverlap: 25,
            maxConcentration: 20
        },
        '7+': {
            label: 'Stability (Long-Term)',
            largeCap: 65, midCap: 25, smallCap: 10,
            maxSectorConcentration: 30,
            maxOverlap: 30,
            maxConcentration: 25
        }
    },
    balanced: {
        '<3': {
            label: 'Balanced (Short-Term)',
            largeCap: 70, midCap: 22, smallCap: 8,
            maxSectorConcentration: 25,
            maxOverlap: 20,
            maxConcentration: 20
        },
        '3-7': {
            label: 'Balanced (Medium-Term)',
            largeCap: 60, midCap: 28, smallCap: 12,
            maxSectorConcentration: 30,
            maxOverlap: 30,
            maxConcentration: 30
        },
        '7+': {
            label: 'Balanced (Long-Term)',
            largeCap: 50, midCap: 30, smallCap: 20,
            maxSectorConcentration: 35,
            maxOverlap: 40,
            maxConcentration: 40
        }
    }
};

/**
 * Resolve the correct goal profile based on goal + time horizon
 */
function resolveGoalProfile(goal) {
    if (!goal || !goal.investmentGoal) return null;
    const goalProfiles = GOAL_PROFILES[goal.investmentGoal];
    if (!goalProfiles) return null;
    // Default to medium-term if time horizon not specified
    const horizon = goal.timeHorizon || '3-7';
    return goalProfiles[horizon] || goalProfiles['3-7'];
}

// ============================================================
// DIRECTION ENGINE
// ============================================================

/**
 * Build the Focus Zone — top 2 overlap drivers + top 1 concentration driver
 */
function buildFocusZone(stockExposure) {
    // Top overlap drivers: stocks appearing in most sources with highest value
    const overlapDrivers = stockExposure
        .filter(s => (s.sourceCount || 0) >= 2)
        .sort((a, b) => {
            // Sort by source count first, then by value
            if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
            return b.totalVal - a.totalVal;
        })
        .slice(0, 2);

    // Top concentration driver: highest single-stock exposure
    const concentrationDriver = stockExposure[0] || null;

    const topOverlapDriverNames = overlapDrivers.map(d => d.ticker);
    const topConcentrationDriverName = concentrationDriver?.ticker || null;

    let focusStatement = '';
    if (topOverlapDriverNames.length >= 2) {
        focusStatement = `Most of your portfolio overlap is driven by ${topOverlapDriverNames[0]} and ${topOverlapDriverNames[1]}.`;
    } else if (topOverlapDriverNames.length === 1) {
        focusStatement = `Most of your portfolio overlap is driven by ${topOverlapDriverNames[0]}.`;
    }

    return {
        topOverlapDrivers: overlapDrivers.map(d => ({
            ticker: d.ticker,
            name: d.name,
            exposurePct: d.exposurePct,
            sourceCount: d.sourceCount
        })),
        topConcentrationDriver: concentrationDriver ? {
            ticker: concentrationDriver.ticker,
            name: concentrationDriver.name,
            exposurePct: concentrationDriver.exposurePct
        } : null,
        focusStatement
    };
}

/**
 * Calculate Top Driver Concentration = Σ top 3 stock exposures / total
 */
function calcTopDriverConcentration(stockExposure, totalValue) {
    if (!totalValue || stockExposure.length === 0) return 0;
    const top3Val = stockExposure.slice(0, 3).reduce((sum, s) => sum + s.totalVal, 0);
    return (top3Val / totalValue) * 100;
}

/**
 * Classify each holding's role in the portfolio
 */
function classifyFundRoles(holdings, stockExposure, totalValue) {
    if (!totalValue || holdings.length === 0) return [];

    // Build a map from source key to aggregated exposure and overlap contribution
    const sourceExposure = new Map();
    const sourceOverlap = new Map();

    stockExposure.forEach(stock => {
        const sources = Array.from(stock.sources || []);
        const isOverlap = sources.length >= 2;

        sources.forEach(src => {
            sourceExposure.set(src, (sourceExposure.get(src) || 0) + stock.totalVal);
            if (isOverlap) {
                sourceOverlap.set(src, (sourceOverlap.get(src) || 0) + stock.totalVal);
            }
        });
    });

    return holdings.map(h => {
        const key = `${h.type}:${h.instrumentId}`;
        const exposure = sourceExposure.get(key) || 0;
        const overlap = sourceOverlap.get(key) || 0;
        const exposurePct = (exposure / totalValue) * 100;
        const overlapPct = (overlap / totalValue) * 100;

        let role = 'MINOR_CONTRIBUTOR';
        if (exposurePct >= 15 && overlapPct < 5) {
            role = 'CORE_DRIVER';
        } else if (overlapPct >= 5) {
            role = 'OVERLAP_CONTRIBUTOR';
        } else if (exposurePct >= 8) {
            role = 'CORE_DRIVER';
        }

        return {
            name: h.name || h.instrumentId,
            type: h.type,
            instrumentId: h.instrumentId,
            role,
            value: h.value,
            exposureContribution: parseFloat(exposurePct.toFixed(1)),
            overlapContribution: parseFloat(overlapPct.toFixed(1))
        };
    });
}

// ============================================================
// WHY LAYER — Deterministic template-based explanations
// ============================================================

function buildWhyExplanation(analysisResult, focusZone) {
    const explanations = {};
    const { overlapPercent, overlapStocksCount, stockExposure, totalValue } = analysisResult;

    // Overlap cause
    if (overlapPercent > 0 && overlapStocksCount > 0) {
        const drivers = focusZone.topOverlapDrivers;
        if (drivers.length >= 1) {
            explanations.overlapCause = `This occurs because multiple holdings in your portfolio hold the same underlying stocks. ` +
                `${drivers[0].ticker} appears across ${drivers[0].sourceCount} of your holdings, creating shared exposure.`;
        } else {
            explanations.overlapCause = `This occurs because multiple funds in your portfolio hold the same underlying stocks.`;
        }
    } else {
        explanations.overlapCause = `No significant overlap detected between your holdings.`;
    }

    // Concentration cause
    const topDriver = focusZone.topConcentrationDriver;
    if (topDriver && topDriver.exposurePct >= 7) {
        const top3Total = stockExposure.slice(0, 3).reduce((s, e) => s + e.totalVal, 0);
        const top3Pct = totalValue > 0 ? ((top3Total / totalValue) * 100).toFixed(1) : 0;
        explanations.concentrationCause = `A large portion of your portfolio (${top3Pct}%) is driven by just 3 stocks. ` +
            `${topDriver.ticker} alone accounts for ${topDriver.exposurePct.toFixed(1)}% of your total exposure.`;
    } else {
        explanations.concentrationCause = `Your portfolio exposure is relatively distributed across multiple stocks.`;
    }

    return explanations;
}

// ============================================================
// ALIGNMENT ENGINE — Goal vs Portfolio comparison
// ============================================================

function buildAlignment(analysisResult, goal) {
    if (!goal || !goal.investmentGoal) {
        return { statement: null, details: null, flags: [], alignmentScore: null };
    }

    const profile = resolveGoalProfile(goal);
    if (!profile) {
        return { statement: null, details: null, flags: [], alignmentScore: null };
    }

    const { stockExposure, overlapPercent, totalValue } = analysisResult;

    // Calculate actual market-cap distribution
    let largeCapVal = 0, midCapVal = 0, smallCapVal = 0;
    stockExposure.forEach(s => {
        const cap = classifyMarketCap(s.ticker);
        if (cap === 'large') largeCapVal += s.totalVal;
        else if (cap === 'mid') midCapVal += s.totalVal;
        else smallCapVal += s.totalVal;
    });

    const actualLargePct = totalValue > 0 ? (largeCapVal / totalValue) * 100 : 0;
    const actualMidPct = totalValue > 0 ? (midCapVal / totalValue) * 100 : 0;
    const actualSmallPct = totalValue > 0 ? (smallCapVal / totalValue) * 100 : 0;

    // Calculate sector concentration
    const sectorTotals = new Map();
    stockExposure.forEach(s => {
        if (s.sector) {
            sectorTotals.set(s.sector, (sectorTotals.get(s.sector) || 0) + s.totalVal);
        }
    });
    let maxSectorPct = 0;
    let maxSector = '';
    sectorTotals.forEach((val, sector) => {
        const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
        if (pct > maxSectorPct) {
            maxSectorPct = pct;
            maxSector = sector;
        }
    });

    // Top 3 concentration
    const top3Val = stockExposure.slice(0, 3).reduce((s, e) => s + e.totalVal, 0);
    const top3Pct = totalValue > 0 ? (top3Val / totalValue) * 100 : 0;

    // Build alignment flags — every mismatch generates a flag
    const flags = [];
    const largeCapDiff = Math.abs(actualLargePct - profile.largeCap);
    const midCapDiff = Math.abs(actualMidPct - profile.midCap);
    const smallCapDiff = Math.abs(actualSmallPct - profile.smallCap);

    if (largeCapDiff > 20) {
        const dir = actualLargePct > profile.largeCap ? 'higher' : 'lower';
        flags.push({ type: 'cap_mismatch', severity: 'high', text: `Large-cap allocation (${actualLargePct.toFixed(0)}%) is ${dir} than the ${profile.label} reference (${profile.largeCap}%).` });
    } else if (largeCapDiff > 10) {
        flags.push({ type: 'cap_mismatch', severity: 'medium', text: `Large-cap allocation (${actualLargePct.toFixed(0)}%) differs from the ${profile.label} reference (${profile.largeCap}%).` });
    }

    if (overlapPercent > profile.maxOverlap) {
        const excess = (overlapPercent - profile.maxOverlap).toFixed(1);
        flags.push({ type: 'overlap_high', severity: overlapPercent > profile.maxOverlap * 1.5 ? 'high' : 'medium', text: `Portfolio overlap (${overlapPercent.toFixed(1)}%) exceeds the ${profile.label} threshold (${profile.maxOverlap}%) by ${excess}pp.` });
    }

    if (maxSectorPct > profile.maxSectorConcentration) {
        flags.push({ type: 'sector_concentration', severity: maxSectorPct > profile.maxSectorConcentration * 1.3 ? 'high' : 'medium', text: `${maxSector} concentration (${maxSectorPct.toFixed(1)}%) exceeds the ${profile.label} threshold (${profile.maxSectorConcentration}%).` });
    }

    if (profile.maxConcentration && top3Pct > profile.maxConcentration) {
        flags.push({ type: 'top3_concentration', severity: 'medium', text: `Top 3 stock concentration (${top3Pct.toFixed(1)}%) exceeds the ${profile.label} threshold (${profile.maxConcentration}%).` });
    }

    // Alignment score (0-100)
    const overlapPenalty = overlapPercent > profile.maxOverlap ? Math.min(30, ((overlapPercent - profile.maxOverlap) / profile.maxOverlap) * 30) : 0;
    const capPenalty = Math.min(30, (largeCapDiff + midCapDiff + smallCapDiff) / 3);
    const sectorPenalty = maxSectorPct > profile.maxSectorConcentration ? Math.min(20, ((maxSectorPct - profile.maxSectorConcentration) / profile.maxSectorConcentration) * 20) : 0;
    const concPenalty = (profile.maxConcentration && top3Pct > profile.maxConcentration) ? Math.min(20, ((top3Pct - profile.maxConcentration) / profile.maxConcentration) * 20) : 0;
    const alignmentScore = Math.max(0, Math.round(100 - overlapPenalty - capPenalty - sectorPenalty - concPenalty));

    let statement = '';
    if (alignmentScore >= 80) {
        statement = `Your portfolio structure is broadly consistent with a ${profile.label} profile (${alignmentScore}% alignment).`;
    } else if (alignmentScore >= 50) {
        statement = `Your portfolio partially aligns with a ${profile.label} profile (${alignmentScore}% alignment). ${flags.length} area${flags.length !== 1 ? 's' : ''} of divergence detected.`;
    } else {
        statement = `Your portfolio structure diverges significantly from a ${profile.label} profile (${alignmentScore}% alignment). ${flags.length} area${flags.length !== 1 ? 's' : ''} of divergence detected.`;
    }

    return {
        statement,
        alignmentScore,
        flags,
        details: {
            goal: profile.label,
            timeHorizon: goal.timeHorizon || 'Not specified',
            actual: {
                largeCap: parseFloat(actualLargePct.toFixed(1)),
                midCap: parseFloat(actualMidPct.toFixed(1)),
                smallCap: parseFloat(actualSmallPct.toFixed(1)),
                sectorConcentration: parseFloat(maxSectorPct.toFixed(1)),
                topSector: maxSector,
                overlap: parseFloat(overlapPercent.toFixed(1)),
                top3Concentration: parseFloat(top3Pct.toFixed(1))
            },
            reference: {
                largeCap: profile.largeCap,
                midCap: profile.midCap,
                smallCap: profile.smallCap,
                maxSectorConcentration: profile.maxSectorConcentration,
                maxOverlap: profile.maxOverlap,
                maxConcentration: profile.maxConcentration || null
            }
        }
    };
}

// ============================================================
// EXPLORATION ENGINE — Scenario simulations
// ============================================================

function buildScenarios(holdings, analysisResult) {
    if (holdings.length < 2) return [];

    const scenarios = [];
    const baseOverlap = analysisResult.overlapPercent;
    const baseRedundancy = analysisResult.overlapPercent; // Same formula, different framing
    const baseTotal = analysisResult.totalValue;

    // Build per-holding overlap contribution scores
    const holdingScores = holdings.map(h => {
        const key = `${h.type}:${h.instrumentId}`;
        let overlapContribution = 0;
        let exposureContribution = 0;

        (analysisResult.stockExposure || []).forEach(stock => {
            const sources = Array.from(stock.sources || []);
            if (sources.includes(key)) {
                exposureContribution += stock.totalVal;
                if (sources.length >= 2) {
                    overlapContribution += stock.totalVal;
                }
            }
        });

        return { holding: h, overlapContribution, exposureContribution };
    });

    // Sort for each scenario type
    const byOverlap = [...holdingScores].sort((a, b) => b.overlapContribution - a.overlapContribution);
    const byConcentration = [...holdingScores].sort((a, b) => b.exposureContribution - a.exposureContribution);
    const byLowestImpact = [...holdingScores].sort((a, b) => a.exposureContribution - b.exposureContribution);

    const usedIds = new Set();

    // Scenario 1: Remove highest overlap contributor
    if (byOverlap.length > 0 && byOverlap[0].overlapContribution > 0) {
        const target = byOverlap[0];
        usedIds.add(target.holding.instrumentId);
        const newHoldings = holdings.filter(h => h.instrumentId !== target.holding.instrumentId);
        const simResult = calculatePortfolioExposure(newHoldings);
        scenarios.push({
            id: 'remove_overlap',
            description: `If ${target.holding.name} is removed, overlap changes from ${baseOverlap.toFixed(1)}% → ${simResult.overlapPercent.toFixed(1)}%`,
            holdingRemoved: target.holding.name,
            reason: 'Highest overlap contributor',
            before: {
                overlapPct: parseFloat(baseOverlap.toFixed(1)),
                redundancyScore: parseFloat(baseRedundancy.toFixed(1)),
                totalValue: baseTotal
            },
            after: {
                overlapPct: parseFloat(simResult.overlapPercent.toFixed(1)),
                redundancyScore: parseFloat(simResult.overlapPercent.toFixed(1)),
                totalValue: simResult.totalValue
            },
            disclaimer: 'This is a simulation and not investment advice.'
        });
    }

    // Scenario 2: Remove highest concentration contributor
    const concTarget = byConcentration.find(s => !usedIds.has(s.holding.instrumentId));
    if (concTarget) {
        usedIds.add(concTarget.holding.instrumentId);
        const newHoldings = holdings.filter(h => h.instrumentId !== concTarget.holding.instrumentId);
        const simResult = calculatePortfolioExposure(newHoldings);
        scenarios.push({
            id: 'remove_concentration',
            description: `If ${concTarget.holding.name} is removed, overlap changes from ${baseOverlap.toFixed(1)}% → ${simResult.overlapPercent.toFixed(1)}%`,
            holdingRemoved: concTarget.holding.name,
            reason: 'Highest concentration contributor',
            before: {
                overlapPct: parseFloat(baseOverlap.toFixed(1)),
                redundancyScore: parseFloat(baseRedundancy.toFixed(1)),
                totalValue: baseTotal
            },
            after: {
                overlapPct: parseFloat(simResult.overlapPercent.toFixed(1)),
                redundancyScore: parseFloat(simResult.overlapPercent.toFixed(1)),
                totalValue: simResult.totalValue
            },
            disclaimer: 'This is a simulation and not investment advice.'
        });
    }

    // Scenario 3: Remove lowest-impact redundant holding
    const lowTarget = byLowestImpact.find(s => !usedIds.has(s.holding.instrumentId));
    if (lowTarget) {
        usedIds.add(lowTarget.holding.instrumentId);
        const newHoldings = holdings.filter(h => h.instrumentId !== lowTarget.holding.instrumentId);
        const simResult = calculatePortfolioExposure(newHoldings);
        scenarios.push({
            id: 'remove_redundant',
            description: `If ${lowTarget.holding.name} is removed, overlap changes from ${baseOverlap.toFixed(1)}% → ${simResult.overlapPercent.toFixed(1)}%`,
            holdingRemoved: lowTarget.holding.name,
            reason: 'Lowest-impact redundant holding',
            before: {
                overlapPct: parseFloat(baseOverlap.toFixed(1)),
                redundancyScore: parseFloat(baseRedundancy.toFixed(1)),
                totalValue: baseTotal
            },
            after: {
                overlapPct: parseFloat(simResult.overlapPercent.toFixed(1)),
                redundancyScore: parseFloat(simResult.overlapPercent.toFixed(1)),
                totalValue: simResult.totalValue
            },
            disclaimer: 'This is a simulation and not investment advice.'
        });
    }

    return scenarios;
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

/**
 * Build the full v2.0 Clarity Report
 * @param {Array} holdings - User's portfolio holdings
 * @param {Object} goal - { investmentGoal: 'growth'|'stability'|'balanced', timeHorizon: '<3'|'3-7'|'7+' }
 * @returns {Object} Full clarity report
 */
function buildClarityReport(holdings, goal) {
    // 1. Run the existing Analysis Engine (unchanged from v1)
    const analysis = calculatePortfolioExposure(holdings);

    // 2. Direction Engine
    const focusZone = buildFocusZone(analysis.stockExposure);
    const topDriverConcentration = calcTopDriverConcentration(analysis.stockExposure, analysis.totalValue);
    const redundancyScore = analysis.overlapPercent; // Same formula, different framing
    const fundRoles = classifyFundRoles(holdings, analysis.stockExposure, analysis.totalValue);

    // 3. Why Layer
    const whyExplanation = buildWhyExplanation(analysis, focusZone);

    // 4. Alignment Engine
    const alignment = buildAlignment(analysis, goal);

    // 5. Exploration Engine
    const scenarios = buildScenarios(holdings, analysis);

    // 6. Build sector exposure summary
    const sectorTotals = new Map();
    analysis.stockExposure.forEach(s => {
        if (s.sector) {
            sectorTotals.set(s.sector, (sectorTotals.get(s.sector) || 0) + s.totalVal);
        }
    });
    const sectorExposure = Array.from(sectorTotals.entries())
        .map(([sector, val]) => ({
            sector,
            value: val,
            pct: analysis.totalValue > 0 ? parseFloat(((val / analysis.totalValue) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.value - a.value);

    return {
        // Summary Block (PRD §11.1)
        summary: {
            overlapPct: parseFloat(analysis.overlapPercent.toFixed(1)),
            topDriverStock: analysis.stockExposure[0]?.ticker || null,
            topDriverStockPct: parseFloat((analysis.stockExposure[0]?.exposurePct || 0).toFixed(1)),
            effectiveExposureCount: analysis.effectiveExposureCount,
            redundancyScore: parseFloat(redundancyScore.toFixed(1)),
            topDriverConcentration: parseFloat(topDriverConcentration.toFixed(1)),
            totalValue: analysis.totalValue,
            totalStocks: analysis.stockExposure.length,
            overlapVerdict: analysis.overlapVerdict
        },

        // Focus Zone (PRD §11.2)
        focusZone,

        // Fund Roles (PRD §7.4)
        fundRoles,

        // Why Explanation (PRD §11.3)
        whyExplanation,

        // Alignment Statement (PRD §11.4)
        alignment,

        // Scenarios (PRD §11.5) — max 3
        scenarios,

        // Detailed data for charts
        stockExposure: analysis.stockExposure.map(s => ({
            isin: s.isin,
            ticker: s.ticker,
            name: s.name,
            sector: s.sector,
            totalVal: s.totalVal,
            exposurePct: parseFloat(s.exposurePct.toFixed(2)),
            sourceCount: s.sourceCount,
            cap: classifyMarketCap(s.ticker)
        })),
        sectorExposure
    };
}

module.exports = { buildClarityReport, GOAL_PROFILES };
