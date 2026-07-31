import { useEffect } from 'react';

export default function MethodologyDrawer({ activeTopic, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const TOPICS = {
        overlap: {
            title: 'Overlap Calculation Methodology',
            purpose: 'Expose "fake diversification" where different mutual funds or ETFs purchase identical underlying stocks.',
            formula: 'Overlap % = (Sum of Values of Overlap Stocks / Total Portfolio Value) * 100',
            details: [
                'Constituent Value = Fund Holding Value × (Stock Weight in Fund / 100)',
                'Overlap Stock = Any stock held by 2 or more separate instruments simultaneously (sourceCount ≥ 2).'
            ],
            interpretation: 'Low (<20%) indicates complementary holdings. Medium (20-40%) shows moderate duplication in blue-chips. High (>40%) represents significant duplication where users pay multiple redundant expense fees.'
        },
        redundancy: {
            title: 'Redundancy Score Methodology',
            purpose: 'Reflects the exact duplicate allocation across funds.',
            formula: 'Redundancy Score = Overlap %',
            details: [
                'Measures the percentage of capital that is duplicated instead of being spread into unique assets.',
                'A high score means multiple instruments are giving you the same underlying exposure.'
            ],
            interpretation: 'Directly linked to the overlap percentage. Higher redundancy scores directly indicate lower diversification efficiency.'
        },
        topDriver: {
            title: 'Top Driver Concentration Methodology',
            purpose: 'Identify the single underlying stock with the highest exposure across all combined holdings.',
            formula: 'Top Driver Exposure % = (Total Value of Largest Stock Exposure / Total Portfolio Value) * 100',
            details: [
                'Aggregates direct equity values with indirect holdings nested inside mutual funds and ETFs.',
                'Highlights single-point vulnerability to one company.'
            ],
            interpretation: 'An exposure above 10% on a single stock is penalized in the overall Health Score, indicating elevated concentration risk.'
        },
        top3: {
            title: 'Top 3 Concentration Methodology',
            purpose: 'Evaluate the combined share of the three largest stock positions in your portfolio.',
            formula: 'Top 3 Concentration % = (Sum of Top 3 Stock Values / Total Portfolio Value) * 100',
            details: [
                'Values above 50% indicate high dependency on three names, regardless of how many individual instruments you hold.'
            ],
            interpretation: 'Spread (<40%): Well-diversified. Moderate (40-60%): Average concentration. Concentrated (>60%): High dependency on the top three names.'
        },
        effective: {
            title: 'Portfolio Health Score Methodology',
            purpose: 'A weighted multi-pillar metric assessing structural portfolio risk.',
            formula: 'Health Score = (0.30 * Concentration) + (0.20 * Overlap) + (0.20 * Sector Balance) + (0.20 * Performance) + (0.10 * Correlation)',
            details: [
                'Concentration Score (30%): Starts at 95 (ENS ≥ 50), 75 (ENS ≥ 25), or 40. Deducts 20 points if top 5 stocks exceed 50%, and 15 points if top stock exceeds 10%.',
                'Overlap Score (20%): 95 if overlap < 20%, 75 if overlap ≤ 40%, else 40.',
                'Sector Balance Score (20%): 95 if largest sector is < 30%, 75 if ≤ 50%, else 40.',
                'Performance & Correlation Pillars: Currently set to institutional default benchmarks (70 and 65 respectively).'
            ],
            interpretation: 'Elite (80+): Institutional grade. Good (65-79): Minor inefficiencies. Risky (50-64): Hidden bottlenecks. Fragile (<50%): High structural vulnerability.'
        },
        verdict: {
            title: 'Overlap Verdict Heuristics',
            purpose: 'Classifies the diversification level of your portfolio into simple, actionable tiers.',
            formula: 'Overlap Verdict = Low (<20% Overlap), Medium (20-40% Overlap), High (>40% Overlap)',
            details: [
                'Low: Complementary assets.',
                'Medium: Minor duplication, typical of standard index fund combinations.',
                'High: Substantial duplication. Action recommended to consolidate redundant holdings.'
            ],
            interpretation: 'Enables investors to quickly identify whether their portfolio represents true diversification or duplicate exposure.'
        }
    };

    const topic = TOPICS[activeTopic];
    if (!topic) return null;

    return (
        <div className="card-drawer-overlay" onClick={onClose}>
            <div className="card-drawer" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="card-drawer-header">
                    <span className="card-drawer-icon">📖</span>
                    <span className="card-drawer-title">{topic.title}</span>
                    <button className="card-drawer-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="card-drawer-data" style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-info)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Purpose</strong>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{topic.purpose}</p>
                    </div>

                    <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-info)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Formula</strong>
                        <code style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.6rem', borderRadius: '4px', display: 'block', overflowX: 'auto' }}>
                            {topic.formula}
                        </code>
                    </div>

                    <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-info)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Key Calculations</strong>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {topic.details.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-info)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Interpretation</strong>
                        <p style={{ fontSize: '0.85rem', lineHeight: '1.5', opacity: 0.8 }}>{topic.interpretation}</p>
                    </div>
                </div>

                <p className="card-drawer-disclaimer" style={{ marginTop: '2rem' }}>
                    UNSTACKED Methodology Center · Verification Code v2.0
                </p>
            </div>
        </div>
    );
}
