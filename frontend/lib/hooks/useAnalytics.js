import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

export function useAnalytics(holdings, goal) {
    const [result, setResult] = useState(null);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (holdings.length === 0) {
            setResult(null);
            setError(null);
            return;
        }

        setCalculating(true);
        setError(null);

        const timer = setTimeout(async () => {
            try {
                const data = await apiService.calculateClarityReport(holdings, goal.investmentGoal ? goal : null);
                if (data && data.summary) {
                    setResult(data);
                } else {
                    throw new Error("Invalid report response format");
                }
            } catch (e) {
                console.error('[useAnalytics] Calculation failed:', e);
                setError("Failed to calculate report. Please verify connection and try again.");
            } finally {
                setCalculating(false);
            }

            // Clean up URL parameters if they exist but we've edited standard holdings
            if (typeof window !== 'undefined' && window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Fast smooth scroll after render
            if (holdings.length >= 1) {
                setTimeout(() => {
                    document.getElementById('summary-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [holdings, goal]);

    return { result, setResult, calculating, error };
}
