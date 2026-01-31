/**
 * Mock Database for Indian Market Instruments
 * Expanded to 50+ Blue-chip and Mid-cap stocks for diverse overlap scenarios.
 */

const STOCKS = [
    { isin: "INE002A01018", ticker: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy" },
    { isin: "INE001A01036", ticker: "HDFC", name: "HDFC Bank Ltd", sector: "Financials" },
    { isin: "INE467B01029", ticker: "TCS", name: "Tata Consultancy Services Ltd", sector: "Technology" },
    { isin: "INE009A01021", ticker: "INFY", name: "Infosys Ltd", sector: "Technology" },
    { isin: "INE238A01034", ticker: "AXISBANK", name: "Axis Bank Ltd", sector: "Financials" },
    { isin: "INE154A01025", ticker: "ITC", name: "ITC Ltd", sector: "Consumer Staples" },
    { isin: "INE018A01030", ticker: "L&T", name: "Larsen & Toubro Ltd", sector: "Industrials" },
    { isin: "INE030A01027", ticker: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "Consumer Staples" },
    { isin: "INE062A01020", ticker: "SBIN", name: "State Bank of India", sector: "Financials" },
    { isin: "INE296A01024", ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financials" },
    { isin: "INE044A01036", ticker: "SUNPHARMA", name: "Sun Pharmaceutical Industries", sector: "Healthcare" },
    { isin: "INE040A01026", ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Financials" },
    { isin: "INE081A01012", ticker: "TATASTEEL", name: "Tata Steel Ltd", sector: "Materials" },
    { isin: "INE192A01025", ticker: "AVENUES", name: "Avenues Supermarts (DMart)", sector: "Retail" },
    { isin: "INE245A01021", ticker: "TITAN", name: "Titan Company Ltd", sector: "Consumer Discretionary" },
    { isin: "INE123A01024", ticker: "ONGC", name: "Oil & Natural Gas Corp", sector: "Energy" },
    { isin: "INE002A01034", ticker: "ADANIENT", name: "Adani Enterprises Ltd", sector: "Energy" },
    { isin: "INE752E01010", ticker: "POWERGRID", name: "Power Grid Corp of India", sector: "Utilities" },
    { isin: "INE101A01026", ticker: "M&M", name: "Mahindra & Mahindra Ltd", sector: "Automotive" },
    { isin: "INE075A01022", ticker: "WIPRO", name: "Wipro Ltd", sector: "Technology" },
    { isin: "INE350L01033", ticker: "DMART", name: "Avenue Supermarts", sector: "Retail" },
    { isin: "INE090A01021", ticker: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Financials" },
    { isin: "INE019A01038", ticker: "JINDALSTEL", name: "Jindal Steel & Power", sector: "Materials" },
    { isin: "INE115A01026", ticker: "LICHSGFIN", name: "LIC Housing Finance", sector: "Financials" },
    { isin: "INE047A01021", ticker: "GRASIM", name: "Grasim Industries Ltd", sector: "Materials" },
    { isin: "INE066A01013", ticker: "AMBUJACEM", name: "Ambuja Cements Ltd", sector: "Materials" },
    { isin: "INE117A01022", ticker: "ABB", name: "ABB India Ltd", sector: "Industrials" },
    { isin: "INE257A01026", ticker: "BHEL", name: "Bharat Heavy Electricals", sector: "Industrials" },
    { isin: "INE584A01023", ticker: "APOLLOHOSP", name: "Apollo Hospitals", sector: "Healthcare" },
    { isin: "INE053F01010", ticker: "IRCTC", name: "Indian Railway Catering", sector: "Services" }
];

// Curated Funds for specific demos
const FUNDS = [
    {
        id: "120235",
        name: "HDFC Top 100 Fund",
        type: "MF",
        constituents: [
            { isin: "INE001A01036", weight: 9.5 },
            { isin: "INE002A01018", weight: 8.2 },
            { isin: "INE467B01029", weight: 5.1 },
            { isin: "INE009A01021", weight: 4.8 },
            { isin: "INE154A01025", weight: 4.2 }
        ]
    }
];

module.exports = { STOCKS, FUNDS };
