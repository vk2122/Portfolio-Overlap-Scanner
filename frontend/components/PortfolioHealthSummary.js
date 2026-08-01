"use client";

import React from 'react';

/**
 * PortfolioHealthSummary Component (Phase 3.1)
 * Displays high-level portfolio health score, status badge, and 5-pillar weight indicator.
 */
export default function PortfolioHealthSummary({ healthScore, interpretation, result, onOpenMethodology }) {
    if (!healthScore && healthScore !== 0) return null;

    const scoreValue = typeof healthScore === 'object' ? (healthScore?.finalScore ?? 70) : (healthScore ?? 70);
    const interpValue = typeof healthScore === 'object' ? (healthScore?.interp ?? interpretation) : (interpretation || 'GOOD');

    let badgeClass = 'pill-badge-emerald';
    let healthColor = 'var(--accent-emerald)';
    if (scoreValue < 50) {
        badgeClass = 'pill-badge-rose';
        healthColor = 'var(--accent-rose)';
    } else if (scoreValue < 70) {
        badgeClass = 'pill-badge-amber';
        healthColor = 'var(--accent-amber)';
    } else if (scoreValue < 85) {
        badgeClass = 'pill-badge-cyan';
        healthColor = 'var(--accent-cyan)';
    }

    const overlapPct = result?.summary?.overlapPct || 0;
    const effectiveHoldings = result?.summary?.effectiveExposureCount || 0;
    const topDriver = result?.summary?.topDriverStock || 'None';

    return (
        <section className="card-v2 glass-panel fadeIn" id="health-summary-block" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Portfolio Structural Integrity</span>
                    <h2 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        Portfolio Health Score
                        <span className={`pill-badge ${badgeClass}`}>{interpValue || 'Evaluated'}</span>
                    </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: healthColor, fontVariantNumeric: 'tabular-nums' }}>
                        {scoreValue}
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
            </div>

            {/* Health Meter Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{
                    width: `${Math.min(100, Math.max(0, scoreValue))}%`,
                    height: '100%',
                    background: healthColor,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
            </div>

            {/* Health Score Bridge Explanation Callout */}
            {(overlapPct < 30 && scoreValue < 70) && (
                <div style={{
                    padding: '0.65rem 0.9rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.775rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                }}>
                    <strong style={{ color: 'var(--accent-amber)', display: 'inline-block', marginRight: '0.35rem' }}>💡 Health Score Bridge:</strong>
                    Why {scoreValue}/100 Health with {overlapPct.toFixed(1)}% Overlap? Overlap measures fund-to-fund duplication, while Health evaluates overall structural risk. Single-stock concentration bottlenecks (e.g. {topDriver}) or sector weights lower health even when fund overlap is low.
                </div>
            )}

            {/* Key Metrics Quick Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                    <span className="text-caption" style={{ color: 'var(--text-muted)' }}>Weighted Overlap</span>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{overlapPct.toFixed(1)}%</div>
                </div>
                <div>
                    <span className="text-caption" style={{ color: 'var(--text-muted)' }}>Effective Holdings</span>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{effectiveHoldings.toFixed(1)}</div>
                </div>
                <div>
                    <span className="text-caption" style={{ color: 'var(--text-muted)' }}>Top Overlap Driver</span>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-amber)', marginTop: '0.15rem' }}>{topDriver}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onOpenMethodology}
                        aria-label="View calculation methodology"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.825rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: '0.25rem 0'
                        }}
                    >
                        View Scoring Methodology ↗
                    </button>
                </div>
            </div>
        </section>
    );
}
