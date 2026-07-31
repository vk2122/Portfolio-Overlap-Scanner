export default function HoldingDonutChart({ holdings, totalValue }) {
    if (holdings.length === 0 || totalValue === 0) return null;
    let currentOffset = 0;
    const size = 100;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const sorted = [...holdings].sort((a, b) => b.value - a.value);
    const colors = ['#f5a623', '#25a581', '#3b82f6', '#9333ea', '#ec4899', '#f87171', '#4ade80', '#fbbf24', '#2dd4bf'];

    return (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                {sorted.map((h, i) => {
                    const pct = h.value / totalValue;
                    if (pct <= 0) return null;
                    const strokeDasharray = `${pct * circumference} ${circumference}`;
                    const strokeDashoffset = -currentOffset;
                    currentOffset += pct * circumference;
                    return (
                        <circle
                            key={h.id}
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="transparent"
                            stroke={colors[i % colors.length]}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                        />
                    );
                })}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Holding Composition</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {sorted.slice(0, 3).map(s => s.name).join(', ')}
                    {sorted.length > 3 ? ` + ${sorted.length - 3} more` : ''}
                </span>
            </div>
        </div>
    );
}
