export default function AnalyticsCards({ result, healthScore, setActiveCard, setOpenMethodology, validationErrors }) {
    if (!result) return null;

    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

    // Check if any holdings are simulated
    const hasSimulatedHoldings = validationErrors?.some(e => e.type === 'SIMULATED');

    const getProvenanceBadge = (cardKey) => {
        if (cardKey === 'effective') {
            // Health Score blends static benchmarks, so it is Estimated
            return <span className="provenance-badge estimated" style={{ background: '#4a5568', color: '#e2e8f0' }}>Estimated</span>;
        }
        if (hasSimulatedHoldings) {
            return <span className="provenance-badge simulated" style={{ background: '#f5a623', color: '#1a202c' }}>Simulated</span>;
        }
        return <span className="provenance-badge verified" style={{ background: '#2e8b8b', color: '#ffffff' }}>Verified</span>;
    };

    return (
        <div className="details-zone summary-block fadeIn" id="summary-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1c1f26', paddingBottom: '0.6rem' }}>
                <h4 style={{ margin: 0, padding: 0, border: 'none' }}>Portfolio Summary</h4>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Calculations Version: <span style={{ color: 'var(--color-info)' }}>v2.0</span>
                </div>
            </div>

            <div className="metrics-grid">
                {/* 1. Overlap Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('overlap')} title="Click for details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Overlap</span>
                        {getProvenanceBadge('overlap')}
                    </div>
                    <span className="metric-value">{result.summary?.overlapPct ?? 0}%</span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Capital held in multiple assets simultaneously.
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('overlap'); }}
                        aria-label="Learn methodology for Overlap"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>

                {/* 2. Redundancy Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('redundancy')} title="Click to view duplicate holdings breakdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Redundancy</span>
                        {getProvenanceBadge('redundancy')}
                    </div>
                    <span className="metric-value">{result.summary?.redundancyScore ?? 0}%</span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Percentage of duplicated capital exposure.
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('redundancy'); }}
                        aria-label="Learn methodology for Redundancy"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>

                {/* 3. Top Driver Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('topDriver')} title="Click to view interactive chart for top stock">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Top Driver</span>
                        {getProvenanceBadge('topDriver')}
                    </div>
                    <span className="metric-value metric-highlight">{cleanTicker(result.summary?.topDriverStock) || '—'}</span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {result.summary?.topDriverStockPct ?? 0}% total exposure.
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('topDriver'); }}
                        aria-label="Learn methodology for Top Driver"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>

                {/* 4. Top 3 Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('top3')} title="Click to view top 3 concentration breakdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Top 3 Concentration</span>
                        {getProvenanceBadge('top3')}
                    </div>
                    <span className="metric-value">{result.summary?.topDriverConcentration ?? 0}%</span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Combined exposure of top 3 stocks.
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('top3'); }}
                        aria-label="Learn methodology for Top 3 Concentration"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>

                {/* 5. Health Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('effective')} title="Click to view 5-pillar health score breakdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Portfolio Health</span>
                        {getProvenanceBadge('effective')}
                    </div>
                    <span className={`metric-value verdict-${(healthScore?.interp || 'fragile').toLowerCase()}`}>
                        {healthScore?.finalScore ?? 0}
                    </span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {healthScore?.interp ?? '—'} (Combines 5 risk pillars).
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('effective'); }}
                        aria-label="Learn methodology for Portfolio Health"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>

                {/* 6. Overlap Verdict Card */}
                <div className="metric-card metric-card--clickable" onClick={() => setActiveCard('verdict')} title="Click to view verdict classification breakdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '0.4rem' }}>
                        <span className="metric-label">Overlap Verdict</span>
                        {getProvenanceBadge('verdict')}
                    </div>
                    <span className={`metric-value verdict-${(result.summary?.overlapVerdict || 'low').toLowerCase()}`}>
                        {result.summary?.overlapVerdict || 'LOW'}
                    </span>
                    <span className="metric-sub" style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Portfolio diversification tier classification.
                    </span>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setOpenMethodology('verdict'); }}
                        aria-label="Learn methodology for Overlap Verdict"
                        style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.65rem', cursor: 'pointer', padding: 0, marginTop: '0.6rem', textAlign: 'left', fontWeight: 'bold' }}
                    >
                        Learn methodology ↗
                    </button>
                </div>
            </div>
        </div>
    );
}
