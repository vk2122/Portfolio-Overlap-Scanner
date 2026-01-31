"use client";

import { useState, useEffect, useRef } from 'react';
import { fetchMarketData } from '../lib/loader';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

export default function PortfolioApp() {
    const [holdings, setHoldings] = useState([]);
    const [marketData, setMarketData] = useState({ stocks: [], funds: [] });
    const [result, setResult] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('manual');

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
    }, []);

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
        const list = (type === 'EQUITY' ? marketData.stocks : marketData.funds)
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
    const isCritical = topPct >= 15;

    const getJudgment = () => {
        if (topPct >= 15) return 'HIGH CONCENTRATION';
        if (topPct >= 7) return 'MODERATE CONCENTRATION';
        return 'LOW CONCENTRATION';
    };

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    return (
        <>
            <header className="header">
                <div className="brand">
                    UNSTACKED <span className="tagline">— Diversified? Check again.</span>
                </div>
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
                    <div className="input-strip cas-strip" style={{ alignItems: 'flex-end', height: 'auto', minHeight: 'unset' }}>
                        <div className="field" style={{ flex: 1, gap: '0.2rem' }}>
                            <label style={{ marginBottom: '0.1rem' }}>CAS STATEMENT (PDF)</label>
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
                            REVEAL OVERLAP
                        </button>
                    </div>
                )}

                {activeTab === 'import' && importMsg && (
                    <div className="status-bar active" style={{ borderTop: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
                        {importMsg}
                    </div>
                )}

                {activeTab === 'manual' && (
                    <>
                        <div className={`status-bar ${calculating ? 'active' : ''} ${isCritical ? 'danger' : ''}`}>
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
                                    <div className={`huge-num ${isCritical ? 'risk' : ''}`}>{topPct.toFixed(1)}%</div>
                                    <div className="judgment">{getJudgment()}</div>
                                    <p className="interpretation">
                                        {cleanTicker(topStock?.ticker)} represents {topPct.toFixed(1)}% of your total exposure, across a total portfolio size of ₹{totalValue.toLocaleString()}.
                                    </p>
                                </div>
                            )}
                        </div>

                        {result && result.stockExposure?.length > 0 && (
                            <div className="details-zone">
                                <h4>TOP EXPOSURES</h4>
                                {result.stockExposure.slice(0, 5).map(s => (
                                    <div key={s.isin} className={`exposure-row ${s.exposurePct >= 15 ? 'danger' : ''}`}>
                                        <span className="ticker">{cleanTicker(s.ticker)}</span>
                                        <span className="pct">{s.exposurePct.toFixed(1)}%</span>
                                    </div>
                                ))}
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
