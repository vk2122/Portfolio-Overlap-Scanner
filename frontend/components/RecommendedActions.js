"use client";

import React from 'react';

/**
 * RecommendedActions Component (Phase 3.1)
 * Renders Top 3 Actionable Recommendations derived from backend clarity report data.
 */
export default function RecommendedActions({ result, holdings }) {
    if (!result || !holdings || holdings.length === 0) return null;

    const overlapPct = result?.summary?.overlapPct || 0;
    const topDriver = result?.summary?.topDriverStock || 'Key Stock';
    const topDriverPct = result?.summary?.topDriverStockPct || 0;

    const actions = [];

    // Action 1: Overlap Consolidation
    if (overlapPct > 20) {
        actions.push({
            id: 'action-overlap',
            badge: 'High Impact',
            badgeClass: 'pill-badge-rose',
            title: 'Consolidate High-Overlap Holdings',
            description: `Your portfolio exhibits ${overlapPct.toFixed(1)}% stock-level duplication. Consider replacing one overlapping fund to reduce risk.`,
            tag: 'Consolidation Opportunity'
        });
    } else {
        actions.push({
            id: 'action-overlap-good',
            badge: 'Optimal',
            badgeClass: 'pill-badge-emerald',
            title: 'Maintain Overlap Efficiency',
            description: `Stock overlap is low (${overlapPct.toFixed(1)}%). Focus new capital on complementary asset classes rather than adding new equity funds.`,
            tag: 'Capital Efficiency'
        });
    }

    // Action 2: Concentration Guardrail
    if (topDriverPct > 10) {
        actions.push({
            id: 'action-concentration',
            badge: 'Risk Guardrail',
            badgeClass: 'pill-badge-amber',
            title: `Monitor ${topDriver} Exposure`,
            description: `${topDriver} accounts for ${topDriverPct.toFixed(1)}% of your combined portfolio weight across funds. Set a concentration guardrail at 10%.`,
            tag: 'Single-Stock Guardrail'
        });
    } else {
        actions.push({
            id: 'action-concentration-good',
            badge: 'Balanced',
            badgeClass: 'pill-badge-cyan',
            title: 'Well-Distributed Single Stock Weights',
            description: `No single stock exceeds 10% total weight across your portfolio. Continue maintaining balanced position sizing.`,
            tag: 'Position Balance'
        });
    }

    // Action 3: Portfolio Rationalization
    if (holdings.length > 5) {
        actions.push({
            id: 'action-rationalize',
            badge: 'Rationalization',
            badgeClass: 'pill-badge-amber',
            title: 'Streamline Holding Count',
            description: `You are holding ${holdings.length} funds. Reducing to 3-5 core holdings will decrease management complexity without sacrificing diversification.`,
            tag: 'Simplification'
        });
    } else {
        actions.push({
            id: 'action-rationalize-good',
            badge: 'Streamlined',
            badgeClass: 'pill-badge-emerald',
            title: 'Lean Core Portfolio',
            description: `Holding ${holdings.length} funds provides optimal focus and manageable portfolio administration.`,
            tag: 'Core Strategy'
        });
    }

    return (
        <section style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
                <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Optimization Roadmap</span>
                <h2 className="text-h1" style={{ marginTop: '0.15rem' }}>Top 3 Recommended Actions</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {actions.slice(0, 3).map((act, index) => (
                    <div key={act.id} className="card-v2 glass-panel fadeIn" style={{ animationDelay: `${index * 0.1}s`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                <span className={`pill-badge ${act.badgeClass}`}>{act.badge}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>#0{index + 1}</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{act.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{act.description}</p>
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                            {act.tag}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
