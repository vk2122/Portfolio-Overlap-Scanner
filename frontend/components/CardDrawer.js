import { useEffect } from 'react';

export default function CardDrawer({ activeCard, result, healthScore, onClose }) {
    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

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
                label: s.ticker, value: `×${s.sourceCount} funds`, sub: `₹${Math.round(s.totalVal || 0).toLocaleString()} duplicated`
            })) || []
        },
        topDriver: {
            title: 'Top Concentration Driver',
            icon: '◎',
            explain: 'The single stock with the largest share of your total portfolio. A concentrated position can amplify both gains and losses from one company.',
            scale: [],
            getData: () => []
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

    const meta = CARD_META[activeCard];
    if (!meta) return null;

    const ticker = result?.summary?.topDriverStock;
    const rows = meta.getData(result);

    const getChartUrl = (sym) => {
        const cleanSym = String(sym).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
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
