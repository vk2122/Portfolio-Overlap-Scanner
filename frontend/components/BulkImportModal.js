import { useEffect } from 'react';

export default function BulkImportModal({ onClose, onAdd, bulkText, setBulkText, bulkPreview }) {
    const validCount = bulkPreview.filter(p => p.valid && p.value > 0).length;

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="card-drawer-overlay" onClick={onClose}>
            <div className="bulk-import-modal" onClick={e => e.stopPropagation()}>
                <div className="bulk-import-header">
                    <h3><span>📋</span> Bulk Import</h3>
                    <button className="card-drawer-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="bulk-import-format-hint">
                    Paste your holdings, one per line.<br />
                    Format: <code>Ticker, Type, Value</code><br />
                    Example: <code style={{color: 'var(--color-info)'}}>TCS, 5000</code> or <code>RELIANCE, EQUITY, 50000</code>
                </div>

                <textarea
                    className="bulk-import-textarea"
                    placeholder={`TCS, 5000\nRELIANCE, 2000\nHDFC Top 100, MF, 100000`}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    autoFocus
                />

                {bulkPreview.length > 0 && (
                    <div className="bulk-import-preview">
                        {bulkPreview.map((row, i) => (
                            <div key={i} className={`bulk-preview-row ${row.valid ? 'valid' : 'invalid'}`}>
                                <span className="bulk-preview-status">{row.valid ? '✓' : '✗'}</span>
                                <span className="bulk-preview-name" title={row.fullName || row.name}>{row.name}</span>
                                <span className="bulk-preview-type">{row.type}</span>
                                <span className="bulk-preview-value">
                                    {row.value > 0 ? `₹${row.value.toLocaleString()}` : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bulk-import-actions">
                    <span className="bulk-import-count">
                        {validCount > 0 && <><strong>{validCount}</strong> valid holding{validCount !== 1 ? 's' : ''} ready</>}
                        {validCount === 0 && bulkPreview.length > 0 && 'No valid holdings detected'}
                    </span>
                    <button className="bulk-btn-cancel" onClick={onClose}>Cancel</button>
                    <button
                        className="bulk-btn-add"
                        disabled={validCount === 0}
                        onClick={onAdd}
                    >
                        Add {validCount} Holding{validCount !== 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
