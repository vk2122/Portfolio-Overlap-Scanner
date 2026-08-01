/**
 * Share & Serialization Service — UNSTACKED v2.0
 * Isolates URL query string generation, hydration parsing, and future privacy-first sharing interfaces.
 */

export const shareService = {
    /**
     * Serialize holdings and goal configuration into URL search parameters
     */
    serializeToParams(holdings, goal) {
        if (!holdings || holdings.length === 0) return '';
        const hString = holdings.map(h => `${h.instrumentId}:${h.type}:${h.value}`).join(',');
        const gString = (goal && goal.investmentGoal && goal.timeHorizon) ? `${goal.investmentGoal}:${goal.timeHorizon}` : '';
        const params = new URLSearchParams();
        params.set('p', hString);
        if (gString) params.set('g', gString);
        return params.toString();
    },

    /**
     * Generate full shareable URL string for current window location
     */
    generateShareableURL(holdings, goal) {
        if (typeof window === 'undefined') return '';
        const queryString = this.serializeToParams(holdings, goal);
        if (!queryString) return window.location.origin;
        return `${window.location.origin}${window.location.pathname}?${queryString}`;
    },

    /**
     * Parse query parameters or search string into hydrated holdings & goal objects
     */
    parseURLParams(searchString, catalogData = { stocks: [], etfs: [], funds: [] }) {
        if (!searchString || !searchString.includes('p=')) return null;

        try {
            const params = new URLSearchParams(searchString);
            const pStr = params.get('p');
            const gStr = params.get('g');

            if (!pStr) return null;

            const catalog = [
                ...(catalogData.stocks || []),
                ...(catalogData.etfs || []),
                ...(catalogData.funds || [])
            ];

            const holdings = pStr.split(',').map(item => {
                const [id, t, v] = item.split(':');
                const matched = catalog.find(m => String(m.isin || m.id) === id || m.ticker === id);
                return {
                    id: Date.now() + Math.random(),
                    instrumentId: id,
                    type: t || 'EQUITY',
                    name: matched ? (matched.ticker || matched.name) : id,
                    value: parseFloat(v) || 0
                };
            });

            let goal = { investmentGoal: null, timeHorizon: null };
            if (gStr) {
                const [ig, th] = gStr.split(':');
                goal = { investmentGoal: ig, timeHorizon: th };
            }

            return { holdings, goal };
        } catch (e) {
            console.error('[shareService] Hydration parsing failed:', e);
            return null;
        }
    },

    /**
     * FUTURE INTERFACE PLACEHOLDERS (Phase 3 Backend Migration)
     */
    async generateShortLink(holdings, goal, privacyOptions = { maskAmounts: false }) {
        // Interface placeholder for POST /api/share (short IDs e.g. /s/xK9q2mP7)
        throw new Error('Short link service not implemented yet. URL parameter serialization active.');
    },

    async parseShareToken(token) {
        // Interface placeholder for GET /api/share/:token
        throw new Error('Tokenized share service not implemented yet.');
    },

    async revokeShareLink(shareId) {
        // Interface placeholder for DELETE /api/share/:shareId
        throw new Error('Share revocation service not implemented yet.');
    }
};
