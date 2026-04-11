# UNSTACKED — Portfolio Clarity Engine 🔬

**UNSTACKED** is a high-end, institutional-grade diagnostic instrument designed to reveal hidden concentration risks in Indian investment portfolios. It deconstructs your portfolio to find the truth behind mutual fund overlap and stock duplication.

## 💎 Core Philosophy
Most investors "stack" funds thinking they are diversifying, only to realize their underlying stock exposure is identical across multiple products. **UNSTACKED** exposes fake diversification.

## 🚀 What's New in v2.0
We completely overhauled the engine to focus on **interactive, dynamic diagnostics** rather than static reports:

### 1. Unified Portfolio Health Score 📊
Replaced simple metric counters with an institutional-grade algorithmic health framework.
- **5-Pillar Analysis**: Evaluates and weights *Concentration (30%)*, *Overlap (20%)*, *Sector Balance (20%)*, *Risk-Adjusted Performance (20%)*, and *Correlation (10%)*.
- **Dynamic Penalties**: Hard-coded alerts trigger if your top 5 holdings dominate >50% of the portfolio.
- **Interpretation Matrix**: Outputs your portfolio as *Elite*, *Good*, *Risky*, or *Fragile*.

### 2. Interactive Analytical Drawers 🪄
The traditional flat dashboard has been upgraded into an interactive workspace.
- **Metric Expansion**: Clicking any Metric Card on the dashboard scales open a beautifully centered, perfectly constrained overlay drawer identifying the exact subset of holdings responsible for that specific metric.
- **No Scroll Context**: Data lists actively cap off to prevent UI scrolling, offering an immaculately tight presentation.

### 3. Integrated TradingView Technicals 📈
- **Live Embed**: Investigating your "Top Concentration Driver" leverages a dynamically embedded TradingView Advanced Chart within the modal.
- **Sanitized Precision**: Automatically parses BSE/NSE ticker equivalents with robust fallback protection against API desyncs, giving live price data right alongside your risk metrics.

## 🛠 Tech Stack
- **Frontend**: Next.js 14, React, Vanilla CSS3 (Custom Design System with Dark-mode semantics).
- **Backend**: Node.js, Express.js.
- **Integrations**: TradingView Widget Embeds (`BSE` / `NSE`).
- **Deployment**: Vercel Serverless Architecture (Monorepo Optimized).

## 📦 Project Structure
```bash
├── frontend/          # Next.js Application
│   ├── app/           # App router & Global styles (globals.css contains Drawer logic)
│   ├── components/    # Core UI logic (PortfolioApp.js containing the Health algorithm)
│   └── lib/           # Data loaders & Mock DB
├── backend/           # Node.js API
│   ├── src/           # Calculator logic & Clarity Engine
│   └── tests/         # Unit testing suite
├── vercel.json        # Production Deployment Orchestrator
└── README.md
```

## 🏗 Local Development

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/portfolio-overlap-scanner.git
   cd portfolio-overlap-scanner
   npm install && cd frontend && npm install && cd ../backend && npm install
   ```

2. **Run Application Services**
   ```bash
   # Terminal 1: Backend API
   cd backend && npm start

   # Terminal 2: Frontend Client
   cd frontend && npm run dev
   ```

---

**UNSTACKED** — *Diversified? Check again.*
