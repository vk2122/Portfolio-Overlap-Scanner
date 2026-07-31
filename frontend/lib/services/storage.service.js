import { loadJSON, saveJSON, safeStorage } from '../storage';

const HOLDINGS_KEY = 'unstacked_holdings';
const GOAL_KEY = 'unstacked_goal';

export const storageService = {
    loadHoldings() {
        return loadJSON(HOLDINGS_KEY, []);
    },
    saveHoldings(holdings) {
        if (holdings && holdings.length > 0) {
            saveJSON(HOLDINGS_KEY, holdings);
        } else {
            safeStorage.removeItem(HOLDINGS_KEY);
        }
    },
    loadGoal() {
        return loadJSON(GOAL_KEY, { investmentGoal: null, timeHorizon: null });
    },
    saveGoal(goal) {
        if (goal && goal.investmentGoal) {
            saveJSON(GOAL_KEY, goal);
        } else {
            safeStorage.removeItem(GOAL_KEY);
        }
    }
};
