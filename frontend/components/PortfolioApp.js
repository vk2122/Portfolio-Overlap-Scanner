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

    return (
        <>
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
                    <h4>DEFINE YOUR OBJECTIVE</h4>
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
                    <button type="submit" className="cta-reveal" disabled={!selectedInstrument || !value}>ADD</button>
                </form>

                {/* ============================================
                    STATUS BAR
                    ============================================ */}
                <div className={`status-bar ${calculating ? 'active' : ''} ${result ? 'has-result' : ''}`}>
                    {calculating ? 'STATUS: ANALYZING PORTFOLIO' : result ? 'STATUS: CLARITY REPORT READY' : 'STATUS: ENGINE IDLE'}
                </div>

                {/* ============================================
                    HOLDINGS LIST + FUND ROLES (PRD §7.4)
                    ============================================ */}
                {holdings.length > 0 && (
                    <div className="details-zone holdings-zone" id="holdings-zone">
                        <div className="holdings-header">
                            <h4>HOLDINGS</h4>
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
                            <h4>PORTFOLIO SUMMARY</h4>
                            <div className="metrics-grid">
                                <div className="metric-card">
                                    <span className="metric-label">Overlap</span>
                                    <span className="metric-value">{result.summary?.overlapPct ?? 0}%</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Redundancy Score</span>
                                    <span className="metric-value">{result.summary?.redundancyScore ?? 0}%</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Top Driver</span>
                                    <span className="metric-value metric-highlight">{cleanTicker(result.summary?.topDriverStock) || '—'}</span>
                                    <span className="metric-sub">{result.summary?.topDriverStockPct ?? 0}% exposure</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Top 3 Concentration</span>
                                    <span className="metric-value">{result.summary?.topDriverConcentration ?? 0}%</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Effective Exposures</span>
                                    <span className="metric-value">{result.summary?.effectiveExposureCount ?? 0}</span>
                                    <span className="metric-sub">of {result.summary?.totalStocks ?? 0} stocks</span>
                                </div>
                                <div className="metric-card">
                                    <span className="metric-label">Overlap Verdict</span>
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
