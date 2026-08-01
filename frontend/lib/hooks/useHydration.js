import { useState, useEffect, useCallback } from 'react';
import { fetchMarketData } from '../loader';
import { storageService } from '../services/storage.service';
import { shareService } from '../services/share.service';

export function useHydration(setHoldings, setGoal) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [marketData, setMarketData] = useState({ stocks: [], etfs: [], funds: [] });
    const [dbLoaded, setDbLoaded] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);

    // Defer database fetching to focus or search trigger
    const loadMarketDatabase = useCallback(async () => {
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
    }, [dbLoaded, dbLoading]);

    useEffect(() => {
        // Hydrate configuration
        const handleHydration = async () => {
            // Check URL parameters first
            if (typeof window !== 'undefined' && window.location.search.includes('p=')) {
                try {
                    const data = await fetchMarketData();
                    setMarketData(data);
                    setDbLoaded(true);

                    const parsed = shareService.parseURLParams(window.location.search, data);
                    if (parsed && parsed.holdings) {
                        setHoldings(parsed.holdings);
                        if (parsed.goal) setGoal(parsed.goal);
                        setIsHydrated(true);
                        return;
                    }
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
