import HoldingDonutChart from './HoldingDonutChart';

export default function HoldingsList({ holdings, result, removeHolding, validationErrors, setOpenMethodology }) {
    if (holdings.length === 0) return null;

    const totalValue = holdings.reduce((sum, h) => sum + Number(h.value), 0);

    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '');

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

    return (
        <div className="details-zone holdings-zone" id="holdings-zone">
            <div className="holdings-header">
                <h4 style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>Holdings</h4>
                <span className="holdings-count">{holdings.length} instrument{holdings.length !== 1 ? 's' : ''} · ₹{totalValue.toLocaleString()}</span>
            </div>

            {/* Professional Confidence & Data Quality Panel */}
            {validationErrors && validationErrors.length > 0 && (() => {
                const simulatedItems = validationErrors
                    .filter(e => e.type === 'SIMULATED')
                    .map(e => e.instrumentName || cleanTicker(e.instrumentId))
                    .filter(Boolean);
                const uniqueSimulated = Array.from(new Set(simulatedItems));

                return (
                    <div className="confidence-panel" style={{ marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(245, 166, 35, 0.04)', border: '1px solid rgba(245, 166, 35, 0.2)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--color-action)', fontWeight: 800 }}>ℹ️ DATA NOTE:</span>
                            <span>
                                {uniqueSimulated.length > 0
                                    ? `Estimated constituent benchmarks used for ${uniqueSimulated.join(', ')}.`
                                    : 'Some constituent weights use estimated market proxies.'}
                            </span>
                        </div>
                        {setOpenMethodology && (
                            <button
                                type="button"
                                onClick={() => setOpenMethodology('effective')}
                                style={{ background: 'none', border: 'none', color: 'var(--color-info)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold', padding: 0, whiteSpace: 'nowrap' }}
                            >
                                Methodology ↗
                            </button>
                        )}
                    </div>
                );
            })()}

            <HoldingDonutChart holdings={holdings} totalValue={totalValue} />
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
    );
}
