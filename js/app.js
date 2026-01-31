import { STOCKS, FUNDS } from './data/mock-db.js';
import { calculatePortfolioExposure } from './engine/calculator.js';

// State
let userHoldings = [];

// DOM Elements
const form = document.getElementById('add-holding-form');
const typeSelect = document.getElementById('instrument-type');
const instrumentSelect = document.getElementById('instrument-select');
const holdingsList = document.getElementById('holdings-list');
const resultsArea = document.getElementById('results-area');
const emptyStateResults = document.getElementById('empty-state-results');
const totalValueEl = document.getElementById('total-portfolio-value');
const topStockEl = document.getElementById('top-concentration-stock');
const exposureListEl = document.getElementById('exposure-list');
const tabBtns = document.querySelectorAll('.tab-btn');

// Import Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-upload');
const importText = document.getElementById('import-text');
const processImportBtn = document.getElementById('process-import-btn');
const importMsg = document.getElementById('import-msg');

// Initialization
function init() {
    populateInstrumentSelect('EQUITY');

    // Event Listeners
    typeSelect.addEventListener('change', (e) => {
        populateInstrumentSelect(e.target.value);
    });

    form.addEventListener('submit', handleAddHolding);

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.disabled) return;

            const targetTab = e.target.dataset.tab;

            // Update Buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update Content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            if (targetTab === 'manual') {
                document.getElementById('manual-entry').classList.remove('hidden');
            } else {
                document.getElementById('import-entry').classList.remove('hidden');
            }
        });
    });

    // Import Listeners
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-primary)';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-border)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--color-border)';
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFile(e.target.files[0]);
            }
        });

        processImportBtn.addEventListener('click', processImportText);
    }
}

// Populate Select Options
function populateInstrumentSelect(type) {
    instrumentSelect.innerHTML = '<option value="" disabled selected>Select...</option>';

    let options = [];
    if (type === 'EQUITY') {
        options = STOCKS.map(s => ({ value: s.isin, label: `${s.ticker} - ${s.name}` }));
    } else if (type === 'MF') {
        options = FUNDS.filter(f => f.type === 'MF').map(f => ({ value: f.id, label: f.name }));
    } else if (type === 'ETF') {
        options = FUNDS.filter(f => f.type === 'ETF').map(f => ({ value: f.id, label: f.name }));
    }

    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        instrumentSelect.appendChild(el);
    });
}

// Handle Add Holding
function handleAddHolding(e) {
    e.preventDefault();

    const type = typeSelect.value;
    const id = instrumentSelect.value;
    const value = parseFloat(document.getElementById('market-value').value);

    // Get Name for UI
    let name = '';
    if (type === 'EQUITY') {
        const s = STOCKS.find(x => x.isin === id);
        name = s ? s.ticker : id;
    } else {
        const f = FUNDS.find(x => x.id === id);
        name = f ? f.name : id;
    }

    const holding = {
        id: Date.now(), // internal ID
        instrumentId: id,
        type,
        name,
        value
    };

    userHoldings.push(holding);

    // Reset Form
    document.getElementById('market-value').value = '';
    instrumentSelect.value = '';
    instrumentSelect.focus();

    updateUI();
}

// Handle File Import
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        importText.value = e.target.result;
        importMsg.textContent = "File loaded. Click Process Import to analyze.";
        importMsg.className = "import-msg success";
    };
    reader.onerror = () => {
        importMsg.textContent = "Error reading file.";
        importMsg.className = "import-msg error";
    };
    reader.readAsText(file);
}

// Process Import Text
function processImportText() {
    const text = importText.value.trim();
    if (!text) {
        importMsg.textContent = "Please enter data or upload a file.";
        importMsg.className = "import-msg error";
        return;
    }

    try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
            throw new Error("Data must be an array of holdings.");
        }

        // Validate items
        const validHoldings = [];
        let skipped = 0;

        data.forEach(item => {
            let instrumentId = item.id || item.isin;
            let type = item.type ? item.type.toUpperCase() : 'EQUITY';
            let value = parseFloat(item.value);

            if (!instrumentId || isNaN(value)) {
                skipped++;
                return;
            }

            // check if exists in DB (to get name)
            let name = instrumentId;
            if (type === 'EQUITY') {
                const s = STOCKS.find(x => x.isin === instrumentId);
                if (s) name = s.ticker;
            } else {
                const f = FUNDS.find(x => x.id === instrumentId);
                if (f) name = f.name;
            }

            validHoldings.push({
                id: Date.now() + Math.random(),
                instrumentId: instrumentId,
                type: type,
                name: name,
                value: value
            });
        });

        if (validHoldings.length === 0) {
            throw new Error("No valid holdings found in input.");
        }

        userHoldings = [...userHoldings, ...validHoldings];
        updateUI();

        importMsg.textContent = `Successfully imported ${validHoldings.length} holdings. ${skipped > 0 ? skipped + " skipped." : ""}`;
        importMsg.className = "import-msg success";

        // Switch back to manual tab logic requires unhiding manual and hiding import? 
        // Or just let user see confirmation.
        // Let's scroll to results area
        setTimeout(() => {
            document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
        }, 500);

    } catch (err) {
        importMsg.textContent = "Invalid format: " + err.message;
        importMsg.className = "import-msg error";
    }
}


// Remove Holding
window.removeHolding = function (id) {
    userHoldings = userHoldings.filter(h => h.id !== id);
    updateUI();
};

function formatCurrency(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num);
}

// Update All UI Elements
function updateUI() {
    renderHoldingsList();

    if (userHoldings.length === 0) {
        resultsArea.classList.add('hidden');
        emptyStateResults.classList.remove('hidden');
        return;
    }

    // Calculation
    // Map internal holdings to format expected by calculator
    // Check if duplicate IDs need merging? Calculator summing logic handles duplicate additions of same stock, 
    // but calculator expects unique entries or sums them up? 
    // Logic: holdings.forEach... stock.directVal += value. So it handles multiple entries of same stock fine.

    const calculationInput = userHoldings.map(h => ({
        type: h.type,
        id: h.instrumentId,
        value: h.value
    }));

    const result = calculatePortfolioExposure(calculationInput);
    renderResults(result);
}

function renderHoldingsList() {
    holdingsList.innerHTML = '';

    if (userHoldings.length === 0) {
        holdingsList.classList.add('empty');
        holdingsList.innerHTML = '<p class="placeholder-text">No holdings added yet.</p>';
        return;
    }

    holdingsList.classList.remove('empty');

    userHoldings.forEach(h => {
        const el = document.createElement('div');
        el.className = 'holding-item';
        el.innerHTML = `
            <div class="holding-info">
                <div>${h.name}</div>
                <div>${h.type}</div>
            </div>
            <div style="display:flex; align-items:center;">
                <div class="holding-value">${formatCurrency(h.value)}</div>
                <button class="delete-btn" onclick="removeHolding(${h.id})">×</button>
            </div>
        `;
        holdingsList.appendChild(el);
    });
}

function renderResults(data) {
    resultsArea.classList.remove('hidden');
    emptyStateResults.classList.add('hidden');

    totalValueEl.textContent = formatCurrency(data.totalPortfolioValue);

    if (data.stockExposures.length > 0) {
        topStockEl.textContent = `${data.stockExposures[0].ticker} (${data.stockExposures[0].exposurePercent.toFixed(1)}%)`;
    } else {
        topStockEl.textContent = '-';
    }

    // Render Top 5
    exposureListEl.innerHTML = '';
    const top5 = data.stockExposures.slice(0, 5);

    top5.forEach(stock => {
        const isConcentrated = stock.exposurePercent >= 5;
        const total = stock.exposurePercent;

        const directPct = (stock.directVal / stock.totalValue) * 100;
        const mfPct = (stock.mfVal / stock.totalValue) * 100;
        const etfPct = (stock.etfVal / stock.totalValue) * 100;

        const directWidth = (stock.directVal / data.totalPortfolioValue) * 100;
        const mfWidth = (stock.mfVal / data.totalPortfolioValue) * 100;
        const etfWidth = (stock.etfVal / data.totalPortfolioValue) * 100;

        const el = document.createElement('div');
        el.className = 'exposure-bar-container';
        el.innerHTML = `
            <div class="exposure-header">
                <span class="stock-name">${stock.ticker}</span>
                <span class="total-percent ${isConcentrated ? 'warn' : ''}">${total.toFixed(2)}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-segment seg-direct" style="width: ${directWidth}%" title="Direct: ${directPct.toFixed(0)}%"></div>
                <div class="progress-segment seg-mf" style="width: ${mfWidth}%" title="MF: ${mfPct.toFixed(0)}%"></div>
                <div class="progress-segment seg-etf" style="width: ${etfWidth}%" title="ETF: ${etfPct.toFixed(0)}%"></div>
            </div>
            <div class="exposure-breakdown">
                ${stock.directVal > 0 ? `<span><span class="dot bg-direct"></span>Direct ${(directPct).toFixed(0)}%</span>` : ''}
                ${stock.mfVal > 0 ? `<span><span class="dot bg-mf"></span>MF ${(mfPct).toFixed(0)}%</span>` : ''}
                ${stock.etfVal > 0 ? `<span><span class="dot bg-etf"></span>ETF ${(etfPct).toFixed(0)}%</span>` : ''}
            </div>
            ${isConcentrated ? `<div class="warning-flag">⚠️ Concentrated Exposure (>5%)</div>` : ''}
        `;
        exposureListEl.appendChild(el);
    });
}

// Start
init();
