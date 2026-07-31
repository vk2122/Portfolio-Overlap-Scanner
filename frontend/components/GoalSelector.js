export default function GoalSelector({ goal, setGoal }) {
    return (
        <section className="goal-capture" id="goal-capture">
            <h4>Define Your Objective</h4>
            <div className="goal-row">
                <div className="goal-group">
                    <label className="goal-label">INVESTMENT GOAL</label>
                    <div className="pill-group">
                        {['growth', 'stability', 'balanced'].map(g => (
                            <button
                                key={g}
                                className={`pill ${goal.investmentGoal === g ? 'active' : ''}`}
                                onClick={() => setGoal(prev => ({ ...prev, investmentGoal: prev.investmentGoal === g ? null : g }))}
                            >
                                {g === 'growth' ? '↗ Growth' : g === 'stability' ? '◆ Stability' : '⊞ Balanced'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="goal-group">
                    <label className="goal-label">TIME HORIZON</label>
                    <div className="pill-group">
                        {[{ key: '<3', label: '< 3 years' }, { key: '3-7', label: '3–7 years' }, { key: '7+', label: '7+ years' }].map(t => (
                            <button
                                key={t.key}
                                className={`pill ${goal.timeHorizon === t.key ? 'active' : ''}`}
                                onClick={() => setGoal(prev => ({ ...prev, timeHorizon: prev.timeHorizon === t.key ? null : t.key }))}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
