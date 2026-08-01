"use client";

import React from 'react';

/**
 * EmptyState Component (Phase 3.1)
 * Educational onboarding state displayed when zero holdings are selected.
 */
export default function EmptyState({ onSelectDemo }) {
    return (
        <section className="card-v2 glass-panel fadeIn" style={{ textAlign: 'center', padding: '3rem 1.5rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
            <h2 className="text-h1" style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                NO CLARITY REPORT YET.
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Welcome to UNSTACKED Portfolio Intelligence
            </p>
            <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto', color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: '1.6' }}>
                Reveal hidden stock overlap, calculate effective holdings count, evaluate sector risk, and optimize your portfolio before making any financial investment.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => onSelectDemo && onSelectDemo('balanced')}
                    className="pill-badge pill-badge-emerald"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                    ⚡ TRY DEMO PORTFOLIO
                </button>
                <button
                    onClick={() => onSelectDemo && onSelectDemo('overlap')}
                    className="pill-badge pill-badge-amber"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                    ⚠️ Try High-Overlap Demo
                </button>
            </div>
        </section>
    );
}
