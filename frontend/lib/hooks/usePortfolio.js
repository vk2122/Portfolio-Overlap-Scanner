import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageService } from '../services/storage.service';
import { shareService } from '../services/share.service';

export function usePortfolio(holdings, setHoldings, goal, setGoal, marketData, isHydrated, setResult) {

    // Bulk Import States
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkPreview, setBulkPreview] = useState([]);

    // Save holdings to localStorage when they change (only if hydrated)
    useEffect(() => {
        if (!isHydrated) return;
        storageService.saveHoldings(holdings);
    }, [holdings, isHydrated]);

    // Save goal to localStorage when it changes (only if hydrated)
    useEffect(() => {
        if (!isHydrated) return;
        storageService.saveGoal(goal);
    }, [goal, isHydrated]);

    // Autocomplete sources list helper
    const allSources = useMemo(() => {
        return [
            ...(marketData.stocks || []).map(s => ({ ...s, _type: 'EQUITY' })),
            ...(marketData.etfs || []).map(e => ({ ...e, _type: 'ETF' })),
            ...(marketData.funds || []).map(f => ({ ...f, _type: 'MF' }))
        ];
    }, [marketData]);

    // Parse bulk copy-pasted text
    const parseBulkText = useCallback((text) => {
        if (!text.trim()) { setBulkPreview([]); return; }
        const lines = text.split('\n').filter(l => l.trim());

        const parsed = lines.map(line => {
            const normalizedLine = line.replace(/(\d),(\d)/g, '$1$2').replace(/"/g, '');
            let parts = normalizedLine.split('\t').map(p => p.trim()).filter(Boolean);
            if (parts.length < 2) {
                parts = normalizedLine.split(',').map(p => p.trim()).filter(Boolean);
            }

            if (parts.length < 2) return { raw: line, valid: false, name: line.trim(), type: '?', value: 0 };

            const nameOrTicker = parts[0];
            let lineType = (parts.length >= 3 ? parts[1] : '').toUpperCase();
            if (lineType === 'EQ') lineType = 'EQUITY';
            if (lineType === 'FUND') lineType = 'MF';

            const valStr = parts.length >= 3 ? parts[2] : parts[1];
            const val = parseFloat(valStr.replace(/[^0-9.]/g, ''));

            if (!['EQUITY', 'MF', 'ETF'].includes(lineType)) {
                lineType = 'EQUITY';
            }

            const q = nameOrTicker.toLowerCase();
            const match = allSources.find(s =>
                (s.ticker || '').toLowerCase() === q ||
                (s.name || '').toLowerCase() === q ||
                (s.isin || '') === nameOrTicker
            );

            if (match && !isNaN(val) && val > 0) {
                return {
                    raw: line,
                    valid: true,
                    id: match.isin || match.id,
                    name: match.ticker || match.name,
                    fullName: match.name,
                    type: match._type || lineType,
                    value: val
                };
            }

            return {
                raw: line,
                valid: !isNaN(val) && val > 0,
                id: nameOrTicker,
                name: nameOrTicker,
                fullName: nameOrTicker,
                type: lineType,
                value: isNaN(val) ? 0 : val
            };
        });
        setBulkPreview(parsed);
    }, [allSources]);

    useEffect(() => {
        parseBulkText(bulkText);
    }, [bulkText, parseBulkText]);

    const addBulkHoldings = useCallback(() => {
        const validItems = bulkPreview.filter(p => p.valid && p.value > 0);
        const newHoldings = validItems.map(item => ({
            id: Date.now() + Math.random(),
            instrumentId: item.id,
            type: item.type,
            name: item.name,
            value: item.value
        }));
        setHoldings(prev => [...prev, ...newHoldings]);
        setShowBulkImport(false);
        setBulkText('');
        setBulkPreview([]);
    }, [bulkPreview]);

    const addHolding = useCallback((selectedInstrument, type, value, clearFormCallback) => {
        if (!selectedInstrument || !value) return;
        const numericVal = parseFloat(value);
        if (isNaN(numericVal) || numericVal <= 0) return;

        setHoldings(prev => [...prev, {
            id: Date.now() + Math.random(),
            instrumentId: selectedInstrument.id,
            type,
            name: selectedInstrument.main,
            value: numericVal
        }]);
        if (clearFormCallback) clearFormCallback();
    }, []);

    const removeHolding = useCallback((id) => {
        setHoldings(prev => prev.filter(h => h.id !== id));
    }, []);

    const clearAllHoldings = useCallback(() => {
        if (window.confirm('Clear all holdings and goal data?')) {
            setHoldings([]);
            setGoal({ investmentGoal: null, timeHorizon: null });
            if (setResult) setResult(null);
        }
    }, [setResult]);

    // Share URL Generator (Using shareService)
    const handleShare = useCallback(() => {
        if (holdings.length === 0) return;
        const url = shareService.generateShareableURL(holdings, goal);
        navigator.clipboard.writeText(url);

        const btn = document.getElementById('share-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ COPIED';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        }
    }, [holdings, goal]);

    // Validation engine outputs
    const validationErrors = useMemo(() => {
        const errors = [];
        const ids = new Set();
        holdings.forEach(h => {
            const key = `${h.type}:${h.instrumentId}`;
            if (ids.has(key)) {
                errors.push({ type: 'DUPLICATE', message: `Duplicate asset detected: ${h.name} is entered multiple times.` });
            }
            ids.add(key);

            if (h.value <= 0) {
                errors.push({ type: 'INVALID_AMOUNT', message: `Invalid value for ${h.name}: Amount must be greater than zero.` });
            }
            if (!h.name) {
                errors.push({ type: 'MISSING_NAME', message: `Incomplete entry: Asset is missing a name.` });
            }

            // Check if unknown asset (i.e. simulated)
            const exists = allSources.some(s => s.isin === h.instrumentId || s.id === h.instrumentId);
            if (h.type !== 'EQUITY' && !exists) {
                errors.push({ type: 'SIMULATED', message: `Estimated portfolio (Simulated): constituents for ${h.name} are mathematically generated.`, severity: 'warning' });
            }
        });
        return errors;
    }, [holdings, allSources]);

    return {
        holdings,
        setHoldings,
        goal,
        setGoal,
        showBulkImport,
        setShowBulkImport,
        bulkText,
        setBulkText,
        bulkPreview,
        addHolding,
        removeHolding,
        clearAllHoldings,
        addBulkHoldings,
        handleShare,
        validationErrors
    };
}
