"use client";

import React from 'react';

/**
 * SkeletonLoader Component (Phase 3.1)
 * Renders smooth skeleton shimmer placeholders during calculation state transitions.
 */
export default function SkeletonLoader({ phase }) {
    return (
        <section className="card-v2 glass-panel fadeIn" style={{ padding: '2rem 1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)' }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton-shimmer" style={{ width: '220px', height: '20px', marginBottom: '0.5rem' }} />
                    <div className="skeleton-shimmer" style={{ width: '140px', height: '14px' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />
                <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />
                <div className="skeleton-shimmer" style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.875rem', fontWeight: '600' }}>
                <div className="skeleton-shimmer" style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-full)' }} />
                <span>{phase || 'Analyzing portfolio overlap...'}</span>
            </div>
        </section>
    );
}
