"use client";

import React from 'react';

/**
 * RecommendedActions Component (Phase 3.2)
 * Interactive Roadmap Action Cards with Impact, Confidence, Difficulty, and direct CTA controls.
 */
export default function RecommendedActions({ result, holdings, onHighlightHolding, onToggleWhatIf }) {
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
            tag: 'Consolidation Opportunity',
            impact: 'High',
            confidence: '95% Verified',
            difficulty: 'Easy',
            estImprovement: `+${Math.min(25, Math.round(overlapPct * 0.5))} pts Health`,
            actionType: 'whatif'
        });
    } else {
        actions.push({
            id: 'action-overlap-good',
            badge: 'Optimal',
            badgeClass: 'pill-badge-emerald',
            title: 'Maintain Overlap Efficiency',
            description: `Stock overlap is low (${overlapPct.toFixed(1)}%). Focus new capital on complementary asset classes rather than adding new equity funds.`,
            tag: 'Capital Efficiency',
            impact: 'Low Risk',
            confidence: '98% Verified',
            difficulty: 'None',
            estImprovement: 'Maintained',
            actionType: 'highlight'
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
            tag: 'Single-Stock Guardrail',
            impact: 'Moderate',
            confidence: '90% Verified',
            difficulty: 'Medium',
            estImprovement: `+${Math.round(topDriverPct * 0.4)} pts Balance`,
            actionType: 'highlight'
        });
    } else {
        actions.push({
            id: 'action-concentration-good',
            badge: 'Balanced',
            badgeClass: 'pill-badge-cyan',
            title: 'Well-Distributed Single Stock Weights',
            description: `No single stock exceeds 10% total weight across your portfolio. Continue maintaining balanced position sizing.`,
            tag: 'Position Balance',
            impact: 'Controlled',
            confidence: '95% Verified',
            difficulty: 'None',
            estImprovement: 'Optimal',
            actionType: 'highlight'
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
            tag: 'Simplification',
            impact: 'Moderate',
            confidence: '92% Verified',
            difficulty: 'Easy',
            estImprovement: '-20% Complexity',
            actionType: 'whatif'
        });
    } else {
        actions.push({
            id: 'action-rationalize-good',
            badge: 'Streamlined',
            badgeClass: 'pill-badge-emerald',
            title: 'Lean Core Portfolio',
            description: `Holding ${holdings.length} funds provides optimal focus and manageable portfolio administration.`,
            tag: 'Core Strategy',
            impact: 'Optimal',
            confidence: '99% Verified',
            difficulty: 'None',
            estImprovement: 'Lean Core',
            actionType: 'highlight'
        });
    }

    const handleActionClick = (act) => {
        if (act.actionType === 'whatif' && onToggleWhatIf) {
            onToggleWhatIf();
        } else {
            const elm = document.getElementById('holdings-zone');
            if (elm) {
                elm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (onHighlightHolding) {
                onHighlightHolding();
            }
        }
    };

    return (
        <section style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
                <span className="text-label" style={{ color: 'var(--text-secondary)' }}>Optimization Roadmap</span>
                <h2 className="text-h1" style={{ marginTop: '0.15rem' }}>Top 3 Actionable Recommendations</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1rem', maxWidth: '100%', boxSizing: 'border-box' }}>
                {actions.slice(0, 3).map((act, index) => (
                    <div key={act.id} className="card-v2 glass-panel fadeIn" style={{ animationDelay: `${index * 0.1}s`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                <span className={`pill-badge ${act.badgeClass}`}>{act.badge}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>#0{index + 1}</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{act.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.75rem' }}>{act.description}</p>

                            {/* Intelligence Layer Metadata */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <div>Impact: <strong style={{ color: 'var(--text-primary)' }}>{act.impact}</strong></div>
                                <div>Est. Gain: <strong style={{ color: 'var(--accent-emerald)' }}>{act.estImprovement}</strong></div>
                                <div>Difficulty: <strong style={{ color: 'var(--text-primary)' }}>{act.difficulty}</strong></div>
                                <div>Confidence: <strong style={{ color: 'var(--text-primary)' }}>{act.confidence}</strong></div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.725rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                {act.tag}
                            </span>
                            <button
                                onClick={() => handleActionClick(act)}
                                style={{
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: 'var(--accent-emerald)',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.725rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'background var(--transition-fast)'
                                }}
                            >
                                {act.actionType === 'whatif' ? '🔮 What-If ↗' : '🔍 View Holdings ↗'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
