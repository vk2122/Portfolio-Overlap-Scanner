/**
 * Mock Database for Indian Market Instruments
 * V1 Skeleton Data
 */

export const STOCKS = [
    { isin: "INE002A01018", ticker: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy" },
    { isin: "INE001A01036", ticker: "HDFC", name: "HDFC Bank Ltd", sector: "Financials" },
    { isin: "INE467B01029", ticker: "TCS", name: "Tata Consultancy Services Ltd", sector: "Technology" },
    { isin: "INE009A01021", ticker: "INFY", name: "Infosys Ltd", sector: "Technology" },
    { isin: "INE238A01034", ticker: "AXISBANK", name: "Axis Bank Ltd", sector: "Financials" },
    { isin: "INE154A01025", ticker: "ITC", name: "ITC Ltd", sector: "Consumer Staples" },
    { isin: "INE018A01030", ticker: "L&T", name: "Larsen & Toubro Ltd", sector: "Industrials" },
    { isin: "INE030A01027", ticker: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "Consumer Staples" },
    { isin: "INE044A01036", ticker: "SUNPHARMA", name: "Sun Pharmaceutical Industries", sector: "Healthcare" },
    { isin: "INE296A01024", ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financials" },
    { isin: "INE062A01020", ticker: "SBIN", name: "State Bank of India", sector: "Financials" },
    { isin: "INE009A01021", ticker: "AIRTEL", name: "Bharti Airtel Ltd", sector: "Communication" },
    { isin: "INE040A01026", ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Financials" },
    { isin: "INE081A01012", ticker: "TATASTEEL", name: "Tata Steel Ltd", sector: "Materials" },
    { isin: "INE192A01025", ticker: "AVENUES", name: "Avenues Supermarts (DMart)", sector: "Retail" }
];

// Compositions (Weights are approximate examples for V1 demo)
export const FUNDS = [
    {
        id: "MF_HDFC_TOP100",
        name: "HDFC Top 100 Fund",
        type: "MF",
        constituents: [
            { isin: "INE001A01036", weight: 9.5 }, // HDFC Bank
            { isin: "INE002A01018", weight: 8.2 }, // Reliance
            { isin: "INE467B01029", weight: 5.1 }, // TCS
            { isin: "INE009A01021", weight: 4.8 }, // Infosys
            { isin: "INE154A01025", weight: 4.2 }, // ITC
            { isin: "INE018A01030", weight: 3.9 }  // L&T
        ]
    },
    {
        id: "MF_AXIS_BLUECHIP",
        name: "Axis Bluechip Fund",
        type: "MF",
        constituents: [
            { isin: "INE238A01034", weight: 9.8 }, // Axis Bank
            { isin: "INE467B01029", weight: 6.5 }, // TCS
            { isin: "INE001A01036", weight: 8.9 }, // HDFC Bank
            { isin: "INE296A01024", weight: 5.4 }  // Bajaj Finance
        ]
    },
    {
        id: "ETF_NIFTY_BEES",
        name: "Nippon India ETF Nifty BeES",
        type: "ETF",
        constituents: [
            { isin: "INE001A01036", weight: 13.5 }, // HDFC Bank
            { isin: "INE002A01018", weight: 10.2 }, // Reliance
            { isin: "INE009A01021", weight: 7.1 },  // Infosys
            { isin: "INE154A01025", weight: 4.5 },  // ITC
            { isin: "INE467B01029", weight: 4.1 }   // TCS
        ]
    }
];
