"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { fetchMarketData } from '../lib/loader';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

const STORAGE_KEY = 'unstacked_holdings';
const GOAL_KEY = 'unstacked_goal';

export default function PortfolioApp() {
    const [holdings, setHoldings] = useState([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [marketData, setMarketData] = useState({ stocks: [], etfs: [], funds: [] });
    const [result, setResult] = useState(null);
    const [calculating, setCalculating] = useState(false);

    // Goal state (mandatory for v2.0)
    const [goal, setGoal] = useState({ investmentGoal: null, timeHorizon: null });

    // UI state
    const [hoverSlice, setHoverSlice] = useState(null);
    const [expandedScenario, setExpandedScenario] = useState(null);
    const [activeCard, setActiveCard] = useState(null); // { type, result }

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
            const savedGoal = localStorage.getItem(GOAL_KEY);
            if (savedGoal) {
                const parsedGoal = JSON.parse(savedGoal);
                if (parsedGoal.investmentGoal) {
                    setGoal(parsedGoal);
                }
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
        setIsHydrated(true);
    }, []);

    // Save holdings to localStorage whenever they change
    useEffect(() => {
        if (!isHydrated) return;
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

    // Save goal to localStorage
    useEffect(() => {
        if (!isHydrated) return;
        try {
            if (goal.investmentGoal) {
                localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
            } else {
                localStorage.removeItem(GOAL_KEY);
            }
        } catch (e) {
            console.error('Failed to save goal:', e);
        }
    }, [goal, isHydrated]);

    // Run calculation when holdings or goal change
    useEffect(() => {
        if (holdings.length === 0) { setResult(null); return; }
        setCalculating(true);
        // Clear stale result immediately so we don't show old data while fetching
        setResult(null);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/calculate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ holdings, goal: goal.investmentGoal ? goal : null })
                });
                const data = await res.json();
                if (!res.ok) {
                    console.error('[UNSTACKED] API Error:', res.status, data);
                } else if (!data.summary) {
                    // Backend returned old v1 format — server needs restart
                    console.error('[UNSTACKED] Old API format detected. Please restart the backend server.');
                } else {
                    console.log('[UNSTACKED] Report received:', data.summary);
                    setResult(data);
                }
            } catch (e) { console.error('[UNSTACKED] Fetch failed:', e); }
            setCalculating(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [holdings, goal]);

    // Search logic
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
        if (window.confirm('Clear all holdings and goal data?')) {
            setHoldings([]);
            setGoal({ investmentGoal: null, timeHorizon: null });
            setResult(null);
            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(GOAL_KEY);
            } catch (e) {
                console.error('Failed to clear localStorage:', e);
            }
        }
    };

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    // Donut chart data from sector exposure
    const pieSlices = useMemo(() => {
        const data = result?.sectorExposure || [];
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (!total) return [];
        let startAngle = 0;
        const slices = [];
        for (const d of data) {
            const angle = (d.value / total) * 360;
            slices.push({ ...d, startAngle, endAngle: startAngle + angle });
            startAngle += angle;
        }
        return slices;
    }, [result]);

    // SVG arc helpers
    const polarToCartesian = (cx, cy, r, angleDeg) => {
        const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
        return { x: cx + (r * Math.cos(angleRad)), y: cy + (r * Math.sin(angleRad)) };
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
        'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
        'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'
    ];

    const getRoleBadgeClass = (role) => {
        if (role === 'CORE_DRIVER') return 'role-badge role-core';
        if (role === 'OVERLAP_CONTRIBUTOR') return 'role-badge role-overlap';
        return 'role-badge role-minor';
    };

    const getRoleLabel = (role) => {
        if (role === 'CORE_DRIVER') return 'Core Driver';
        if (role === 'OVERLAP_CONTRIBUTOR') return 'Overlap Contributor';
        return 'Minor Contributor';
    };

    const goalIsSet = goal.investmentGoal && goal.timeHorizon;

    // ─── Health Score Calculation ─────────────────────────────────────────────
    const healthScore = useMemo(() => {
        if (!result || !result.summary) return null;
        
        let concScore = 0;
        const ens = result.summary.effectiveExposureCount || 0;
        if (ens >= 50) concScore = 95;
        else if (ens >= 25) concScore = 75;
        else concScore = 40;
        
        const top5 = result.stockExposure?.slice(0, 5).reduce((sum, s) => sum + (s.exposurePct || 0), 0) || 0;
        if (top5 > 50) concScore -= 20;
        
        const top1 = result.summary.topDriverStockPct || 0;
        if (top1 > 10) concScore -= 15;
        concScore = Math.max(0, concScore);

        let overlapScore = 0;
        const ovp = result.summary.overlapPct || 0;
        if (ovp < 20) overlapScore = 95;
        else if (ovp <= 40) overlapScore = 75;
        else overlapScore = 40;

        let sectScore = 0;
        const maxSect = result.sectorExposure?.[0]?.value || 0;
        const totalSect = result.sectorExposure?.reduce((sum, s) => sum + s.value, 0) || 1;
        const maxSectPct = (maxSect / totalSect) * 100;
        if (maxSectPct < 30) sectScore = 95;
        else if (maxSectPct <= 50) sectScore = 75;
        else sectScore = 40;

        const riskScore = 70;
        const corrScore = 65;

        const finalScore = Math.round((0.30 * concScore) + (0.20 * overlapScore) + (0.20 * sectScore) + (0.20 * riskScore) + (0.10 * corrScore));
        
        let interp = "FRAGILE";
        let interpFull = "FRAGILE – High vulnerability";
        if (finalScore >= 80) { interp = "ELITE"; interpFull = "ELITE – Institutional grade"; }
        else if (finalScore >= 65) { interp = "GOOD"; interpFull = "GOOD – Minor inefficiencies"; }
        else if (finalScore >= 50) { interp = "RISKY"; interpFull = "RISKY – Hidden bottlenecks"; }
        
        return { finalScore, interp, interpFull, concScore, overlapScore, sectScore, riskScore, corrScore, ens, top5, ovp, maxSectPct };
    }, [result]);

    // ─── Card Drawer ──────────────────────────────────────────────────────────
    const CARD_META = {
        overlap: {
            title: 'Portfolio Overlap',
            icon: '⟳',
            explain: 'Overlap is the percentage of your total portfolio value that is held by more than one instrument simultaneously. A stock appearing in both a mutual fund and your direct equity holdings counts as overlap.',
            scale: [{ label: 'Low  (0–20%)', color: 'var(--success)' }, { label: 'Medium  (20–40%)', color: 'var(--warning)' }, { label: 'High  (40%+)', color: 'var(--danger)' }],
            getData: (r) => r?.stockExposure?.filter(s => s.sourceCount >= 2).slice(0, 5).map(s => ({
                label: s.ticker, value: `${s.exposurePct?.toFixed(1)}%`, sub: s.name
            })) || []
        },
        redundancy: {
            title: 'Redundancy Score',
            icon: '⊗',
            explain: 'Redundancy Score equals the overlap percentage — it reflects how much of your invested capital is duplicated across funds. A high score means multiple instruments are giving you the same underlying exposure.',
            scale: [{ label: 'Healthy (0–20%)', color: 'var(--success)' }, { label: 'Review  (20–40%)', color: 'var(--warning)' }, { label: 'Concern (40%+)', color: 'var(--danger)' }],
            getData: (r) => r?.stockExposure?.filter(s => s.sourceCount >= 2).slice(0, 5).map(s => ({
                label: s.ticker, value: `×${s.sourceCount} funds`, sub: `₹${s.totalVal?.toLocaleString()} duplicated`
            })) || []
        },
        topDriver: {
            title: 'Top Concentration Driver',
            icon: '◎',
            explain: 'The single stock with the largest share of your total portfolio. A concentrated position can amplify both gains and losses from one company.',
            scale: [],
            getData: () => [] // List disabled to give full space to the chart
        },
        top3: {
            title: 'Top 3 Concentration',
            icon: '▲',
            explain: 'The combined exposure of your top 3 stocks as a percentage of your total portfolio. Values above 50% indicate high dependency on three names regardless of how many instruments you hold.',
            scale: [{ label: 'Spread  (<40%)', color: 'var(--success)' }, { label: 'Moderate (40–60%)', color: 'var(--warning)' }, { label: 'Concentrated (60%+)', color: 'var(--danger)' }],
            getData: (r) => r?.stockExposure?.slice(0, 3).map(s => ({
                label: s.ticker, value: `${s.exposurePct?.toFixed(1)}%`, sub: s.sector || 'Equity'
            })) || []
        },
        effective: {
            title: 'Unified Portfolio Health Score',
            icon: '◈',
            explain: 'A comprehensive evaluation of your portfolio’s true risk, blending concentration, overlap, and sector metrics into a unified institution-grade health score.',
            scale: [ { label: '<50 (Fragile)', color: 'var(--danger)' }, { label: '50-65 (Risky)', color: '#f5a623' }, { label: '65-80 (Good)', color: '#a0aec0' }, { label: '80+ (Elite)', color: 'var(--success)' } ],
            getData: () => {
                const hs = healthScore;
                if (!hs) return [];

                return [
                    { label: 'Unified Health Score', sub: hs.interpFull, value: `${hs.finalScore} / 100` },
                    { label: '1. Concentration', sub: `ENS: ${hs.ens.toFixed(1)} | Top 5: ${hs.top5.toFixed(1)}%`, value: hs.concScore },
                    { label: '2. Overlap', sub: `Common Holdings: ${hs.ovp.toFixed(1)}%`, value: hs.overlapScore },
                    { label: '3. Sector Balance', sub: `Max Sector: ${hs.maxSectPct.toFixed(1)}%`, value: hs.sectScore },
                    { label: '4. Risk-Adjusted Perf.', sub: 'Requires return history', value: hs.riskScore },
                    { label: '5. Correlation', sub: 'Requires matrix analysis', value: hs.corrScore }
                ];
            }
        },
        verdict: {
            title: 'Overlap Verdict',
            icon: '⬡',
            explain: 'A simple summary of your overlap level. LOW means your instruments are mostly complementary. HIGH means significant duplication — you may be paying for the same exposure multiple times.',
            scale: [{ label: 'LOW  — Complementary', color: 'var(--success)' }, { label: 'MEDIUM — Some duplication', color: 'var(--warning)' }, { label: 'HIGH  — Significant overlap', color: 'var(--danger)' }],
            getData: () => []
        }
    };

    function CardDrawer({ activeCard, result, onClose }) {
        const chartRef = useRef(null);
        const meta = CARD_META[activeCard];
        const ticker = result?.summary?.topDriverStock;

        // Close on Escape
        useEffect(() => {
            const handler = (e) => { if (e.key === 'Escape') onClose(); };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }, [onClose]);

        if (!meta) return null;
        const rows = meta.getData(result);

        // Generate TradingView iframe URL
        const getChartUrl = (sym) => {
            const cleanSym = String(sym).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            // BSE is often safer for strict widget matching without EQ suffixes
            const tvSymbol = encodeURIComponent(`BSE:${cleanSym}`);
            return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${tvSymbol}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=2b3139&studies=%5B%5D&theme=dark&style=2&timezone=Asia%2FKolkata&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=in`;
        };

        return (
            <div className="card-drawer-overlay" onClick={onClose}>
                <div className={`card-drawer ${activeCard === 'topDriver' ? 'drawer-large' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="card-drawer-header">
                        <span className="card-drawer-icon">{meta.icon}</span>
                        <span className="card-drawer-title">{meta.title}</span>
                        <button className="card-drawer-close" onClick={onClose} aria-label="Close">✕</button>
                    </div>

                    <p className="card-drawer-explain">{meta.explain}</p>

                    {/* TradingView chart for Top Driver */}
                    {activeCard === 'topDriver' && ticker && (
                        <div className="card-drawer-chart">
                            <iframe 
                                src={getChartUrl(ticker)}
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                allowTransparency="true" 
                                scrolling="no" 
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Scale legend */}
                    {meta.scale.length > 0 && (
                        <div className="card-drawer-scale">
                            {meta.scale.map((s, i) => (
                                <div key={i} className="scale-row">
                                    <span className="scale-dot" style={{ background: s.color }} />
                                    <span className="scale-label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Data rows */}
                    {rows.length > 0 && (
                        <div className="card-drawer-data">
                            <span className="card-drawer-data-title">
                                {activeCard === 'topDriver' ? 'Top Stock Exposures' :
                                 activeCard === 'overlap' || activeCard === 'redundancy' ? 'Overlapping Stocks' : 'Breakdown'}
                            </span>
                            {rows.map((row, i) => (
                                <div key={i} className="drawer-data-row">
                                    <div className="drawer-data-left">
                                        <span className="drawer-data-label">{row.label}</span>
                                        {row.sub && <span className="drawer-data-sub">{row.sub}</span>}
                                    </div>
                                    <span className="drawer-data-value">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="card-drawer-disclaimer">
                        This analysis is informational only. Not investment advice.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Card Drawer Portal */}
            {activeCard && result && (
                <CardDrawer activeCard={activeCard} result={result} onClose={() => setActiveCard(null)} />
            )}

            <header className="header">
                <div className="brand">
                    UNSTACKED <span className="tagline">— Know what you own.</span>
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
                    RESET
                </button>
            </header>

            <main className="main-flow">
                {/* ============================================
                    GOAL CAPTURE (Mandatory - PRD §5.1)
                    ============================================ */}
                <section className="goal-capture" id="goal-capture">
                    <h4>Define Your Objective</h4>
                    <div className="goal-row">
                        <div className="goal-group">
                            <label className="goal-label">INVESTMENT GOAL</label>
                            <div className="pill-group">
                                {['growth', 'stability', 'balanced'].map(g => (
                                    <button
                                        key={g}
                                        className={`pill ${goal.investmentGoal === g ? 'active' : ''}`}
                                        onClick={() => setGoal(prev => ({ ...prev, investmentGoal: prev.investmentGoal === g ? null : g }))}
                                    >
                                        {g === 'growth' ? '↗ Growth' : g === 'stability' ? '◆ Stability' : '⊞ Balanced'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="goal-group">
                            <label className="goal-label">TIME HORIZON</label>
                            <div className="pill-group">
                                {[{ key: '<3', label: '< 3 years' }, { key: '3-7', label: '3–7 years' }, { key: '7+', label: '7+ years' }].map(t => (
                                    <button
                                        key={t.key}
                                        className={`pill ${goal.timeHorizon === t.key ? 'active' : ''}`}
                                        onClick={() => setGoal(prev => ({ ...prev, timeHorizon: prev.timeHorizon === t.key ? null : t.key }))}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================
                    PORTFOLIO INPUT (Manual only - PRD §5.2)
                    ============================================ */}
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
                            placeholder="Search stocks, funds, ETFs..."
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
                    <button type="submit" className="cta-reveal" disabled={!selectedInstrument || !value}>ADD</button>
                </form>

                {/* ============================================
                    STATUS BAR
                    ============================================ */}
                <div className={`status-bar ${calculating ? 'active' : ''} ${result ? 'has-result' : ''}`}>
                    {calculating ? 'ANALYZING PORTFOLIO' : result ? 'CLARITY REPORT READY' : 'ENGINE IDLE'}
                </div>

                {/* ============================================
                    HOLDINGS LIST + FUND ROLES (PRD §7.4)
                    ============================================ */}
                {holdings.length > 0 && (
                    <div className="details-zone holdings-zone" id="holdings-zone">
                        <div className="holdings-header">
                            <h4 style={{marginBottom:0, paddingBottom:0, borderBottom:'none'}}>Holdings</h4>
                            <span className="holdings-count">{holdings.length} instrument{holdings.length !== 1 ? 's' : ''} · ₹{totalValue.toLocaleString()}</span>
                        </div>
                        {holdings.map(h => {
                            const fundRole = result?.fundRoles?.find(r => r.instrumentId === h.instrumentId);
                            return (
                                <div key={h.id} className="exposure-row holding-row">
                                    <div className="holding-info">
                                        <div className="holding-name-col">
                                            <span className="ticker">{cleanTicker(h.name)}</span>
                                            {fundRole && (
                                                <span className={getRoleBadgeClass(fundRole.role)}>
                                                    {getRoleLabel(fundRole.role)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="holding-actions">
                                        <div className="holding-value-col">
                                            <span className="pct">₹{Number(h.value).toLocaleString()}</span>
                                            <div className="holding-weight-bar">
                                                <div
                                                    className="holding-weight-fill"
                                                    style={{ width: `${totalValue > 0 ? Math.min((h.value / totalValue) * 100, 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
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
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ============================================
                    CLARITY REPORT — Only shown with results
                    ============================================ */}
                {result && holdings.length >= 2 && (
                    <>
                        {/* SUMMARY BLOCK (PRD §11.1) */}
                        <div className="details-zone summary-block" id="summary-block">
                            <h4>Portfolio Summary</h4>
                            <div className="metrics-grid">
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('overlap')} title="Click for explanation">
                                    <span className="metric-label">Overlap <span className="metric-info-icon">?</span></span>
                                    <span className="metric-value">{result.summary?.overlapPct ?? 0}%</span>
                                </div>
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('redundancy')} title="Click for explanation">
                                    <span className="metric-label">Redundancy Score <span className="metric-info-icon">?</span></span>
                                    <span className="metric-value">{result.summary?.redundancyScore ?? 0}%</span>
                                </div>
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('topDriver')} title="Click to view chart">
                                    <span className="metric-label">Top Driver <span className="metric-info-icon">↗</span></span>
                                    <span className="metric-value metric-highlight">{cleanTicker(result.summary?.topDriverStock) || '—'}</span>
                                    <span className="metric-sub">{result.summary?.topDriverStockPct ?? 0}% exposure</span>
                                </div>
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('top3')} title="Click for explanation">
                                    <span className="metric-label">Top 3 Concentration <span className="metric-info-icon">?</span></span>
                                    <span className="metric-value">{result.summary?.topDriverConcentration ?? 0}%</span>
                                </div>
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('effective')} title="Click for explanation">
                                    <span className="metric-label">Portfolio Health <span className="metric-info-icon">?</span></span>
                                    <span className={`metric-value verdict-${(healthScore?.interp || 'fragile').toLowerCase()}`}>
                                        {healthScore?.finalScore ?? 0}
                                    </span>
                                    <span className="metric-sub">{healthScore?.interp ?? '—'}</span>
                                </div>
                                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('verdict')} title="Click for explanation">
                                    <span className="metric-label">Overlap Verdict <span className="metric-info-icon">?</span></span>
                                    <span className={`metric-value verdict-${(result.summary?.overlapVerdict || 'low').toLowerCase()}`}>
                                        {result.summary?.overlapVerdict || 'LOW'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOCUS ZONE (PRD §11.2) */}
                        {result.focusZone?.focusStatement && (
                            <div className="details-zone focus-zone" id="focus-zone">
                                <h4>FOCUS ZONE</h4>
                                <p className="focus-statement">{result.focusZone.focusStatement}</p>
                                <div className="focus-drivers">
                                    {result.focusZone.topOverlapDrivers?.map(d => (
                                        <div key={d.ticker} className="driver-chip overlap-driver">
                                            <span className="driver-label">Overlap Driver</span>
                                            <span className="driver-ticker">{cleanTicker(d.ticker)}</span>
                                            <span className="driver-stat">{d.exposurePct?.toFixed(1)}% exposure · {d.sourceCount} sources</span>
                                        </div>
                                    ))}
                                    {result.focusZone.topConcentrationDriver && (
                                        <div className="driver-chip concentration-driver">
                                            <span className="driver-label">Concentration Driver</span>
                                            <span className="driver-ticker">{cleanTicker(result.focusZone.topConcentrationDriver.ticker)}</span>
                                            <span className="driver-stat">{result.focusZone.topConcentrationDriver.exposurePct?.toFixed(1)}% of portfolio</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* WHY EXPLANATION (PRD §11.3) */}
                        {result.whyExplanation && (
                            <div className="details-zone why-section" id="why-section">
                                <h4>WHY THIS HAPPENS</h4>
                                <div className="why-blocks">
                                    <div className="why-block">
                                        <span className="why-tag">OVERLAP</span>
                                        <p>{result.whyExplanation.overlapCause}</p>
                                    </div>
                                    <div className="why-block">
                                        <span className="why-tag">CONCENTRATION</span>
                                        <p>{result.whyExplanation.concentrationCause}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ALIGNMENT (PRD §11.4) */}
                        {result.alignment?.statement && (
                            <div className="details-zone alignment-section" id="alignment-section">
                                <h4>GOAL ALIGNMENT</h4>
                                <div className="alignment-header">
                                    <p className="alignment-statement">{result.alignment.statement}</p>
                                    {result.alignment.alignmentScore != null && (
                                        <div className={`alignment-score score-${result.alignment.alignmentScore >= 80 ? 'good' : result.alignment.alignmentScore >= 50 ? 'fair' : 'poor'}`}>
                                            <span className="score-value">{result.alignment.alignmentScore}</span>
                                            <span className="score-label">ALIGNMENT</span>
                                        </div>
                                    )}
                                </div>

                                {/* Divergence flags */}
                                {result.alignment.flags?.length > 0 && (
                                    <div className="alignment-flags">
                                        {result.alignment.flags.map((flag, i) => (
                                            <div key={i} className={`alignment-flag flag-${flag.severity}`}>
                                                <span className="flag-icon">{flag.severity === 'high' ? '⚠' : '◈'}</span>
                                                <span className="flag-text">{flag.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {result.alignment.details && (
                                    <div className="alignment-comparison">
                                        <div className="alignment-col">
                                            <span className="alignment-col-title">Your Portfolio</span>
                                            <div className="alignment-bar-group">
                                                <div className="alignment-bar-row">
                                                    <span>Large Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill" style={{ width: `${Math.min(result.alignment.details.actual.largeCap, 100)}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.actual.largeCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Mid Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill fill-mid" style={{ width: `${Math.min(result.alignment.details.actual.midCap, 100)}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.actual.midCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Small Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill fill-small" style={{ width: `${Math.min(result.alignment.details.actual.smallCap, 100)}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.actual.smallCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Overlap</span>
                                                    <div className="alignment-bar">
                                                        <div className={`alignment-fill ${result.alignment.details.actual.overlap > (result.alignment.details.reference.maxOverlap || 30) ? 'fill-danger' : ''}`} style={{ width: `${Math.min(result.alignment.details.actual.overlap, 100)}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.actual.overlap}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="alignment-col">
                                            <span className="alignment-col-title">{result.alignment.details.goal} Reference</span>
                                            <div className="alignment-bar-group">
                                                <div className="alignment-bar-row">
                                                    <span>Large Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill ref" style={{ width: `${result.alignment.details.reference.largeCap}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.reference.largeCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Mid Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill fill-mid ref" style={{ width: `${result.alignment.details.reference.midCap}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.reference.midCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Small Cap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill fill-small ref" style={{ width: `${result.alignment.details.reference.smallCap}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.reference.smallCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Max Overlap</span>
                                                    <div className="alignment-bar">
                                                        <div className="alignment-fill ref" style={{ width: `${result.alignment.details.reference.maxOverlap}%` }} />
                                                    </div>
                                                    <span>{result.alignment.details.reference.maxOverlap}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTOR DONUT CHART (retained from v1) */}
                        {pieSlices.length > 0 && (
                            <div className="details-zone chart-section" id="sector-chart">
                                <h4>SECTOR EXPOSURE</h4>
                                <div className="insights-grid">
                                    <div className="insights-chart">
                                        <div className="chart-wrap">
                                            <svg
                                                className="pie"
                                                viewBox="0 0 200 200"
                                                role="img"
                                                aria-label="Sector exposure donut chart"
                                                onMouseLeave={() => setHoverSlice(null)}
                                                style={{ overflow: 'visible' }}
                                            >
                                                <circle cx="100" cy="100" r="78" fill="var(--bg-primary)" opacity="0.3" />
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
                                                                    y: e.clientY - rect.top
                                                                });
                                                            }}
                                                        />
                                                    );
                                                })}
                                                <text
                                                    x="100" y="95"
                                                    textAnchor="middle"
                                                    fill="white"
                                                    style={{ fontSize: '14px', fontWeight: '600', opacity: 0.5, pointerEvents: 'none' }}
                                                >
                                                    SECTORS
                                                </text>
                                                <text
                                                    x="100" y="115"
                                                    textAnchor="middle"
                                                    fill="white"
                                                    style={{ fontSize: '18px', fontWeight: '800', opacity: 0.9, pointerEvents: 'none' }}
                                                >
                                                    {pieSlices.length}
                                                </text>
                                            </svg>

                                            {hoverSlice && (
                                                <div
                                                    className="chart-tooltip"
                                                    style={{
                                                        left: Math.min(hoverSlice.x + 12, 260),
                                                        top: Math.max(hoverSlice.y - 10, 8)
                                                    }}
                                                >
                                                    <div className="tt-title">{hoverSlice.sector} · {hoverSlice.pct.toFixed(1)}%</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sector-details">
                                        {(result?.sectorExposure || []).slice(0, 8).map((s, idx) => (
                                            <div
                                                key={s.sector}
                                                className={`sector-row ${hoverSlice?.sector === s.sector ? 'active' : ''}`}
                                                onMouseEnter={() => setHoverSlice({ sector: s.sector, pct: s.pct, x: 0, y: 0 })}
                                                onMouseLeave={() => setHoverSlice(null)}
                                            >
                                                <span className="dot" style={{ background: chartPalette[idx % chartPalette.length] }} />
                                                <span className="sector-name">{s.sector}</span>
                                                <span className="sector-pct">{s.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TOP EXPOSURES */}
                        {result.stockExposure?.length > 0 && (
                            <div className="details-zone exposures-zone" id="exposures-zone">
                                <h4>TOP EXPOSURES</h4>
                                {result.stockExposure.slice(0, 5).map(s => {
                                    const sRisk = s.exposurePct >= 15 ? 'high' : s.exposurePct >= 7 ? 'medium' : 'low';
                                    const maxPct = result.stockExposure?.[0]?.exposurePct || 1;
                                    const width = Math.max(2, Math.min(100, (s.exposurePct / maxPct) * 100));
                                    return (
                                        <div key={s.isin} className={`exposure-row risk-${sRisk}`}>
                                            <div className="exposure-info">
                                                <span className="ticker">{cleanTicker(s.ticker)}</span>
                                                <span className={`cap-badge cap-${s.cap}`}>{s.cap?.toUpperCase()}</span>
                                            </div>
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

                        {/* SCENARIOS (PRD §11.5) — Max 3 */}
                        {result.scenarios?.length > 0 && (
                            <div className="details-zone scenarios-zone" id="scenarios-zone">
                                <h4>EXPLORE SCENARIOS</h4>
                                <p className="scenarios-intro">
                                    See how your portfolio metrics change if a specific holding is removed.
                                </p>
                                <div className="scenario-cards">
                                    {result.scenarios.map((sc, idx) => (
                                        <div
                                            key={sc.id}
                                            className={`scenario-card ${expandedScenario === idx ? 'expanded' : ''}`}
                                            onClick={() => setExpandedScenario(expandedScenario === idx ? null : idx)}
                                        >
                                            <div className="scenario-header">
                                                <span className="scenario-num">Scenario {idx + 1}</span>
                                                <span className="scenario-reason">{sc.reason}</span>
                                            </div>
                                            <p className="scenario-desc">{sc.description}</p>
                                            {expandedScenario === idx && (
                                                <div className="scenario-detail">
                                                    <div className="scenario-metrics">
                                                        <div className="scenario-metric">
                                                            <span className="scenario-metric-label">Overlap</span>
                                                            <span className="scenario-before">{sc.before.overlapPct}%</span>
                                                            <span className="scenario-arrow">→</span>
                                                            <span className="scenario-after">{sc.after.overlapPct}%</span>
                                                        </div>
                                                        <div className="scenario-metric">
                                                            <span className="scenario-metric-label">Redundancy</span>
                                                            <span className="scenario-before">{sc.before.redundancyScore}%</span>
                                                            <span className="scenario-arrow">→</span>
                                                            <span className="scenario-after">{sc.after.redundancyScore}%</span>
                                                        </div>
                                                        <div className="scenario-metric">
                                                            <span className="scenario-metric-label">Portfolio Value</span>
                                                            <span className="scenario-before">₹{sc.before.totalValue?.toLocaleString()}</span>
                                                            <span className="scenario-arrow">→</span>
                                                            <span className="scenario-after">₹{sc.after.totalValue?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <p className="scenario-disclaimer">{sc.disclaimer}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Empty state */}
                {!result && holdings.length < 2 && (
                    <div className="verdict-zone">
                        <div className="verdict-empty">
                            <h2>NO CLARITY REPORT YET.</h2>
                            <p className="sub">Select a goal and add at least 2 holdings to generate your portfolio clarity report.</p>
                            <span className="system-note">The clarity engine is currently idle.</span>
                        </div>
                    </div>
                )}
            </main>

            <footer className="disclaimer-section">
                <span className="disclaimer-label">DISCLAIMER</span>
                <span className="disclaimer-text">This is for informational and analytical purposes only. Not investment advice. Past data does not guarantee future outcomes.</span>
            </footer>
        </>
    );
}
