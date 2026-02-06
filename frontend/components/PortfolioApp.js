"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { fetchMarketData } from '../lib/loader';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

const STORAGE_KEY = 'unstacked_holdings';

export default function PortfolioApp() {
    const [holdings, setHoldings] = useState([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [marketData, setMarketData] = useState({ stocks: [], etfs: [], funds: [] });
    const [result, setResult] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');

    // UI state (charts / hover)
    const [hoverSlice, setHoverSlice] = useState(null); // { sector, x, y, pct, stocks: [] }

    // Form State
    const [type, setType] = useState('EQUITY');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [value, setValue] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showTypeResults, setShowTypeResults] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (formRef.current && !formRef.current.contains(e.target)) {
                setShowResults(false);
                setShowTypeResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Import State
    const [importText, setImportText] = useState('');
    const [importMsg, setImportMsg] = useState('');

    useEffect(() => {
        fetchMarketData().then(setMarketData).catch(console.error);
        // Load holdings from localStorage on mount
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHoldings(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to load holdings from localStorage:', e);
        }
        setIsHydrated(true);
    }, []);

    // Save holdings to localStorage whenever they change
    useEffect(() => {
        if (!isHydrated) return; // Don't save until initial load is complete
        try {
            if (holdings.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.error('Failed to save holdings to localStorage:', e);
        }
    }, [holdings, isHydrated]);

    useEffect(() => {
        if (holdings.length === 0) { setResult(null); return; }
        setCalculating(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/calculate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ holdings })
                });
                setResult(await res.json());
            } catch (e) { console.error(e); }
            setCalculating(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [holdings]);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
        const q = searchQuery.toLowerCase();
        let source = [];
        if (type === 'EQUITY') source = marketData.stocks || [];
        else if (type === 'ETF') source = marketData.etfs || [];
        else source = marketData.funds || [];

        const list = source
            .filter(i => (i.ticker || i.name || '').toLowerCase().includes(q))
            .slice(0, 8)
            .map(i => ({ id: i.isin || i.id, main: i.ticker || i.name, sub: i.name || '' }));
        setSearchResults(list);
    }, [searchQuery, type, marketData]);

    const addHolding = (e) => {
        e.preventDefault();
        if (!selectedInstrument || !value) return;
        setHoldings([...holdings, { id: Date.now(), instrumentId: selectedInstrument.id, type, name: selectedInstrument.main, value: parseFloat(value) }]);
        setSearchQuery(''); setValue(''); setSelectedInstrument(null);
    };

    const removeHolding = (id) => {
        setHoldings(prev => prev.filter(h => h.id !== id));
    };

    const clearAllHoldings = () => {
        if (window.confirm('Are you sure you want to clear all holdings? This will also remove your saved data.')) {
            setHoldings([]);
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
            }
        }
    };

    const processImport = () => {
        try {
            const data = JSON.parse(importText);
            const valid = data.map(item => {
                let id = item.isin || item.id || item.instrumentId;
                let val = parseFloat(item.value);
                let itemType = item.type || 'EQUITY';
                if (!id || isNaN(val)) return null;
                let name = id;
                if (itemType === 'EQUITY') {
                    const s = marketData.stocks.find(x => x.isin === id);
                    if (s) name = s.ticker;
                } else {
                    const f = marketData.funds.find(x => x.id === id);
                    if (f) name = f.name;
                }
                return { id: Date.now() + Math.random(), instrumentId: id, type: itemType, name, value: val };
            }).filter(Boolean);
            if (valid.length > 0) {
                setHoldings([...holdings, ...valid]);
                setImportText('');
                setImportMsg(`Imported ${valid.length} assets.`);
                setActiveTab('manual');
            }
        } catch (e) { setImportMsg('Invalid JSON structure.'); }
    };

    const topStock = result?.stockExposure?.[0];
    const topPct = topStock?.exposurePct || 0;
    const overlapPercent = result?.overlapPercent || 0;
    const diversificationScore = result?.diversificationScore || 0;
    const overlapVerdict = result?.overlapVerdict || 'LOW';
    const largestSector = result?.largestSectorExposure;
    const topOverlapPairs = result?.topOverlapPairs || [];
    const interpretation = result?.interpretation || '';
    const getRiskLevel = () => {
        if (topPct >= 15) return 'high';
        if (topPct >= 7) return 'medium';
        return 'low';
    };

    const riskLevel = getRiskLevel();

    const getJudgment = () => {
        if (riskLevel === 'high') return 'HIGH CONCENTRATION';
        if (riskLevel === 'medium') return 'MODERATE CONCENTRATION';
        return 'LOW CONCENTRATION';
    };

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    const overlapStocks = useMemo(() => {
        const stocks = result?.stockExposure || [];
        return stocks.filter(s => (s.sourceCount || 0) >= 2);
    }, [result]);

    const overlapBySector = useMemo(() => {
        const totals = new Map();
        overlapStocks.forEach(s => {
            const sector = s.sector || 'Unknown';
            totals.set(sector, (totals.get(sector) || 0) + (s.totalVal || 0));
        });
        const overlapValue = overlapStocks.reduce((sum, s) => sum + (s.totalVal || 0), 0);
        return Array.from(totals.entries())
            .map(([sector, val]) => ({
                sector,
                value: val,
                pct: overlapValue > 0 ? (val / overlapValue) * 100 : 0,
                stocks: overlapStocks
                    .filter(s => (s.sector || 'Unknown') === sector)
                    .sort((a, b) => (b.totalVal || 0) - (a.totalVal || 0))
            }))
            .sort((a, b) => b.value - a.value);
    }, [overlapStocks]);

    const pieSlices = useMemo(() => {
        const data = overlapBySector;
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (!total) return [];
        let startAngle = 0;
        const slices = [];
        for (const d of data) {
            const angle = (d.value / total) * 360;
            slices.push({
                ...d,
                startAngle,
                endAngle: startAngle + angle
            });
            startAngle += angle;
        }
        return slices;
    }, [overlapBySector]);

    // SVG arc helpers for pie
    const polarToCartesian = (cx, cy, r, angleDeg) => {
        const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
        return {
            x: cx + (r * Math.cos(angleRad)),
            y: cy + (r * Math.sin(angleRad))
        };
    };
    const describeDonutSlice = (cx, cy, rOuter, rInner, startAngle, endAngle) => {
        const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
        const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
        const startInner = polarToCartesian(cx, cy, rInner, startAngle);
        const endInner = polarToCartesian(cx, cy, rInner, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return [
            `M ${startOuter.x} ${startOuter.y}`,
            `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
            `L ${startInner.x} ${startInner.y}`,
            `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
            'Z'
        ].join(' ');
    };

    const chartPalette = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
        'var(--chart-6)'
    ];

    return (
        <>
            <header className="header">
                <div className="brand">
                    UNSTACKED <span className="tagline">— Diversified? Check again.</span>
                </div>
                <button
                    type="button"
                    className="header-clear-btn"
                    onClick={clearAllHoldings}
                    title="Clear all portfolio data from this device"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                    </svg>
                    RESET DATA
                </button>
            </header>

            <main className="main-flow">
                <div className="mode-toggle">
                    <button className={`mode-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>Manual Entry</button>
                    <button className={`mode-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>CAS Import</button>
                </div>

                {activeTab === 'manual' ? (
                    <form className="input-strip" onSubmit={addHolding} ref={formRef}>
                        <div className="field type-field">
                            <label>TYPE</label>
                            <div className="technical-select" onClick={() => setShowTypeResults(!showTypeResults)}>
                                <div className="current-value">
                                    {type === 'EQUITY' ? 'STOCKS' : type === 'MF' ? 'MUTUAL FUNDS' : 'ETFs'}
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                {showTypeResults && (
                                    <div className="search-results type-dropdown">
                                        <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('EQUITY'); setSearchQuery(''); setShowTypeResults(false); }}>STOCKS</div>
                                        <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('MF'); setSearchQuery(''); setShowTypeResults(false); }}>MUTUAL FUNDS</div>
                                        <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('ETF'); setSearchQuery(''); setShowTypeResults(false); }}>ETFs</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="field instrument-field">
                            <label>INSTRUMENT</label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                                autoComplete="off"
                            />
                            {showResults && searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(r => (
                                        <div key={r.id} className="result-item" onClick={() => {
                                            setSelectedInstrument(r);
                                            setSearchQuery(r.main);
                                            setShowResults(false);
                                        }}>
                                            <strong>{r.main}</strong>
                                            {r.sub && <span style={{ marginLeft: '0.5rem', opacity: 0.5, fontSize: '0.75rem' }}>{r.sub}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="field value-field">
                            <label>VALUE (₹)</label>
                            <input type="number" placeholder="50000" value={value} onChange={(e) => setValue(e.target.value)} />
                        </div>
                        <button type="submit" className="cta-reveal">ADD</button>
                    </form>
                ) : (
                    <div className="input-strip">
                        <div className="field">
                            <label>CAS STATEMENT (PDF)</label>
                            <div className="custom-file-input">
                                <input
                                    type="file"
                                    id="cas-upload"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) setImportMsg(`PDF Detected: ${file.name}`);
                                    }}
                                    className="hidden-file-input"
                                />
                                <label htmlFor="cas-upload" className="file-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>{importMsg.includes('PDF Detected') ? importMsg.replace('PDF Detected: ', '') : 'Select PDF Statement'}</span>
                                </label>
                            </div>
                        </div>
                        <button className="cta-reveal" onClick={() => alert("PDF Parsing Engine pending backend integration. Use Manual Entry for testing.")}>
                            ANALYZE
                        </button>
                    </div>
                )}

                {activeTab === 'import' && importMsg && (
                    <div className="status-bar active">
                        {importMsg}
                    </div>
                )}

                {activeTab === 'manual' && (
                    <>
                        {holdings.length > 0 && (
                            <div className="details-zone holdings-zone">
                                <div className="holdings-header">
                                    <h4>HOLDINGS</h4>
                                </div>
                                {holdings.map(h => (
                                    <div key={h.id} className="exposure-row">
                                        <span className="ticker">{cleanTicker(h.name)}</span>
                                        <span className="pct">₹{Number(h.value).toLocaleString()}</span>
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            aria-label={`Remove holding ${cleanTicker(h.name)}`}
                                            title="Remove holding"
                                            onClick={() => removeHolding(h.id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {result && holdings.length >= 2 && (
                            <div className="details-zone insights-zone">
                                <h4>OVERLAP INSIGHTS</h4>
                                <div className="insights-grid">
                                    <div className="insights-metrics">
                                        <div className="exposure-row">
                                            <span className="ticker">Overlap %</span>
                                            <span className="pct">{overlapPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="exposure-row">
                                            <span className="ticker">Diversification Score</span>
                                            <span className="pct">{diversificationScore.toFixed(1)}</span>
                                        </div>
                                        <div className="exposure-row">
                                            <span className="ticker">Overlap Verdict</span>
                                            <span className="pct">{overlapVerdict}</span>
                                        </div>

                                        {interpretation && (
                                            <p className="interpretation">{interpretation}</p>
                                        )}

                                        {largestSector && (
                                            <div className="exposure-row">
                                                <span className="ticker">Largest Sector Exposure</span>
                                                <span className="pct">
                                                    {largestSector.sector} · {largestSector.exposurePct.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}

                                        {topOverlapPairs.length > 0 && (
                                            <div className="overlap-pairs">
                                                <span className="ticker">Top Overlap Pairs</span>
                                                {topOverlapPairs.map(pair => (
                                                    <div key={pair.pair} className="exposure-row">
                                                        <span className="ticker">{pair.pair}</span>
                                                        <span className="pct">{pair.overlapPct.toFixed(1)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="insights-chart">
                                        <div className="chart-title">Overlap Composition (by sector)</div>

                                        {pieSlices.length === 0 ? (
                                            <div className="text-body-secondary" style={{ paddingTop: 8 }}>
                                                Add more overlapping holdings to see the sector breakdown.
                                            </div>
                                        ) : (
                                            <div className="chart-wrap">
                                                <svg
                                                    className="pie"
                                                    viewBox="0 0 200 200"
                                                    role="img"
                                                    aria-label="Overlap sector pie chart"
                                                    onMouseLeave={() => setHoverSlice(null)}
                                                >
                                                    <circle cx="100" cy="100" r="78" fill="var(--bg-primary)" opacity="0.55" />
                                                    {pieSlices.map((s, idx) => {
                                                        const d = describeDonutSlice(100, 100, 88, 52, s.startAngle, s.endAngle);
                                                        const fill = chartPalette[idx % chartPalette.length];
                                                        return (
                                                            <path
                                                                key={s.sector}
                                                                d={d}
                                                                fill={fill}
                                                                className="pie-slice"
                                                                onMouseMove={(e) => {
                                                                    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                                                                    setHoverSlice({
                                                                        sector: s.sector,
                                                                        pct: s.pct,
                                                                        x: e.clientX - rect.left,
                                                                        y: e.clientY - rect.top,
                                                                        stocks: s.stocks
                                                                    });
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </svg>

                                                {hoverSlice && (
                                                    <div
                                                        className="chart-tooltip"
                                                        style={{
                                                            left: Math.min(hoverSlice.x + 12, 260),
                                                            top: Math.max(hoverSlice.y - 10, 8)
                                                        }}
                                                    >
                                                        <div className="tt-title">
                                                            {hoverSlice.sector} · {hoverSlice.pct.toFixed(1)}%
                                                        </div>
                                                        <div className="tt-sub">Top overlap stocks</div>
                                                        <div className="tt-list">
                                                            {hoverSlice.stocks.slice(0, 6).map(st => (
                                                                <div key={st.isin} className="tt-row">
                                                                    <span className="tt-name">{cleanTicker(st.ticker || st.isin)}</span>
                                                                    <span className="tt-sector">{st.sector || 'Unknown'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="sector-details">
                                            {overlapBySector.slice(0, 6).map((s, idx) => (
                                                <div
                                                    key={s.sector}
                                                    className={`sector-row ${hoverSlice?.sector === s.sector ? 'active' : ''}`}
                                                    onMouseEnter={() => setHoverSlice({ sector: s.sector, pct: s.pct, x: 0, y: 0, stocks: s.stocks })}
                                                    onMouseLeave={() => setHoverSlice(null)}
                                                >
                                                    <span className="dot" style={{ background: chartPalette[idx % chartPalette.length] }} />
                                                    <span className="sector-name">{s.sector}</span>
                                                    <span className="sector-pct">{s.pct.toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`status-bar ${calculating ? 'active' : ''} ${result ? `risk-${riskLevel}` : ''}`}>
                            {calculating ? 'STATUS: ANALYZING EXPOSURE' : result ? 'STATUS: CONCENTRATION DETECTED' : 'STATUS: SCANNER IDLE'}
                        </div>

                        <div className="verdict-zone">
                            {!result ? (
                                <div className="verdict-empty">
                                    <h2>NO VERDICT YET.</h2>
                                    <p className="sub">Add holdings to surface your concentration risk.</p>
                                    <span className="system-note">The scanner is currently idle.</span>
                                </div>
                            ) : (
                                <div className="verdict-result">
                                    <div className={`huge-num highlight risk-${riskLevel}`}>{topPct.toFixed(1)}%</div>
                                    <div className={`judgment risk-${riskLevel}`}>{getJudgment()}</div>
                                    <p className="interpretation">
                                        {cleanTicker(topStock?.ticker)} represents {topPct.toFixed(1)}% of your total exposure, across a total portfolio size of ₹{totalValue.toLocaleString()}.
                                    </p>
                                </div>
                            )}
                        </div>

                        {result && result.stockExposure?.length > 0 && (
                            <div className="details-zone">
                                <h4>TOP EXPOSURES</h4>
                                {result.stockExposure.slice(0, 5).map(s => {
                                    const sRisk = s.exposurePct >= 15 ? 'high' : s.exposurePct >= 7 ? 'medium' : 'low';
                                    const maxPct = result.stockExposure?.[0]?.exposurePct || 1;
                                    const width = Math.max(2, Math.min(100, (s.exposurePct / maxPct) * 100));
                                    return (
                                        <div key={s.isin} className={`exposure-row risk-${sRisk}`}>
                                            <span className="ticker">{cleanTicker(s.ticker)}</span>
                                            <span className="pct">
                                                {s.exposurePct.toFixed(1)}%
                                                <span className="mini-bar" aria-hidden="true">
                                                    <span className={`mini-fill risk-${sRisk}`} style={{ width: `${width}%` }} />
                                                </span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main >

            <footer className="disclaimer-section">
                <span className="disclaimer-label">DISCLAIMER</span>
                <span className="disclaimer-text">For informational purposes only. Not investment advice. Past data does not guarantee future outcomes.</span>
            </footer>
        </>
    );
}
