# Portfolio Overlap Insight Platform (v1)

A privacy-focused, client-side web application to analyze portfolio concentration and overlap across Direct Equity, Mutual Funds, and ETFs for Indian investors.

## Features
- **Deterministic Exposure Calculation**: Aggregates exposure at stock level.
- **Privacy First**: All data processing happens in your browser. No data is sent to any server.
- **Visual Insights**: See your top concentrated stocks and their source (Direct vs MF vs ETF).
- **Import Support**: Manual entry or upload structured JSON data.

## Quick Start

### Prerequisites
- Python 3.x (recommended for local server) or any static web server.

### Running the App
1. Open a terminal in this directory.
2. Run a local server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to: [http://localhost:8000](http://localhost:8000)

## usage

### Manual Entry
1. Select the instrument type (Equity, MF, ETF).
2. Choose the specific instrument from the list.
3. Enter the current market value.
4. Click **Add Holding**.

### CAS Import (Beta)
1. Go to the "CAS Import" tab.
2. Drag and drop a JSON file matching the schema, or paste the JSON content.
3. Click **Process Import**.

**Sample JSON Format:**
```json
[
    { "type": "MF", "id": "MF_HDFC_TOP100", "value": 100000 },
    { "type": "EQUITY", "isin": "INE001A01036", "value": 50000 }
]
```

## Tech Stack
- HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- No external dependencies (framework-less)
