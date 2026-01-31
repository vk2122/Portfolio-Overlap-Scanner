/**
 * Mock Database for Indian Market Instruments
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
    { isin: "INE062A01020", ticker: "SBIN", name: "State Bank of India", sector: "Financials" },
    { isin: "INE296A01024", ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financials" }
];

export const FUNDS = [
    {
        id: "120235",
        name: "HDFC Top 100 Fund",
        type: "MF",
        constituents: [
            { isin: "INE001A01036", weight: 9.5 },
            { isin: "INE002A01018", weight: 8.2 },
            { isin: "INE467B01029", weight: 5.1 }
        ]
    },
    {
        id: "119545",
        name: "Motilal Oswal Midcap Fund",
        type: "MF",
        constituents: [
            { isin: "INE467B01029", weight: 7.4 },
            { isin: "INE238A01034", weight: 6.2 },
            { isin: "INE009A01021", weight: 5.8 }
        ]
    }
];
