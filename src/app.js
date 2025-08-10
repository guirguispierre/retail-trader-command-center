const { useState, useEffect, useRef } = React;

function App() {
  const [page, setPage] = useState('options');
  const [dataBadge, setDataBadge] = useState('Sample Data');

  // Check whether we are using sample data by calling the options function
  useEffect(() => {
    fetch('/.netlify/functions/options?symbol=SPY')
      .then((res) => res.json())
      .then((data) => {
        setDataBadge(data.sampleData ? 'Sample Data' : 'Live Data');
      })
      .catch(() => setDataBadge('Sample Data'));
  }, []);

  return (
    <div>
      <header>
        <h1>Retail Trader's Command Center</h1>
        <nav>
          <a
            href="#options"
            className={page === 'options' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('options');
            }}
          >
            Options
          </a>
          <a
            href="#earnings"
            className={page === 'earnings' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('earnings');
            }}
          >
            Earnings
          </a>
          <a
            href="#portfolio"
            className={page === 'portfolio' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setPage('portfolio');
            }}
          >
            Portfolio
          </a>
        </nav>
        <span className="badge">{dataBadge}</span>
      </header>
      <main>
        {page === 'options' && <Options />}
        {page === 'earnings' && <Earnings />}
        {page === 'portfolio' && <Portfolio />}
      </main>
    </div>
  );
}

/* Options Strategy Helper Component */
function Options() {
  const [symbol, setSymbol] = useState('SPY');
  const [data, setData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const loadData = (sym) => {
    fetch(`/.netlify/functions/options?symbol=${sym}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setSelectedIdx(0);
      })
      .catch((err) => {
        console.error(err);
        setData(null);
      });
  };

  useEffect(() => {
    loadData(symbol);
  }, []);

  useEffect(() => {
    if (!data || !data.candidates || !data.candidates.length) return;
    const candidate = data.candidates[selectedIdx];
    // Build chart
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: candidate.priceRange,
        datasets: [
          {
            label: 'Covered Call Payoff',
            data: candidate.coveredCallPayoff,
            borderColor: '#457b9d',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Stock Only Payoff',
            data: candidate.stockPayoff,
            borderColor: '#e63946',
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: 'Underlying Price' },
          },
          y: {
            title: { display: true, text: 'Profit/Loss' },
          },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    });
  }, [data, selectedIdx]);

  const exportPdf = () => {
    const element = document.getElementById('options-section');
    const opt = {
      margin: 0.5,
      filename: `${symbol}_covered_call_analysis.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <section id="options-section" className="active">
      <h2>Options Strategy Helper</h2>
      <div>
        <label>
          Symbol:
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </label>
        <button onClick={() => loadData(symbol)}>Load</button>
      </div>
      {data ? (
        <div>
          <p>
            Underlying Price: <strong>${data.underlyingPrice.toFixed(2)}</strong>
          </p>
          <table>
            <thead>
              <tr>
                <th>Strike</th>
                <th>Premium</th>
                <th>POP (%)</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.map((c, idx) => (
                <tr
                  key={idx}
                  style={{ cursor: 'pointer', backgroundColor: idx === selectedIdx ? '#f1faee' : 'transparent' }}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <td>{c.strike.toFixed(2)}</td>
                  <td>{c.premium.toFixed(2)}</td>
                  <td>{c.probabilityOfProfit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="chart-container">
            <canvas ref={chartRef}></canvas>
          </div>
          {data.candidates[selectedIdx] && (
            <div>
              <p>
                Monte Carlo Probability of Profit (POP):{' '}
                <strong>{data.candidates[selectedIdx].probabilityOfProfit.toFixed(2)}%</strong>
              </p>
            </div>
          )}
          <button onClick={exportPdf}>Export to PDF</button>
        </div>
      ) : (
        <p>Loading…</p>
      )}
    </section>
  );
}

/* Earnings Dashboard Component */
function Earnings() {
  const [upcoming, setUpcoming] = useState([]);
  const [details, setDetails] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    fetch('/.netlify/functions/earnings')
      .then((res) => res.json())
      .then((data) => {
        setUpcoming(data.upcoming || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const openDetails = (symbol) => {
    fetch(`/.netlify/functions/earnings?symbol=${symbol}`)
      .then((res) => res.json())
      .then((data) => {
        setDetails(data.details);
        setDrawerOpen(true);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    // Render EPS vs estimate chart when details change
    if (!details) return;
    const ctx = chartRef.current.getContext('2d');
    if (chartInstance.current) chartInstance.current.destroy();
    const labels = details.history.map((h) => h.quarter);
    const epsData = details.history.map((h) => h.eps);
    const estData = details.history.map((h) => h.estimate);
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'EPS',
            data: epsData,
            backgroundColor: '#457b9d',
          },
          {
            label: 'Estimate',
            data: estData,
            backgroundColor: '#a8dadc',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: false },
          y: { beginAtZero: true },
        },
      },
    });
  }, [details]);

  return (
    <section id="earnings-section" className="active">
      <h2>Earnings Dashboard</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Date</th>
                <th>EPS Est.</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr
                  key={e.symbol}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDetails(e.symbol)}
                >
                  <td>{e.symbol}</td>
                  <td>{e.company}</td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.epsEstimate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Drawer for details */}
        <div
          className={`drawer ${drawerOpen ? 'open' : ''}`}
          ref={drawerRef}
        >
          {details && (
            <div>
              <span
                className="close"
                onClick={() => setDrawerOpen(false)}
              >
                &times;
              </span>
              <h2>
                {details.company} ({details.symbol})
              </h2>
              <p>
                Next earnings date: {new Date(details.date).toLocaleDateString()}
              </p>
              <p>
                Expected move: <strong>{details.expectedMove.toFixed(2)}%</strong>
              </p>
              <p>
                IV crush: <strong>{(details.iv * 100).toFixed(1)}%</strong>
              </p>
              <div className="chart-container">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* Portfolio Tracker Component */
function Portfolio() {
  const [transactions, setTransactions] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [costMethod, setCostMethod] = useState('FIFO');
  const [positions, setPositions] = useState({});
  const [prices, setPrices] = useState({});

  // Load transactions from localStorage or sample data
  useEffect(() => {
    const stored = localStorage.getItem('rtc_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    } else {
      // Load sample from JSON file
      fetch('./data/portfolio.json')
        .then((res) => res.json())
        .then((data) => {
          setTransactions(data);
          localStorage.setItem('rtc_transactions', JSON.stringify(data));
        });
    }
  }, []);

  // Fetch latest prices for each symbol in transactions
  useEffect(() => {
    const symbols = Array.from(new Set(transactions.map((t) => t.symbol)));
    const priceMap = {};
    Promise.all(
      symbols.map((s) =>
        fetch(`/.netlify/functions/prices?symbol=${s}`)
          .then((res) => res.json())
          .then((data) => {
            const series = data.series || [];
            const lastClose = series.length
              ? series[series.length - 1].close
              : 0;
            priceMap[s] = lastClose;
          })
          .catch(() => {
            priceMap[s] = 0;
          }),
      ),
    ).then(() => {
      setPrices(priceMap);
    });
  }, [transactions]);

  // Compute positions whenever transactions, prices or costMethod changes
  useEffect(() => {
    const pos = computePositions(transactions, prices, costMethod);
    setPositions(pos);
  }, [transactions, prices, costMethod]);

  const addTransaction = () => {
    if (!symbol || !quantity || !price || !date) return;
    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    const newTxn = { type, symbol: symbol.toUpperCase(), quantity: qtyNum, price: priceNum, date };
    const updated = [...transactions, newTxn];
    setTransactions(updated);
    localStorage.setItem('rtc_transactions', JSON.stringify(updated));
    // Reset form
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate('');
  };

  const exportPortfolioPdf = () => {
    const element = document.getElementById('portfolio-section');
    const opt = {
      margin: 0.5,
      filename: `portfolio_report.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <section id="portfolio-section" className="active">
      <h2>Portfolio Tracker</h2>
      <div>
        <label>
          Type:
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        <label>
          Symbol:
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </label>
        <label>
          Quantity:
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label>
          Price:
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button onClick={addTransaction}>Add</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <label>
          Cost Method:
          <select value={costMethod} onChange={(e) => setCostMethod(e.target.value)}>
            <option value="FIFO">FIFO</option>
            <option value="LIFO">LIFO</option>
            <option value="Average">Average</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Cost Basis</th>
            <th>Last Price</th>
            <th>Market Value</th>
            <th>Realised P/L</th>
            <th>Unrealised P/L</th>
            <th>Total P/L</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(positions).map((sym) => {
            const p = positions[sym];
            return (
              <tr key={sym}>
                <td>{sym}</td>
                <td>{p.quantity}</td>
                <td>{p.costBasis.toFixed(2)}</td>
                <td>{p.lastPrice.toFixed(2)}</td>
                <td>{p.marketValue.toFixed(2)}</td>
                <td>{p.realisedPL.toFixed(2)}</td>
                <td>{p.unrealisedPL.toFixed(2)}</td>
                <td>{p.totalPL.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button style={{ marginTop: '10px' }} onClick={exportPortfolioPdf}>
        Export Portfolio PDF
      </button>
    </section>
  );
}

// Compute positions from transactions and price map
function computePositions(transactions, priceMap, costMethod) {
  const positions = {};
  // Sort transactions by date ascending
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const txn of sorted) {
    const { symbol, type, quantity, price } = txn;
    const sym = symbol.toUpperCase();
    if (!positions[sym]) {
      positions[sym] = {
        lots: [],
        premiums: 0,
        realised: 0,
      };
    }
    const pos = positions[sym];
    if (type === 'premium') {
      pos.premiums += price;
    } else if (type === 'buy') {
      pos.lots.push({ qty: quantity, price });
    } else if (type === 'sell') {
      let qtyToSell = quantity;
      // Choose order of lots to remove based on costMethod
      const getLotIndex = () => {
        if (costMethod === 'LIFO') return pos.lots.length - 1;
        // Default FIFO
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
        if (lot.qty === 0) {
          pos.lots.splice(idx, 1);
        }
      }
    }
  }
  // Build final position summary
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

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
