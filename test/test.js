const assert = require('assert');
const { test } = require('node:test');

// Import computePositions from compiled client code. Since app.js is written in JSX and run in browser,
// we duplicate a simple version of computePositions here for testing.
function computePositions(transactions, priceMap, costMethod) {
  const positions = {};
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const txn of sorted) {
    const { symbol, type, quantity, price } = txn;
    const sym = symbol.toUpperCase();
    if (!positions[sym]) {
      positions[sym] = { lots: [], premiums: 0, realised: 0 };
    }
    const pos = positions[sym];
    if (type === 'premium') {
      pos.premiums += price;
    } else if (type === 'buy') {
      pos.lots.push({ qty: quantity, price });
    } else if (type === 'sell') {
      let qtyToSell = quantity;
      const getLotIndex = () => {
        if (costMethod === 'LIFO') return pos.lots.length - 1;
        return 0;
      };
      while (qtyToSell > 0 && pos.lots.length > 0) {
        const idx = getLotIndex();
        const lot = pos.lots[idx];
        const sold = Math.min(qtyToSell, lot.qty);
        const cost = lot.price * sold;
        const proceeds = price * sold;
        pos.realised += proceeds - cost;
        lot.qty -= sold;
        qtyToSell -= sold;
        if (lot.qty === 0) pos.lots.splice(idx, 1);
      }
    }
  }
  const summary = {};
  for (const sym in positions) {
    const pos = positions[sym];
    const qty = pos.lots.reduce((sum, l) => sum + l.qty, 0);
    const totalCost = pos.lots.reduce((sum, l) => sum + l.qty * l.price, 0);
    const costBasis = qty > 0 ? totalCost / qty : 0;
    const lastPrice = priceMap[sym] || 0;
    const marketValue = qty * lastPrice;
    const realisedPL = pos.realised + pos.premiums;
    const unrealisedPL = qty * (lastPrice - costBasis);
    summary[sym] = {
      quantity: qty,
      costBasis,
      lastPrice,
      marketValue,
      realisedPL,
      unrealisedPL,
      totalPL: realisedPL + unrealisedPL,
    };
  }
  return summary;
}

test('computePositions correctly calculates FIFO', () => {
  const txns = [
    { type: 'buy', symbol: 'AAPL', quantity: 10, price: 100, date: '2025-01-01' },
    { type: 'buy', symbol: 'AAPL', quantity: 5, price: 120, date: '2025-01-05' },
    { type: 'sell', symbol: 'AAPL', quantity: 8, price: 130, date: '2025-01-10' },
  ];
  const prices = { AAPL: 140 };
  const pos = computePositions(txns, prices, 'FIFO').AAPL;
  assert.strictEqual(pos.quantity, 7);
  // Remaining lots: 2 from first lot (100), 5 from second lot (120)
  // cost basis = (2*100 + 5*120)/7 = 114.29...
  assert.ok(Math.abs(pos.costBasis - 114.29) < 0.1);
  // realised P/L: sold 8 shares: cost = (8*100) FIFO -> 8*100 = 800; proceeds=8*130=1040; profit=240
  assert.strictEqual(Math.round(pos.realisedPL), 240);
});
