import { useState, useEffect, useCallback } from 'react';
import { searchService } from '../services/search.service';

export function useSearch(marketData, type, loadMarketDatabase) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [kbIndex, setKbIndex] = useState(-1);

    // Fetch details when user focuses or starts typing
    const onSearchFocus = () => {
        loadMarketDatabase();
        if (searchQuery.length >= 2) {
            setShowResults(true);
        }
    };

    // Execute fuzzy search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            setKbIndex(-1);
            return;
        }

        // Trigger deferred loading if not already done
        loadMarketDatabase();

        const results = searchService.executeSearch(searchQuery, type, marketData);
        setSearchResults(results);
        setShowResults(true);
        setKbIndex(-1);
    }, [searchQuery, type, marketData, loadMarketDatabase]);

    // Handle keyboard arrow keys
    const handleSearchKeyDown = useCallback((e) => {
        if (!showResults || searchResults.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setKbIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setKbIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && kbIndex >= 0) {
            e.preventDefault();
            const r = searchResults[kbIndex];
            setSelectedInstrument(r);
            setSearchQuery(r.main);
            setShowResults(false);
            setKbIndex(-1);
        } else if (e.key === 'Escape') {
            setShowResults(false);
            setKbIndex(-1);
        }
    }, [showResults, searchResults, kbIndex]);

    const selectResult = (r) => {
        setSelectedInstrument(r);
        setSearchQuery(r.main);
        setShowResults(false);
        setKbIndex(-1);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedInstrument(null);
        setKbIndex(-1);
    };

    return {
        searchQuery, setSearchQuery,
        searchResults,
        showResults, setShowResults,
        selectedInstrument, setSelectedInstrument,
        kbIndex, setKbIndex,
        onSearchFocus,
        handleSearchKeyDown,
        selectResult,
        clearSearch
    };
}
