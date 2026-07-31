"use client";

import { useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Custom Hooks
import { useHydration } from '../lib/hooks/useHydration';
import { usePortfolio } from '../lib/hooks/usePortfolio';
import { useAnalytics } from '../lib/hooks/useAnalytics';
import { useSearch } from '../lib/hooks/useSearch';
import { useSimulation } from '../lib/hooks/useSimulation';

// Subcomponents
import GoalSelector from './GoalSelector';
import PortfolioInput from './PortfolioInput';
import HoldingsList from './HoldingsList';
import AnalyticsCards from './AnalyticsCards';
import ScenarioPanel from './ScenarioPanel';

// Dynamic imports for optimized bundle size (Epic 4)
const BulkImportModal = dynamic(() => import('./BulkImportModal'), { ssr: false });
const CardDrawer = dynamic(() => import('./CardDrawer'), { ssr: false });

const chartPalette = [
    'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
    'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'
];

export default function PortfolioApp() {
    // 1. Base states and hooks bindings
    const [holdings, setHoldings] = useState([]);
    const [goal, setGoal] = useState({ investmentGoal: null, timeHorizon: null });

    const { result, setResult, calculating, error } = useAnalytics(holdings, goal);
    const { isHydrated, marketData, loadMarketDatabase } = useHydration(setHoldings, setGoal);

    // State bindings
    const [type, setType] = useState('EQUITY');
    const [value, setValue] = useState('');
    const [hoverSlice, setHoverSlice] = useState(null);
    const [expandedScenario, setExpandedScenario] = useState(null);
    const [activeCard, setActiveCard] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);
    const [showTypeResults, setShowTypeResults] = useState(false);

    // Search ref bindings
    const searchInputRef = useRef(null);
    const resultsRef = useRef(null);
    const formRef = useRef(null);

    const {
        searchQuery, setSearchQuery,
        searchResults, showResults, setShowResults,
        selectedInstrument, setSelectedInstrument, kbIndex, setKbIndex,
        onSearchFocus, handleSearchKeyDown, selectResult, clearSearch
    } = useSearch(marketData, type, loadMarketDatabase);

    const {
        showBulkImport, setShowBulkImport,
        bulkText, setBulkText, bulkPreview,
        addHolding, removeHolding, clearAllHoldings, addBulkHoldings,
        handleShare, validationErrors
    } = usePortfolio(marketData, isHydrated, setResult);

    const { isWhatIfMode, setIsWhatIfMode, hypoResult, hypoCalculating } = useSimulation(
        holdings, goal, selectedInstrument, value, type
    );

    // 2. Health Score engine calculation
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

        const finalScore = Math.round((0.30 * concScore) + (0.20 * overlapScore) + (0.20 * sectScore) + (0.20 * 70) + (0.10 * 65));

        let interp = "FRAGILE";
        let interpFull = "FRAGILE – High vulnerability";
        if (finalScore >= 80) { interp = "ELITE"; interpFull = "ELITE – Institutional grade"; }
        else if (finalScore >= 65) { interp = "GOOD"; interpFull = "GOOD – Minor inefficiencies"; }
        else if (finalScore >= 50) { interp = "RISKY"; interpFull = "RISKY – Hidden bottlenecks"; }

        return { finalScore, interp, interpFull, concScore, overlapScore, sectScore, riskScore: 70, corrScore: 65, ens, top5, ovp, maxSectPct };
    }, [result]);

    // 3. UI Helpers
    const totalValue = useMemo(() => holdings.reduce((sum, h) => sum + Number(h.value), 0), [holdings]);
    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    const handleAddHoldingWrapper = (e) => {
        addHolding(selectedInstrument, type, value, clearSearch);
        setValue('');
    };

    const handleExportImage = useCallback(() => {
        const btn = document.getElementById('export-btn');
        if (btn) btn.innerHTML = '⏳ EXPORTING...';
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            const elm = document.querySelector('.main-flow');
            if (elm && window.html2canvas) {
                window.html2canvas(elm, { backgroundColor: '#131720', scale: 2 }).then(canvas => {
                    const link = document.createElement('a');
                    link.download = 'UNSTACKED_Portfolio_Report.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    if (btn) btn.innerHTML = '⬇ EXPORT';
                });
            } else if (btn) btn.innerHTML = '⬇ EXPORT';
        };
        document.body.appendChild(script);
    }, []);

    // SVG pie slices helper
    const pieSlices = useMemo(() => {
        if (!result || !result.sectorExposure || result.sectorExposure.length === 0) return [];
        const total = result.sectorExposure.reduce((sum, s) => sum + s.value, 0);
        let currentAngle = 0;
        return result.sectorExposure.map(s => {
            const pct = (s.value / total) * 100;
            const angle = (s.value / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            return { sector: s.sector, pct: parseFloat(pct.toFixed(1)), value: s.value, startAngle, endAngle };
        });
    }, [result]);

    const describeDonutSlice = (x, y, radius, innerRadius, startAngle, endAngle) => {
        const getRad = (deg) => (deg - 90) * Math.PI / 180.0;
        const startRad = getRad(startAngle);
        const endRad = getRad(endAngle);

        const x1Outer = x + radius * Math.cos(startRad);
        const y1Outer = y + radius * Math.sin(startRad);
        const x2Outer = x + radius * Math.cos(endRad);
        const y2Outer = y + radius * Math.sin(endRad);

        const x1Inner = x + innerRadius * Math.cos(endRad);
        const y1Inner = y + innerRadius * Math.sin(endRad);
        const x2Inner = x + innerRadius * Math.cos(startRad);
        const y2Inner = y + innerRadius * Math.sin(startRad);

        const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", x1Outer, y1Outer,
            "A", radius, radius, 0, largeArc, 1, x2Outer, y2Outer,
            "L", x1Inner, y1Inner,
            "A", innerRadius, innerRadius, 0, largeArc, 0, x2Inner, y2Inner,
            "Z"
        ].join(" ");
    };

    return (
        <>
            {showBulkImport && (
                <BulkImportModal
                    onClose={() => { setShowBulkImport(false); setBulkText(''); }}
                    onAdd={addBulkHoldings}
                    bulkText={bulkText}
                    setBulkText={setBulkText}
                    bulkPreview={bulkPreview}
                />
            )}

            {activeCard && result && (
                <CardDrawer activeCard={activeCard} result={result} healthScore={healthScore} onClose={() => setActiveCard(null)} />
            )}

            <header className="header">
                <div className="brand">UNSTACKED <span className="tagline">— Know what you own.</span></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button id="export-btn" type="button" className="header-clear-btn" onClick={handleExportImage} disabled={holdings.length < 2 || !result}>⬇ EXPORT</button>
                    <button id="share-btn" type="button" className="header-clear-btn" onClick={handleShare} style={{ color: 'var(--color-info)', borderColor: 'var(--color-info)' }}>SHARE</button>
                    <button type="button" className="header-clear-btn" onClick={clearAllHoldings}>RESET</button>
                </div>
            </header>

            <main className="main-flow">
                <GoalSelector goal={goal} setGoal={setGoal} />

                <PortfolioInput
                    type={type} setType={setType}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    showResults={showResults} setShowResults={setShowResults}
                    selectedInstrument={selectedInstrument} setSelectedInstrument={setSelectedInstrument}
                    value={value} setValue={setValue}
                    kbIndex={kbIndex} setKbIndex={setKbIndex}
                    showTypeResults={showTypeResults} setShowTypeResults={setShowTypeResults}
                    isWhatIfMode={isWhatIfMode} setIsWhatIfMode={setIsWhatIfMode}
                    onAddHolding={handleAddHoldingWrapper}
                    onBulkClick={() => setShowBulkImport(true)}
                    onSearchFocus={onSearchFocus}
                    handleSearchKeyDown={handleSearchKeyDown}
                    formRef={formRef} searchInputRef={searchInputRef} resultsRef={resultsRef}
                />

                <ScenarioPanel
                    isWhatIfMode={isWhatIfMode}
                    selectedInstrument={selectedInstrument}
                    value={value}
                    result={result}
                    healthScore={healthScore}
                    hypoCalculating={hypoCalculating}
                    hypoResult={hypoResult}
                    expandedScenario={expandedScenario}
                    setExpandedScenario={setExpandedScenario}
                />

                {error && (
                    <div className="portfolio-validation-errors" style={{ padding: '1rem', background: 'rgba(214, 69, 69, 0.05)', border: '1px solid var(--color-risk)', borderRadius: '12px', color: 'var(--color-risk)', fontSize: '0.8rem' }}>
                        {error}
                    </div>
                )}

                <div className={`status-bar ${calculating ? 'active' : ''} ${result ? 'has-result' : ''}`}>
                    {calculating ? 'ANALYZING PORTFOLIO' : result ? 'CLARITY REPORT READY' : 'ENGINE IDLE'}
                </div>

                <HoldingsList holdings={holdings} result={result} removeHolding={removeHolding} validationErrors={validationErrors} />

                {result && holdings.length >= 2 && (
                    <>
                        <AnalyticsCards result={result} healthScore={healthScore} setActiveCard={setActiveCard} />

                        {result.focusZone?.focusStatement && (
                            <div className="details-zone focus-zone fadeIn" id="focus-zone">
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

                        {result.alignment?.statement && (
                            <div className="details-zone alignment-section fadeIn" id="alignment-section">
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
                                                    <div className="alignment-bar"><div className="alignment-fill" style={{ width: `${Math.min(result.alignment.details.actual.largeCap, 100)}%` }} /></div>
                                                    <span>{result.alignment.details.actual.largeCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Mid Cap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill fill-mid" style={{ width: `${Math.min(result.alignment.details.actual.midCap, 100)}%` }} /></div>
                                                    <span>{result.alignment.details.actual.midCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Small Cap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill fill-small" style={{ width: `${Math.min(result.alignment.details.actual.smallCap, 100)}%` }} /></div>
                                                    <span>{result.alignment.details.actual.smallCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Overlap</span>
                                                    <div className="alignment-bar"><div className={`alignment-fill ${result.alignment.details.actual.overlap > (result.alignment.details.reference.maxOverlap || 30) ? 'fill-danger' : ''}`} style={{ width: `${Math.min(result.alignment.details.actual.overlap, 100)}%` }} /></div>
                                                    <span>{result.alignment.details.actual.overlap}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="alignment-col">
                                            <span className="alignment-col-title">{result.alignment.details.goal} Reference</span>
                                            <div className="alignment-bar-group">
                                                <div className="alignment-bar-row">
                                                    <span>Large Cap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill ref" style={{ width: `${result.alignment.details.reference.largeCap}%` }} /></div>
                                                    <span>{result.alignment.details.reference.largeCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Mid Cap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill fill-mid ref" style={{ width: `${result.alignment.details.reference.midCap}%` }} /></div>
                                                    <span>{result.alignment.details.reference.midCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Small Cap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill fill-small ref" style={{ width: `${result.alignment.details.reference.smallCap}%` }} /></div>
                                                    <span>{result.alignment.details.reference.smallCap}%</span>
                                                </div>
                                                <div className="alignment-bar-row">
                                                    <span>Max Overlap</span>
                                                    <div className="alignment-bar"><div className="alignment-fill ref" style={{ width: `${result.alignment.details.reference.maxOverlap}%` }} /></div>
                                                    <span>{result.alignment.details.reference.maxOverlap}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {pieSlices.length > 0 && (
                            <div className="details-zone chart-section fadeIn" id="sector-chart">
                                <h4>SECTOR EXPOSURE</h4>
                                <div className="insights-grid">
                                    <div className="insights-chart">
                                        <div className="chart-wrap">
                                            <svg className="pie" viewBox="0 0 200 200" role="img" aria-label="Sector exposure donut chart" onMouseLeave={() => setHoverSlice(null)} style={{ overflow: 'visible' }}>
                                                <circle cx="100" cy="100" r="78" fill="var(--bg-primary)" opacity="0.3" />
                                                {pieSlices.map((s, idx) => {
                                                    const d = describeDonutSlice(100, 100, 88, 52, s.startAngle, s.endAngle);
                                                    const fill = chartPalette[idx % chartPalette.length];
                                                    const isActive = selectedSector === s.sector;
                                                    return (
                                                        <path
                                                            key={s.sector}
                                                            d={d}
                                                            fill={fill}
                                                            className={`pie-slice ${isActive ? 'active-slice' : ''}`}
                                                            style={{ animationDelay: `${idx * 60}ms` }}
                                                            onClick={() => setSelectedSector(selectedSector === s.sector ? null : s.sector)}
                                                            onMouseMove={(e) => {
                                                                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                                                                const sectorStocks = (result?.stockExposure || []).filter(st => st.sector === s.sector);
                                                                setHoverSlice({
                                                                    sector: s.sector,
                                                                    pct: s.pct,
                                                                    value: s.value,
                                                                    stockCount: sectorStocks.length,
                                                                    color: fill,
                                                                    x: e.clientX - rect.left,
                                                                    y: e.clientY - rect.top
                                                                });
                                                            }}
                                                        />
                                                    );
                                                })}
                                                <text x="100" y="95" textAnchor="middle" fill="white" style={{ fontSize: '14px', fontWeight: '600', opacity: 0.5, pointerEvents: 'none' }}>SECTORS</text>
                                                <text x="100" y="115" textAnchor="middle" fill="white" style={{ fontSize: '18px', fontWeight: '800', opacity: 0.9, pointerEvents: 'none' }}>{pieSlices.length}</text>
                                            </svg>

                                            {hoverSlice && (
                                                <div className="chart-tooltip-enhanced" style={{ left: Math.min(hoverSlice.x + 12, 200), top: Math.max(hoverSlice.y - 10, 8) }}>
                                                    <div className="tt-header">
                                                        <span className="tt-dot" style={{ background: hoverSlice.color }} />
                                                        <span className="tt-sector-name">{hoverSlice.sector}</span>
                                                    </div>
                                                    <div className="tt-stats">
                                                        <div className="tt-stat"><span className="tt-stat-label">Weight</span><span className="tt-stat-value">{hoverSlice.pct?.toFixed(1)}%</span></div>
                                                        <div className="tt-stat"><span className="tt-stat-label">Value</span><span className="tt-stat-value">₹{Math.round(hoverSlice.value || 0).toLocaleString()}</span></div>
                                                        <div className="tt-stat"><span className="tt-stat-label">Stocks</span><span className="tt-stat-value">{hoverSlice.stockCount || 0}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sector-details">
                                        {(result?.sectorExposure || []).slice(0, 8).map((s, idx) => (
                                            <div
                                                key={s.sector}
                                                className={`sector-row ${hoverSlice?.sector === s.sector ? 'active' : ''} ${selectedSector === s.sector ? 'active' : ''}`}
                                                onClick={() => setSelectedSector(selectedSector === s.sector ? null : s.sector)}
                                                onMouseEnter={() => {
                                                    const sectorStocks = (result?.stockExposure || []).filter(st => st.sector === s.sector);
                                                    setHoverSlice({ sector: s.sector, pct: s.pct, value: s.value, stockCount: sectorStocks.length, color: chartPalette[idx % chartPalette.length], x: 0, y: 0 });
                                                }}
                                                onMouseLeave={() => setHoverSlice(null)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className="dot" style={{ background: chartPalette[idx % chartPalette.length] }} />
                                                <span className="sector-name">{s.sector}</span>
                                                <span className="sector-pct">{s.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedSector && (() => {
                                    const sectorStocks = (result?.stockExposure || []).filter(s => s.sector === selectedSector);
                                    const sectorIdx = (result?.sectorExposure || []).findIndex(s => s.sector === selectedSector);
                                    const sectorColor = chartPalette[sectorIdx % chartPalette.length];
                                    return (
                                        <div className="sector-expanded-panel">
                                            <div className="sector-expanded-title">
                                                <span className="sector-expanded-name">
                                                    <span className="dot" style={{ background: sectorColor }} />
                                                    {selectedSector}
                                                    <span style={{ opacity: 0.5, fontSize: '0.6rem', fontWeight: 600 }}>{sectorStocks.length} stock{sectorStocks.length !== 1 ? 's' : ''}</span>
                                                </span>
                                                <button className="sector-expanded-close" onClick={() => setSelectedSector(null)}>✕</button>
                                            </div>
                                            {sectorStocks.slice(0, 8).map(st => (
                                                <div key={st.isin} className="sector-stock-row">
                                                    <span className="sector-stock-ticker">{cleanTicker(st.ticker)}</span>
                                                    <span className="sector-stock-pct">{st.exposurePct?.toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {result.stockExposure?.length > 0 && (
                            <div className="details-zone exposures-zone fadeIn" id="exposures-zone">
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
                                                <span className="mini-bar" aria-hidden="true"><span className={`mini-fill risk-${sRisk}`} style={{ width: `${width}%` }} /></span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

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
