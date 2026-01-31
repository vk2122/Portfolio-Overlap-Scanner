const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { calculatePortfolioExposure } = require('./calculator');
const { STOCKS, FUNDS } = require('./mock-db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// API Endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/calculate', (req, res) => {
    try {
        const { holdings } = req.body;
        if (!holdings || !Array.isArray(holdings)) {
            return res.status(400).json({ error: 'Holdings must be an array' });
        }
        const results = calculatePortfolioExposure(holdings);
        res.json(results);
    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/market-data', (req, res) => {
    res.json({ stocks: STOCKS, funds: FUNDS });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

module.exports = app;
