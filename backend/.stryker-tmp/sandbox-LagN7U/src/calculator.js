// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
const {
  STOCKS,
  FUNDS
} = require('./mock-db');

/**
 * Calculates stock-level exposure from a portfolio of holdings.
 * @param {Array} holdings - List of user holdings { instrumentId, type, name, value }
 */
function calculatePortfolioExposure(holdings) {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    if (stryMutAct_9fa48("3") ? !holdings && holdings.length === 0 : stryMutAct_9fa48("2") ? false : stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1", "2", "3"), (stryMutAct_9fa48("4") ? holdings : (stryCov_9fa48("4"), !holdings)) || (stryMutAct_9fa48("6") ? holdings.length !== 0 : stryMutAct_9fa48("5") ? false : (stryCov_9fa48("5", "6"), holdings.length === 0)))) {
      if (stryMutAct_9fa48("7")) {
        {}
      } else {
        stryCov_9fa48("7");
        return stryMutAct_9fa48("8") ? {} : (stryCov_9fa48("8"), {
          totalValue: 0,
          stockExposure: stryMutAct_9fa48("9") ? ["Stryker was here"] : (stryCov_9fa48("9"), [])
        });
      }
    }
    let totalValue = 0;
    const exposureMap = new Map(); // isin -> exposure object

    // Helper to get or create entry in exposure map
    const getStockEntry = isin => {
      if (stryMutAct_9fa48("10")) {
        {}
      } else {
        stryCov_9fa48("10");
        if (stryMutAct_9fa48("13") ? false : stryMutAct_9fa48("12") ? true : stryMutAct_9fa48("11") ? exposureMap.has(isin) : (stryCov_9fa48("11", "12", "13"), !exposureMap.has(isin))) {
          if (stryMutAct_9fa48("14")) {
            {}
          } else {
            stryCov_9fa48("14");
            const stockInfo = STOCKS.find(stryMutAct_9fa48("15") ? () => undefined : (stryCov_9fa48("15"), s => stryMutAct_9fa48("18") ? s.isin !== isin : stryMutAct_9fa48("17") ? false : stryMutAct_9fa48("16") ? true : (stryCov_9fa48("16", "17", "18"), s.isin === isin)));
            exposureMap.set(isin, stryMutAct_9fa48("19") ? {} : (stryCov_9fa48("19"), {
              isin: isin,
              ticker: stockInfo ? stockInfo.ticker : isin,
              name: stockInfo ? stockInfo.name : stryMutAct_9fa48("20") ? "" : (stryCov_9fa48("20"), "Unknown"),
              totalVal: 0,
              directVal: 0,
              mfVal: 0,
              etfVal: 0
            }));
          }
        }
        return exposureMap.get(isin);
      }
    };

    // Calculate distributions
    holdings.forEach(h => {
      if (stryMutAct_9fa48("21")) {
        {}
      } else {
        stryCov_9fa48("21");
        const val = parseFloat(h.value);
        stryMutAct_9fa48("22") ? totalValue -= val : (stryCov_9fa48("22"), totalValue += val);
        if (stryMutAct_9fa48("25") ? h.type !== 'EQUITY' : stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23", "24", "25"), h.type === (stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'EQUITY')))) {
          if (stryMutAct_9fa48("27")) {
            {}
          } else {
            stryCov_9fa48("27");
            const entry = getStockEntry(h.instrumentId);
            stryMutAct_9fa48("28") ? entry.directVal -= val : (stryCov_9fa48("28"), entry.directVal += val);
            stryMutAct_9fa48("29") ? entry.totalVal -= val : (stryCov_9fa48("29"), entry.totalVal += val);
          }
        } else {
          if (stryMutAct_9fa48("30")) {
            {}
          } else {
            stryCov_9fa48("30");
            const fund = FUNDS.find(stryMutAct_9fa48("31") ? () => undefined : (stryCov_9fa48("31"), f => stryMutAct_9fa48("34") ? f.id !== h.instrumentId : stryMutAct_9fa48("33") ? false : stryMutAct_9fa48("32") ? true : (stryCov_9fa48("32", "33", "34"), f.id === h.instrumentId)));
            if (stryMutAct_9fa48("37") ? fund || fund.constituents : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), fund && fund.constituents)) {
              if (stryMutAct_9fa48("38")) {
                {}
              } else {
                stryCov_9fa48("38");
                fund.constituents.forEach(c => {
                  if (stryMutAct_9fa48("39")) {
                    {}
                  } else {
                    stryCov_9fa48("39");
                    const indirectVal = stryMutAct_9fa48("40") ? val / (c.weight / 100) : (stryCov_9fa48("40"), val * (stryMutAct_9fa48("41") ? c.weight * 100 : (stryCov_9fa48("41"), c.weight / 100)));
                    const entry = getStockEntry(c.isin);
                    if (stryMutAct_9fa48("44") ? h.type !== 'MF' : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), h.type === (stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), 'MF')))) stryMutAct_9fa48("46") ? entry.mfVal -= indirectVal : (stryCov_9fa48("46"), entry.mfVal += indirectVal);
                    if (stryMutAct_9fa48("49") ? h.type !== 'ETF' : stryMutAct_9fa48("48") ? false : stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47", "48", "49"), h.type === (stryMutAct_9fa48("50") ? "" : (stryCov_9fa48("50"), 'ETF')))) stryMutAct_9fa48("51") ? entry.etfVal -= indirectVal : (stryCov_9fa48("51"), entry.etfVal += indirectVal);
                    stryMutAct_9fa48("52") ? entry.totalVal -= indirectVal : (stryCov_9fa48("52"), entry.totalVal += indirectVal);
                  }
                });
              }
            }
          }
        }
      }
    });

    // Finalize results
    const stockExposure = stryMutAct_9fa48("54") ? Array.from(exposureMap.values()).map(s => ({
      ...s,
      exposurePct: totalValue > 0 ? s.totalVal / totalValue * 100 : 0
    })).sort((a, b) => b.totalVal - a.totalVal) : stryMutAct_9fa48("53") ? Array.from(exposureMap.values()).map(s => ({
      ...s,
      exposurePct: totalValue > 0 ? s.totalVal / totalValue * 100 : 0
    })).filter(s => s.totalVal > 0) : (stryCov_9fa48("53", "54"), Array.from(exposureMap.values()).map(stryMutAct_9fa48("55") ? () => undefined : (stryCov_9fa48("55"), s => stryMutAct_9fa48("56") ? {} : (stryCov_9fa48("56"), {
      ...s,
      exposurePct: (stryMutAct_9fa48("60") ? totalValue <= 0 : stryMutAct_9fa48("59") ? totalValue >= 0 : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59", "60"), totalValue > 0)) ? stryMutAct_9fa48("61") ? s.totalVal / totalValue / 100 : (stryCov_9fa48("61"), (stryMutAct_9fa48("62") ? s.totalVal * totalValue : (stryCov_9fa48("62"), s.totalVal / totalValue)) * 100) : 0
    }))).filter(stryMutAct_9fa48("63") ? () => undefined : (stryCov_9fa48("63"), s => stryMutAct_9fa48("67") ? s.totalVal <= 0 : stryMutAct_9fa48("66") ? s.totalVal >= 0 : stryMutAct_9fa48("65") ? false : stryMutAct_9fa48("64") ? true : (stryCov_9fa48("64", "65", "66", "67"), s.totalVal > 0))).sort(stryMutAct_9fa48("68") ? () => undefined : (stryCov_9fa48("68"), (a, b) => stryMutAct_9fa48("69") ? b.totalVal + a.totalVal : (stryCov_9fa48("69"), b.totalVal - a.totalVal))));
    return stryMutAct_9fa48("70") ? {} : (stryCov_9fa48("70"), {
      totalValue,
      stockExposure
    });
  }
}
module.exports = stryMutAct_9fa48("71") ? {} : (stryCov_9fa48("71"), {
  calculatePortfolioExposure
});