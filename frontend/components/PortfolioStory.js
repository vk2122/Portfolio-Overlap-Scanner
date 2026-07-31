export default function PortfolioStory({ result, healthScore }) {
    if (!result || !result.summary) return null;

    const overlap = result.summary.overlapPct;
    const topDriver = result.summary.topDriverStock;
    const topDriverPct = result.summary.topDriverStockPct;
    const focusZone = result.focusZone;

    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '') || 'Unknown';

    let storyTitle = "Diversification Story";
    let storyBody = "";
    let alertColor = "var(--success)";

    if (overlap > 40) {
        alertColor = "var(--danger)";
        storyTitle = "⚠️ Redundant Diversification Detected";
        storyBody = `Your portfolio shows a high overlap of ${overlap}%. This means that more than a third of your invested capital is actively duplicated across multiple funds. The primary driver of this overlap is ${focusZone.topOverlapDrivers?.map(d => cleanTicker(d.ticker)).join(' and ') || 'common stock picks'}.`;
    } else if (overlap >= 20) {
        alertColor = "var(--warning)";
        storyTitle = "⚡️ Moderate Overlap & Concentration";
        storyBody = `Your portfolio shows a moderate overlap of ${overlap}%. While some duplication is normal when holding general index funds, your concentration is dominated by ${cleanTicker(topDriver)}, which accounts for ${topDriverPct}% of your total direct and indirect exposure.`;
    } else {
        storyTitle = "💎 Elite Diversification Active";
        storyBody = `Your portfolio represents excellent diversification, with only ${overlap}% overlap. Your mutual funds and stock holdings are highly complementary, spreading your risk efficiently across ${result.summary.uniqueStocks || result.summary.totalStocks || 0} unique companies.`;
    }

    return (
        <section className="details-zone fadeIn" style={{ borderLeft: `4px solid ${alertColor}`, padding: '1.2rem 1.5rem', background: 'rgba(255, 255, 255, 0.01)', overflow: 'visible', wordWrap: 'break-word', overflowWrap: 'break-word', minHeight: 'fit-content' }}>
            <h4 style={{ color: alertColor, borderBottom: 'none', paddingBottom: 0, marginBottom: '0.4rem', fontSize: '1rem', fontWeight: '800' }}>
                {storyTitle}
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', color: 'var(--text-primary)', margin: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {storyBody} {result.scenarios?.[0] ? `Removing ${result.scenarios[0].holdingRemoved} is simulated to reduce your overlap to ${result.scenarios[0].after.overlapPct}%.` : ""}
            </p>
        </section>
    );
}
