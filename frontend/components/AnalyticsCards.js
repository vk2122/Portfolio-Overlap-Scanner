export default function AnalyticsCards({ result, healthScore, setActiveCard }) {
    if (!result) return null;

    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    return (
        <div className="details-zone summary-block fadeIn" id="summary-block">
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
    );
}
