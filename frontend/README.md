# Portfolio Overlap Insight (Next.js Version)

This is the Next.js migration of the Portfolio Overlap Insight Platform.

## Features
- **Stock & Fund Search**: Real-time search across thousands of Indian stocks and mutual funds.
- **Concentration Analysis**: Instantly calculate your total exposure to individual stocks through direct holdings and mutual fund constituents.
- **Glassmorphism UI**: Beautiful, premium dark mode interface.
- **Deduplicated Data**: Intelligent data loading that avoids duplicates and prefers verified mock data for calculations.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## Project Structure
- `/app`: Next.js 14 App Router (Layout & Entry Page)
- `/components`: React Components (Main App UI)
- `/lib`: Business Logic (Calculation engine, Data loader)
- `/public/data`: Static JSON databases for stocks and funds.

## Note
Ensure you have **Node.js 18+** installed to run this application.
