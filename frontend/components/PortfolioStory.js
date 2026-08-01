export default function PortfolioStory({ result, healthScore }) {
    if (!result || !result.summary) return null;

    const overlap = result.summary.overlapPct;
    const topDriver = result.summary.topDriverStock;
    const topDriverPct = result.summary.topDriverStockPct;
    const focusZone = result.focusZone;

    const cleanTicker = (ticker) => ticker?.replace('INE_SYNTH_', '').replace('INE_', '') || 'Unknown';

    const healthInterp = healthScore?.interp || 'GOOD';
    const finalScore = healthScore?.finalScore || 70;

    let storyTitle = "Diversification Story";
    let storyBody = "";
    let alertColor = "var(--success)";

    if (overlap > 40) {
        alertColor = "var(--danger)";
        storyTitle = "⚠️ Redundant Diversification Detected";
        storyBody = `Your portfolio shows a high overlap of ${overlap}%. More than a third of your invested capital is actively duplicated across multiple funds. The primary driver of this overlap is ${focusZone?.topOverlapDrivers?.map(d => cleanTicker(d.ticker)).join(' and ') || 'common stock picks'}.`;
    } else if (overlap >= 20) {
        alertColor = healthInterp === 'FRAGILE' ? "var(--danger)" : "var(--warning)";
        storyTitle = healthInterp === 'FRAGILE'
            ? "⚠️ Moderate Overlap & Elevated Health Risk"
            : "⚡️ Moderate Overlap & Concentration";
        const bridgeNote = (healthInterp === 'RISKY' || healthInterp === 'FRAGILE' || finalScore < 65)
            ? ` Note: Overlap measures duplicated stock holdings (${overlap}%), whereas Portfolio Health evaluates total multi-pillar risk (${finalScore}/100 - ${healthInterp}). A portfolio can maintain moderate fund overlap while carrying elevated overall risk due to single-stock concentration.`
            : ``;
        storyBody = `Your portfolio shows a moderate overlap of ${overlap}%. While some duplication is normal when holding general index funds, your concentration is dominated by ${cleanTicker(topDriver)}, accounting for ${topDriverPct}% of total exposure.${bridgeNote}`;
    } else {
        // Low overlap (<20%) - Check Health Score to prevent contradictory narrative
        if (healthInterp === 'FRAGILE' || finalScore < 50) {
            alertColor = "var(--danger)";
            storyTitle = "⚡ Low Overlap, But High Concentration Risk";
            storyBody = `Your portfolio shows minimal overlap (${overlap}%), but overall structural health is FRAGILE. Low fund overlap alone does not protect your capital because exposure is heavily concentrated in ${cleanTicker(topDriver)} (${topDriverPct}% of portfolio).`;
        } else if (healthInterp === 'RISKY' || finalScore < 65) {
            alertColor = "var(--warning)";
            storyTitle = "⚡ Low Overlap with Concentration Bottleneck";
            storyBody = `Your portfolio exhibits low overlap of ${overlap}%, but carries concentration risk dominated by ${cleanTicker(topDriver)} (${topDriverPct}% exposure). Overall structural health remains in the RISKY tier.`;
        } else if (healthInterp === 'ELITE' || finalScore >= 80) {
            alertColor = "var(--success)";
            storyTitle = "💎 Elite Diversification Active";
            storyBody = `Your portfolio represents institutional-grade diversification with only ${overlap}% overlap. Your holdings are highly complementary, spreading risk efficiently across ${result.summary.uniqueStocks || result.summary.totalStocks || 0} unique companies.`;
        } else {
            alertColor = "var(--success)";
            storyTitle = "✅ Balanced & Complementary Holdings";
            storyBody = `Your portfolio shows good overall structure with low overlap of ${overlap}%. Holdings work efficiently together with minor concentration in ${cleanTicker(topDriver)} (${topDriverPct}% exposure).`;
        }
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
