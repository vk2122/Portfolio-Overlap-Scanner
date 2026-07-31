import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

export function useSimulation(holdings, goal, selectedInstrument, value, type) {
    const [isWhatIfMode, setIsWhatIfMode] = useState(false);
    const [hypoResult, setHypoResult] = useState(null);
    const [hypoCalculating, setHypoCalculating] = useState(false);

    useEffect(() => {
        if (!isWhatIfMode || holdings.length === 0 || !selectedInstrument || !value || isNaN(parseFloat(value))) {
            setHypoResult(null);
            return;
        }

        const targetHoldings = [...holdings, {
            id: 'hypothetical-trade',
            instrumentId: selectedInstrument.id,
            type: type,
            name: selectedInstrument.main,
            value: parseFloat(value)
        }];

        const timer = setTimeout(async () => {
            setHypoCalculating(true);
            try {
                const data = await apiService.calculateClarityReport(targetHoldings, goal.investmentGoal ? goal : null);
                if (data && data.summary) {
                    setHypoResult(data);
                }
            } catch (e) {
                console.error("[useSimulation] Hypo calculation failed:", e);
            } finally {
                setHypoCalculating(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [holdings, goal, isWhatIfMode, selectedInstrument, value, type]);

    return {
        isWhatIfMode, setIsWhatIfMode,
        hypoResult,
        hypoCalculating
    };
}
