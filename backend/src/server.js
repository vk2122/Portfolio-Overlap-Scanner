const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { calculatePortfolioExposure } = require('./calculator');
const { buildClarityReport, GOAL_PROFILES } = require('./clarity-engine');
const { STOCKS, ETFS, FUNDS } = require('./mock-db');

console.log('[UNSTACKED v2.0] Clarity Engine loaded successfully.');
console.log(`[UNSTACKED v2.0] DB: ${STOCKS.length} stocks, ${ETFS.length} ETFs, ${FUNDS.length} funds`);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// API Endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0', timestamp: new Date() });
});

/**
 * v2.0 — Full Clarity Report
 * Accepts: { holdings: [...], goal: { investmentGoal, timeHorizon } }
 * Returns: Complete clarity engine output
 */
app.post('/api/calculate', (req, res) => {
    try {
        const { holdings, goal } = req.body;
        if (!holdings || !Array.isArray(holdings)) {
            return res.status(400).json({ error: 'Holdings must be an array' });
        }
        console.log(`[CALC] Processing ${holdings.length} holdings with goal:`, goal || 'none');
        const results = buildClarityReport(holdings, goal || null);
        console.log(`[CALC] Report: overlap=${results.summary.overlapPct}%, stocks=${results.summary.totalStocks}, topDriver=${results.summary.topDriverStock}`);
        res.json(results);
    } catch (error) {
        console.error('Calculation error:', error.message, error.stack);
        res.status(500).json({ error: 'Internal server error', detail: error.message });
    }
});

/**
 * v1 legacy — raw exposure calculation (kept for backward compat)
 */
app.post('/api/calculate/legacy', (req, res) => {
    try {
        const { holdings } = req.body;
        if (!holdings || !Array.isArray(holdings)) {
            return res.status(400).json({ error: 'Holdings must be an array' });
        }
        const results = calculatePortfolioExposure(holdings);
        res.json(results);
    } catch (error) {
        console.error('Legacy calculation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/market-data', (req, res) => {
    res.json({ stocks: STOCKS, etfs: ETFS, funds: FUNDS });
});

app.get('/api/goal-profiles', (req, res) => {
    res.json(GOAL_PROFILES);
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

module.exports = app;
