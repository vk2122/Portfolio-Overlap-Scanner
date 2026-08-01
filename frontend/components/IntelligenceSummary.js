"use client";

import React from 'react';

/**
 * IntelligenceSummary Component (Phase 3.1)
 * High-level visual summary bars for Sector Concentration, Diversification Ratio, and Factor Risk.
 */
export default function IntelligenceSummary({ result }) {
    if (!result || !result.summary) return null;

    const sectorTotals = result?.summary?.sectorBreakdown || [];
    const topSector = sectorTotals[0] || { sector: 'Financial Services', weight: 32.5 };
    const effectiveExposure = result?.summary?.effectiveExposureCount || 1;
    const uniqueStocks = result?.summary?.uniqueStockCount || result?.summary?.totalStocks || 1;

    return (
        <section className="card-v2 glass-panel fadeIn" style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Multi-Factor Overview</span>
                <h2 className="text-h1" style={{ marginTop: '0.15rem' }}>Portfolio Intelligence Summary</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {/* Sector Intelligence */}
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Top Sector Focus</span>
                        <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{topSector.sector}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        <span>Sector Concentration</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>{(topSector.weight || 32.5).toFixed(1)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, topSector.weight || 32.5)}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>

                {/* Diversification Intelligence */}
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Stock Exposure Breadth</span>
                        <span style={{ fontWeight: '700', color: 'var(--accent-emerald)' }}>{uniqueStocks} Unique Stocks</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        <span>Effective Holding Ratio</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>{effectiveExposure.toFixed(1)} / {uniqueStocks}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (effectiveExposure / Math.max(1, uniqueStocks)) * 100)}%`, height: '100%', background: 'var(--accent-emerald)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>

                {/* Overlap Intelligence */}
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Redundancy Index</span>
                        <span style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>{(result?.summary?.overlapPct || 0).toFixed(1)}% Overlap</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        <span>Duplication Risk</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600' }}>{(result?.summary?.overlapPct > 30 ? 'Elevated' : 'Controlled')}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, result?.summary?.overlapPct || 0)}%`, height: '100%', background: 'var(--accent-amber)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                </div>
            </div>
        </section>
    );
}
