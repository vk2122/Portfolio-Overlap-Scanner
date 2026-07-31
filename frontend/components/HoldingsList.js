import HoldingDonutChart from './HoldingDonutChart';

export default function HoldingsList({ holdings, result, removeHolding, validationErrors }) {
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

            {/* Portfolio Validation Warning Display */}
            {validationErrors && validationErrors.length > 0 && (
                <div className="portfolio-validation-errors" style={{ marginBottom: '1.2rem', padding: '0.8rem', background: 'rgba(214, 69, 69, 0.05)', border: '1px solid rgba(214, 69, 69, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-risk)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        ⚠ Validation Alerts
                    </div>
                    {validationErrors.map((err, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: err.severity === 'warning' ? '#f5a623' : 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>•</span>
                            <span>{err.message}</span>
                        </div>
                    ))}
                </div>
            )}

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
