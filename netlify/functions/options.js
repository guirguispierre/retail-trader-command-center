const fs = require('fs');
const path = require('path');

// Utility: generate normally distributed random numbers using Box–Muller
function gaussianRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Monte Carlo simulation to compute probability of profit and payoff curves
function simulateCoveredCall(underlyingPrice, strike, premium, daysToExpiry = 30, volatility = 0.16, samples = 1000) {
  const T = daysToExpiry / 365;
  let profitable = 0;
  for (let i = 0; i < samples; i++) {
    const rand = gaussianRandom();
    const endPrice = underlyingPrice * Math.exp((-0.5 * volatility ** 2) * T + volatility * Math.sqrt(T) * rand);
    const payoff = premium + Math.min(endPrice, strike) - underlyingPrice;
    if (payoff >= 0) {
      profitable++;
    }
  }
  return profitable / samples;
}

// Generate payoff chart data
function buildPayoffCurve(underlyingPrice, strike, premium) {
  const prices = [];
  const coveredPayoff = [];
  const stockPayoff = [];
  const start = underlyingPrice * 0.8;
  const end = underlyingPrice * 1.2;
  const steps = 40;
  const step = (end - start) / steps;
  for (let i = 0; i <= steps; i++) {
    const price = start + step * i;
    prices.push(Number(price.toFixed(2)));
    const ccPayoff = premium + Math.min(price, strike) - underlyingPrice;
    coveredPayoff.push(Number(ccPayoff.toFixed(2)));
    stockPayoff.push(Number((price - underlyingPrice).toFixed(2)));
  }
  return { prices, coveredPayoff, stockPayoff };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const symbol = (params.symbol || 'SPY').toUpperCase();
    // Determine if an API key is present. In this simplified demo we never fetch live options data
    const hasKey = Boolean(process.env.POLYGON_API_KEY || process.env.ALPHAVANTAGE_API_KEY);
    let underlyingPrice;
    let optionsChain;
    let sampleData = false;

    if (!hasKey) {
      // Fall back to sample data
      sampleData = true;
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', `options_${symbol}.json`);
      if (!fs.existsSync(filePath)) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No sample data for ${symbol}` }),
        };
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      underlyingPrice = data.underlyingPrice;
      optionsChain = data.options;
    } else {
      // TODO: fetch live options chain using your favourite API provider
      // For now return sample data even if an API key is configured
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', `options_${symbol}.json`);
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      underlyingPrice = data.underlyingPrice;
      optionsChain = data.options;
      sampleData = true;
    }

    // Determine candidate strikes: ATM, +5%, +10%
    const atmStrike = optionsChain.reduce((prev, curr) => {
      return Math.abs(curr.strike - underlyingPrice) < Math.abs(prev.strike - underlyingPrice) ? curr : prev;
    });
    const strike5 = underlyingPrice * 1.05;
    const candidate5 = optionsChain.reduce((prev, curr) => {
      return Math.abs(curr.strike - strike5) < Math.abs(prev.strike - strike5) ? curr : prev;
    });
    const strike10 = underlyingPrice * 1.1;
    const candidate10 = optionsChain.reduce((prev, curr) => {
      return Math.abs(curr.strike - strike10) < Math.abs(prev.strike - strike10) ? curr : prev;
    });

    const candidates = [atmStrike, candidate5, candidate10].map((opt) => {
      const probabilityOfProfit = simulateCoveredCall(underlyingPrice, opt.strike, opt.price);
      const curve = buildPayoffCurve(underlyingPrice, opt.strike, opt.price);
      return {
        strike: opt.strike,
        premium: opt.price,
        probabilityOfProfit: Number((probabilityOfProfit * 100).toFixed(2)),
        priceRange: curve.prices,
        coveredCallPayoff: curve.coveredPayoff,
        stockPayoff: curve.stockPayoff,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, underlyingPrice, sampleData, candidates }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
