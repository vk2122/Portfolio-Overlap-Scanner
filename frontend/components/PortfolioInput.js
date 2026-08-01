export default function PortfolioInput({
    type, setType,
    searchQuery, setSearchQuery,
    searchResults,
    showResults, setShowResults,
    selectedInstrument, setSelectedInstrument,
    value, setValue,
    kbIndex, setKbIndex,
    showTypeResults, setShowTypeResults,
    isWhatIfMode, setIsWhatIfMode,
    onAddHolding,
    onBulkClick,
    onSearchFocus,
    handleSearchKeyDown,
    formRef,
    searchInputRef,
    resultsRef
}) {
    const highlightMatch = (text, query) => {
        if (!query || query.length < 2) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + query.length);
        const after = text.slice(idx + query.length);
        return <>{before}<mark>{match}</mark>{after}</>;
    };

    return (
        <form className="input-strip" onSubmit={onAddHolding} ref={formRef}>
            <div className="field type-field">
                <label>TYPE</label>
                <div className="technical-select" onClick={() => setShowTypeResults(!showTypeResults)}>
                    <div className="current-value">
                        {type === 'EQUITY' ? 'STOCKS' : type === 'MF' ? 'MUTUAL FUNDS' : 'ETFs'}
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    {showTypeResults && (
                        <div className="search-results type-dropdown">
                            <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('EQUITY'); setSearchQuery(''); setShowTypeResults(false); }}>STOCKS</div>
                            <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('MF'); setSearchQuery(''); setShowTypeResults(false); }}>MUTUAL FUNDS</div>
                            <div className="result-item" onClick={(e) => { e.stopPropagation(); setType('ETF'); setSearchQuery(''); setShowTypeResults(false); }}>ETFs</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="field instrument-field">
                <label>INSTRUMENT</label>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search stocks, funds, ETFs..."
                    value={searchQuery}
                    onFocus={onSearchFocus}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                    onKeyDown={handleSearchKeyDown}
                    autoComplete="off"
                />
                {showResults && searchResults.length > 0 && (
                    <div className="search-results-enhanced" ref={resultsRef}>
                        {searchResults.map((r, idx) => (
                            <div
                                key={r.id}
                                className={`result-item-enhanced ${idx === kbIndex ? 'keyboard-active' : ''}`}
                                onClick={() => {
                                    setSelectedInstrument(r);
                                    setSearchQuery(r.main);
                                    setShowResults(false);
                                    setKbIndex(-1);
                                }}
                            >
                                <div className="result-item-left">
                                    <span className="result-item-ticker">
                                        {highlightMatch(r.main, searchQuery)}
                                        {r.exchange && (
                                            <span className={`exchange-badge ${r.exchange.toLowerCase()}`}>
                                                {r.exchange}
                                            </span>
                                        )}
                                    </span>
                                    {r.sub && r.sub !== r.main && (
                                        <span className="result-item-name">
                                            {highlightMatch(r.sub, searchQuery)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="field value-field">
                <label title="Current total market value of this position in Rupees">
                    CURRENT VALUE (₹) <span style={{ opacity: 0.65, fontSize: '0.6rem', textTransform: 'none', fontWeight: 500 }}>(Market Value)</span>
                </label>
                <input type="number" placeholder="50000" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="input-strip-actions">
                <button
                    type="button"
                    className={`bulk-import-trigger ${isWhatIfMode ? 'active' : ''}`}
                    onClick={() => setIsWhatIfMode(!isWhatIfMode)}
                    title="Simulate portfolio impact without saving permanently"
                    style={{ fontWeight: 800 }}
                >
                    <span style={{ marginRight: '4px' }}>🔮</span> 
                    WHAT-IF SIMULATION
                </button>
                <button 
                    type="submit" 
                    className="cta-reveal" 
                    disabled={!selectedInstrument || !value}
                    title={!selectedInstrument ? "Select an instrument from search first" : !value ? "Enter position value to add" : "Add position to portfolio"}
                    style={{
                        opacity: (!selectedInstrument || !value) ? 0.45 : 1,
                        cursor: (!selectedInstrument || !value) ? 'not-allowed' : 'pointer',
                        filter: (!selectedInstrument || !value) ? 'grayscale(0.7)' : 'none'
                    }}
                >
                    ADD
                </button>
                <button type="button" className="bulk-import-trigger" onClick={onBulkClick} title="Bulk paste CSV data">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    BULK
                </button>
            </div>
        </form>
    );
}
