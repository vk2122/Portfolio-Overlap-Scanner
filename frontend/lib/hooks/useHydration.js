import { useState, useEffect } from 'react';
import { fetchMarketData } from '../loader';
import { storageService } from '../services/storage.service';

export function useHydration(setHoldings, setGoal) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [marketData, setMarketData] = useState({ stocks: [], etfs: [], funds: [] });
    const [dbLoaded, setDbLoaded] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);

    // Defer database fetching to focus or search trigger
    const loadMarketDatabase = async () => {
        if (dbLoaded || dbLoading) return;
        setDbLoading(true);
        try {
            console.log("[useHydration] Defer-loading market database...");
            const data = await fetchMarketData();
            setMarketData(data);
            setDbLoaded(true);
        } catch (e) {
            console.error("[useHydration] Database loading failed:", e);
        } finally {
            setDbLoading(false);
        }
    };

    useEffect(() => {
        // Hydrate configuration
        const handleHydration = async () => {
            // Check URL parameters first
            if (typeof window !== 'undefined' && window.location.search.includes('p=')) {
                const params = new URLSearchParams(window.location.search);
                const pStr = params.get('p');
                const gStr = params.get('g');

                try {
                    // Try to fetch catalog subset to decode URL parameters
                    const data = await fetchMarketData();
                    setMarketData(data);
                    setDbLoaded(true);

                    const hList = pStr.split(',').map(item => {
                        const [id, t, v] = item.split(':');
                        const matched = (data.stocks || []).concat(data.etfs || []).concat(data.funds || []).find(m => String(m.isin || m.id) === id || m.ticker === id);
                        return {
                            id: Date.now() + Math.random(),
                            instrumentId: id,
                            type: t || 'EQUITY',
                            name: matched ? (matched.ticker || matched.name) : id,
                            value: parseFloat(v) || 0
                        };
                    });
                    setHoldings(hList);
                    if (gStr) {
                        const [ig, th] = gStr.split(':');
                        setGoal({ investmentGoal: ig, timeHorizon: th });
                    }
                    setIsHydrated(true);
                    return;
                } catch (e) {
                    console.error("[useHydration] Decoded URL hydration failed:", e);
                }
            }

            // Fallback to storageService
            try {
                const savedHoldings = storageService.loadHoldings();
                if (savedHoldings && savedHoldings.length > 0) {
                    setHoldings(savedHoldings);
                }
                const savedGoal = storageService.loadGoal();
                if (savedGoal && savedGoal.investmentGoal) {
                    setGoal(savedGoal);
                }
            } catch (e) {
                console.error("[useHydration] Storage hydration failed:", e);
            }
            setIsHydrated(true);
        };

        handleHydration();
    }, [setHoldings, setGoal]);

    return { isHydrated, marketData, dbLoaded, dbLoading, loadMarketDatabase };
}
