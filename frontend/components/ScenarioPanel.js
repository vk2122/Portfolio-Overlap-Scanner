export default function ScenarioPanel({
    isWhatIfMode,
    selectedInstrument,
    value,
    result,
    healthScore,
    hypoCalculating,
    hypoResult,
    expandedScenario,
    setExpandedScenario
}) {
    return (
        <>
            {/* What-If Simulation Sandbox Panel */}
            {isWhatIfMode && result && selectedInstrument && value && !isNaN(parseFloat(value)) && (
                <div className="what-if-panel" style={{ marginTop: '1rem', padding: '1rem 1.5rem', background: 'rgba(245, 166, 35, 0.05)', borderRadius: '12px', border: '1px dashed var(--color-action)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-action)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            🔮 Budget Impact Preview
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Adding ₹{parseFloat(value).toLocaleString()} of {selectedInstrument.main}
                        </div>
                    </div>

                    {hypoCalculating ? (
                        <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Simulating impact...</div>
                    ) : hypoResult ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Overlap</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Before: {result.summary?.overlapPct?.toFixed(1) || 0}%</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        ➜ After: {hypoResult.summary.overlapPct.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Top Concent.</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Before: {result.summary?.topDriverStockPct?.toFixed(1) || 0}%</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        ➜ After: {hypoResult.summary.topDriverStockPct?.toFixed(1) || 0}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Portfolio Health</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Before: {healthScore?.finalScore || 'N/A'}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        ➜ After: {hypoResult.summary?.healthScore || 'N/A'}
                                        {/* Fallback to calculating Health Score inline for hypothetical results if needed */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Explore Scenarios Recommendations */}
            {result && result.scenarios?.length > 0 && (
                <div className="details-zone scenarios-zone fadeIn" id="scenarios-zone">
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
    );
}
