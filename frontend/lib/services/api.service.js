const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api';

export const apiService = {
    async fetchHealth() {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
        return res.json();
    },

    async calculateClarityReport(holdings, goal) {
        const res = await fetch(`${API_BASE}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ holdings, goal })
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Calculation failed with status ${res.status}`);
        }
        return res.json();
    },

    async fetchMarketData() {
        const res = await fetch(`${API_BASE}/market-data`);
        if (!res.ok) throw new Error(`Failed to load market data: ${res.status}`);
        return res.json();
    },

    async fetchGoalProfiles() {
        const res = await fetch(`${API_BASE}/goal-profiles`);
        if (!res.ok) throw new Error(`Failed to load goal profiles: ${res.status}`);
        return res.json();
    }
};
