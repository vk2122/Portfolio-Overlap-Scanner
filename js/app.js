import { STOCKS, FUNDS } from './data/mock-db.js';
import { calculatePortfolioExposure } from './engine/calculator.js';
import { fetchMarketData } from './data/loader.js';

// State
let userHoldings = [];
let marketData = { stocks: STOCKS, funds: FUNDS }; // Initial Mock Data

// DOM Elements
const form = document.getElementById('add-holding-form');
const typeSelect = document.getElementById('instrument-type');
const instrumentSelect = document.getElementById('instrument-select'); // Legacy ref
const instrumentSearch = document.getElementById('instrument-search');
const instrumentIdInput = document.getElementById('instrument-id');
const searchResults = document.getElementById('search-results');
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
async function init() {
    // Search State
    instrumentSearch.placeholder = "Loading data...";
    instrumentSearch.disabled = true;

    // Fetch Data
    try {
        const data = await fetchMarketData();
        marketData = data;
        instrumentSearch.placeholder = "Search by name or ticker...";
        instrumentSearch.disabled = false;
    } catch (e) {
        console.error("Init failed", e);
        instrumentSearch.placeholder = "Error loading data";
    }

    // Search Listener
    instrumentSearch.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    // Hide search on click outside
    document.addEventListener('click', (e) => {
        if (!instrumentSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Event Listeners
    typeSelect.addEventListener('change', (e) => {
        // Clear search when type changes
        instrumentSearch.value = '';
        instrumentIdInput.value = '';
        searchResults.classList.add('hidden');
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

// Search Handler
function handleSearch(query) {
    if (!query || query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    const type = typeSelect.value;
    const q = query.toLowerCase();

    let options = [];
    if (type === 'EQUITY') {
        options = marketData.stocks.filter(s =>
            (s.ticker && s.ticker.toLowerCase().includes(q)) ||
            (s.name && s.name.toLowerCase().includes(q))
        ).map(s => ({
            id: s.isin,
            main: s.ticker,
            sub: s.name
        }));
    } else {
        // MF or ETF
        const isEtf = type === 'ETF';
        options = marketData.funds.filter(f => {
            const matchName = f.name.toLowerCase().includes(q);
            const matchType = isEtf ?
                (f.type === 'ETF' || (f.name && f.name.includes('ETF'))) :
                (f.type === 'MF' || !f.name.includes('ETF'));
            return matchName && matchType;
        }).map(f => ({
            id: f.id,
            main: f.name,
            sub: isEtf ? 'ETF' : 'Mutual Fund'
        }));
    }

    // Limit results
    options = options.slice(0, 20);

    if (options.length === 0) {
        searchResults.innerHTML = '<div class="result-item">No matches found</div>';
    } else {
        searchResults.innerHTML = '';
        options.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <div class="result-main">${opt.main}</div>
                <div class="result-sub">${opt.sub}</div>
            `;
            div.addEventListener('click', () => {
                selectInstrument(opt);
            });
            searchResults.appendChild(div);
        });
    }

    searchResults.classList.remove('hidden');
}

function selectInstrument(opt) {
    instrumentSearch.value = opt.main; // Show Ticker or Name
    instrumentIdInput.value = opt.id;
    searchResults.classList.add('hidden');
}

// Handle Add Holding
function handleAddHolding(e) {
    e.preventDefault();

    const type = typeSelect.value;
    const id = instrumentIdInput.value; // Use hidden ID
    const value = parseFloat(document.getElementById('market-value').value);

    // Validate
    if (!id) {
        alert("Please select a valid instrument from the search results.");
        return;
    }

    // Get Name for UI
    let name = instrumentSearch.value;
    // (Name is already in input, but we might want full details from DB if needed)

    // We already have ID.
    // If name is empty (user typed but didn't click), we might want to warn.
    // But we check ID existence.

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
    instrumentSearch.value = '';
    instrumentIdInput.value = '';
    instrumentSearch.focus();

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
                const s = marketData.stocks.find(x => x.isin === instrumentId);
                if (s) name = s.ticker;
            } else {
                const f = marketData.funds.find(x => x.id === instrumentId);
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

        // Scroll to results area
        setTimeout(() => {
            document.getElementById('output-section').scrollIntoView({ behavior: 'smooth' });
        }, 500);

    } catch (e) {
        importMsg.textContent = "Error: " + e.message;
        importMsg.className = "import-msg error";
    }
}

// Update UI
function updateUI() {
    renderHoldings();

    if (userHoldings.length === 0) {
        resultsArea.classList.add('hidden');
        emptyStateResults.classList.remove('hidden');
        return;
    }

    resultsArea.classList.remove('hidden');
    emptyStateResults.classList.add('hidden');

    const result = calculatePortfolioExposure(userHoldings);
    renderResults(result);
}

// Render Holdings List
function renderHoldings() {
    holdingsList.innerHTML = '';

    if (userHoldings.length === 0) {
        holdingsList.innerHTML = '<div class="empty-holdings">No holdings added yet.</div>';
        return;
    }

    userHoldings.forEach(h => {
        const item = document.createElement('div');
        item.className = 'holding-item';
        item.innerHTML = `
            <div class="holding-info">
                <div class="holding-name">${h.name}</div>
                <div class="holding-meta">${h.type === 'EQUITY' ? 'Stock' : h.type} • ₹${h.value.toLocaleString()}</div>
            </div>
            <button class="remove-btn" title="Remove">&times;</button>
        `;

        item.querySelector('.remove-btn').addEventListener('click', () => {
            removeHolding(h.id);
        });

        holdingsList.appendChild(item);
    });
}

function removeHolding(id) {
    userHoldings = userHoldings.filter(h => h.id !== id);
    updateUI();
}

// Render Results
function renderResults(result) {
    totalValueEl.textContent = `₹${result.totalValue.toLocaleString()}`;

    // Top Concentration
    const topStock = result.stockExposure[0];
    if (topStock) {
        topStockEl.textContent = `${topStock.ticker} (${topStock.exposurePct.toFixed(1)}%)`;
    } else {
        topStockEl.textContent = '-';
    }

    // Render List
    exposureListEl.innerHTML = '';
    const topStocks = result.stockExposure.slice(0, 5);

    topStocks.forEach(stock => {
        const card = document.createElement('div');
        card.className = 'exposure-card';
        if (stock.exposurePct >= 5) card.classList.add('alert'); // Threshold

        const directPct = (stock.directVal / result.totalValue) * 100;
        const mfPct = (stock.mfVal / result.totalValue) * 100;
        const etfPct = (stock.etfVal / result.totalValue) * 100;

        // Visual bars
        const maxPct = stock.exposurePct;
        const directWidth = (directPct / maxPct) * 100;
        const mfWidth = (mfPct / maxPct) * 100;
        const etfWidth = (etfPct / maxPct) * 100;

        const isConcentrated = stock.exposurePct >= 5;

        card.innerHTML = `
            <div class="exposure-header">
                <div>
                    <span class="stock-ticker">${stock.ticker}</span>
                    <span class="stock-name">${stock.name}</span>
                </div>
                <span class="total-percent ${isConcentrated ? 'warn' : ''}">${stock.exposurePct.toFixed(2)}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-segment seg-direct" style="width: ${directWidth}%" title="Stocks: ${directPct.toFixed(0)}%"></div>
                <div class="progress-segment seg-mf" style="width: ${mfWidth}%" title="MF: ${mfPct.toFixed(0)}%"></div>
                <div class="progress-segment seg-etf" style="width: ${etfWidth}%" title="ETF: ${etfPct.toFixed(0)}%"></div>
            </div>
            <div class="exposure-breakdown">
                ${stock.directVal > 0 ? `<span><span class="dot bg-direct"></span>Stocks ${(directPct).toFixed(0)}%</span>` : ''}
                ${stock.mfVal > 0 ? `<span><span class="dot bg-mf"></span>MF ${(mfPct).toFixed(0)}%</span>` : ''}
                ${stock.etfVal > 0 ? `<span><span class="dot bg-etf"></span>ETF ${(etfPct).toFixed(0)}%</span>` : ''}
            </div>
            ${isConcentrated ? '<div class="alert-badge">High Concentration Risk</div>' : ''}
        `;

        exposureListEl.appendChild(card);
    });
}


// Start
init();
