export const searchService = {
    fuzzyScore(item, query) {
        const q = query.toLowerCase();
        const ticker = (item.ticker || item.name || '').toLowerCase();
        const name = (item.name || '').toLowerCase();

        if (ticker === q) return 100;
        if (ticker.startsWith(q)) return 80;
        if (ticker.includes(q)) return 60;
        if (name.startsWith(q)) return 50;
        if (name.includes(q)) return 40;
        return 0;
    },

    executeSearch(query, type, marketData) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        let source = [];
        if (type === 'EQUITY') source = marketData.stocks || [];
        else if (type === 'ETF') source = marketData.etfs || [];
        else source = marketData.funds || [];

        return source
            .map(i => ({ item: i, score: this.fuzzyScore(i, q) }))
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(s => ({
                id: s.item.isin || s.item.id,
                main: s.item.ticker || s.item.name,
                sub: s.item.name || '',
                exchange: s.item.exchange || (type === 'EQUITY' ? 'NSE' : null),
                score: s.score
            }));
    }
};
