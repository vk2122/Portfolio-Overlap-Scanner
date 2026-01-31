# UNSTACKED — Portfolio Concentration Scanner 🔬

**UNSTACKED** is a high-end, institutional-grade diagnostic instrument designed to reveal hidden concentration risks in Indian investment portfolios. It provides a clinical, single-axis analysis of equity and mutual fund holdings to ensure your diversification isn't just an illusion.

![Unstacked Preview](https://via.placeholder.com/1200x600/0B0D10/E8EAED?text=UNSTACKED+DIAGNOSTIC+SCANNER)

## 💎 Core Philosophy
Most investors "stack" funds thinking they are diversifying, only to realize their underlying stock exposure is identical across multiple products. **UNSTACKED** deconstructs your portfolio to find the truth.

## 🚀 Key Features

### 1. Clinical Diagnostic Interface
- **Single-Axis Vertical Flow**: A streamlined UX that moves from input to insight without distraction.
- **Glassmorphic Depth**: High-end UI textures with 20px frosted-glass blurs for a premium "technical instrument" feel.
- **Dynamic Verdicts**: Large-scale visual feedback that updates in real-time as you add holdings.

### 2. Dual-Mode Analysis
- **Manual Entry**: Intelligent, auto-closing search dropdowns for Stocks, Mutual Funds, and ETFs (Indian Market).
- **CAS Import (PDF)**: Technical select-mode for PDF statements with real-time file feedback (Ready for parsing engine integration).

### 3. Precision Risk Engine
- **7.0% Moderate Risk**: Threshold for initial concentration alerts.
- **15.0% Critical Risk**: High-intensity alert state with "Risk Red" branding.
- **Portfolio Context**: Exposure metrics are grounded against your total capital size (₹) for actionable insight.

## 🛠 Tech Stack
- **Frontend**: Next.js 14, React, Vanilla CSS3 (Custom Design System).
- **Backend**: Node.js, Express.js.
- **Deployment**: Vercel Serverless Architecture (Monorepo Optimized).
- **Data**: Curated Database of Indian Blue-chip Stocks & Top Mutual Funds.

## 📦 Project Structure
```bash
├── frontend/          # Next.js Application
│   ├── app/           # App router & Global styles (Refined CSS)
│   ├── components/    # Core UI logic (PortfolioApp.js)
│   └── lib/           # Data loaders & Mock DB
├── backend/           # Node.js API
│   ├── src/           # Calculator logic & Express Server
│   └── tests/         # Unit testing suite
├── vercel.json        # Production Deployment Orchestrator
└── .gitignore         # Optimized for GitHub/Vercel
```

## 🏗 Local Development

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-username/portfolio-overlap-scanner.git
   cd portfolio-overlap-scanner
   ```

2. **Install Dependencies**
   ```bash
   # Root, Frontend, and Backend
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Run Locally**
   ```bash
   # Terminal 1: Backend (Port 5000)
   cd backend && npm start

   # Terminal 2: Frontend (Port 3000)
   cd frontend && npm run dev
   ```

## 🌐 Deployment
This project is pre-configured for **Vercel**. 
- The `vercel.json` at the root handles the routing and builds.
- The backend automatically scales as Serverless Functions.
- The frontend dynamically detects the environment and routes API calls to the correct production proxy.

---

**UNSTACKED** — *Diversified? Check again.*
