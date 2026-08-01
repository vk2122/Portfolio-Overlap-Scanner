# UNSTACKED — Portfolio Clarity Engine 🔬

[![Foundation Version](https://img.shields.io/badge/Foundation-v2.5-emerald.svg)](governance/PRODUCT_ENGINEERING_MANIFESTO.md)
[![Build & Test Status](https://img.shields.io/badge/Suite-100%25%20PASS-brightgreen.svg)](governance/TESTING_STANDARD.md)
[![Governance](https://img.shields.io/badge/Governance-Enforced-blue.svg)](governance/)

**UNSTACKED** is an institutional-grade diagnostic instrument designed to reveal hidden concentration risks, stock duplication, and sector overlap in Indian investment portfolios. It deconstructs mutual fund holdings to expose fake diversification and restore portfolio clarity.

---

## 💎 Core Product Philosophy

Most investors "stack" funds thinking they are diversifying, only to discover their underlying stock exposure is identical across multiple financial products. **UNSTACKED** reveals true portfolio overlap, effective holdings count, and sector concentration risks using deterministic mathematical algorithms.

---

## 🏛 Engineering Governance & Standards

UNSTACKED operates under strict engineering governance enforced by the [Governance Framework](governance/):

- **[Product Engineering Manifesto](governance/PRODUCT_ENGINEERING_MANIFESTO.md)**: Truth above convenience, determinism, and long-term quality.
- **[Architecture Principles](governance/ARCHITECTURE_PRINCIPLES.md)**: Backend owns mathematical truth; Frontend presents. Single source of truth.
- **[Development Workflow](governance/DEVELOPMENT_WORKFLOW.md)**: 10-stage task lifecycle from understanding to CTO sign-off.
- **[Definition of Done](governance/DEFINITION_OF_DONE.md)**: Permanent DoD covering code quality, tests, UI responsiveness, and zero regressions.
- **[Testing Standard](governance/TESTING_STANDARD.md)**: 100% pass rate requirement across Jest unit tests and Playwright E2E suites.

---

## 📦 Repository Structure

```
.
├── backend/                  # Express.js Node.js calculation engine
│   ├── src/                  # Services (overlap.service.js) & API routes
│   └── tests/                # Jest unit & integration test suites
├── frontend/                 # Next.js 14 React client application
│   ├── app/                  # App Router, layout, metadata & global styles
│   ├── components/           # UI components (PortfolioStory, AnalyticsCards, drawers)
│   └── lib/                  # Services (share.service.js), custom hooks (usePortfolio.js)
├── governance/               # Mandatory Engineering Governance Framework
├── documentation/            # Central Knowledge Base (architecture, product, release, audits)
├── scripts/                  # Repository utility scripts (scrape_etfs.js)
├── testing/                  # Playwright E2E and regression test suites
├── vercel.json               # Monorepo deployment orchestrator
└── README.md                 # Product overview and entrypoint
```

---

## 🏗 Local Development Quickstart

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/vk2122/Portfolio-Overlap-Scanner.git
cd Portfolio_Overlap_Scanner

# Install dependencies across backend & frontend
cd backend && npm install
cd ../frontend && npm install
```

### 2. Running Services
```bash
# Terminal 1: Backend Service (Runs on http://localhost:5000)
cd backend && npm start

# Terminal 2: Frontend Client (Runs on http://localhost:3000)
cd frontend && npm run dev
```

### 3. Automated Verification
```bash
# Run Backend Unit Tests
cd backend && npm test

# Run End-to-End Playwright Regression Tests
cd testing/playwright && npx playwright test
```

---

## 📚 Central Documentation

For in-depth technical specifications, high-level/low-level designs, API contracts, and release protocols, refer to the **[Central Documentation Base](documentation/README.md)**.
