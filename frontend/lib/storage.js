// SSR-safe localStorage wrapper + JSON helpers

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const safeStorage = {
    getItem(key) {
        if (!isBrowser()) return null;
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem(key, value) {
        if (!isBrowser()) return;
        try {
            window.localStorage.setItem(key, value);
        } catch {
            // ignore quota / private mode
        }
    },
    removeItem(key) {
        if (!isBrowser()) return;
        try {
            window.localStorage.removeItem(key);
        } catch {
            // ignore
        }
    }
};

export function loadJSON(key, fallback = null) {
    const raw = safeStorage.getItem(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function saveJSON(key, value) {
    safeStorage.setItem(key, JSON.stringify(value));
}
