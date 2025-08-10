# User Guide

This guide walks you through using each part of the **Retail Trader’s Command Center**. The application is a single page app – use the navigation bar to switch between the Options Strategy Helper, Earnings Dashboard and Portfolio Tracker.

## General Layout

At the top of the screen you’ll find a navigation bar with three links: **Options**, **Earnings**, and **Portfolio**. To the right of the title there is a badge indicating whether the app is running on live data or sample data. If no API keys are configured in your Netlify site settings the badge will read “Sample Data”; otherwise it will show “Live Data”.

Below the navigation bar is the content area. Depending on the selected module this area will display different components and controls.

## Options Strategy Helper

1. **Select Symbol** – By default the helper loads data for `SPY`. You can type another symbol into the input box (e.g. `AAPL`) and click **Load** to fetch live or sample data.
2. **Candidate Strikes** – The helper calculates three candidate call strikes for a covered‑call strategy: at‑the‑money (ATM), 5% out‑of‑the‑money (OTM) and 10% OTM. Each row lists the strike price, call premium and a Monte Carlo probability of profit (POP).
3. **Payoff Chart** – Clicking on any candidate row displays a chart of the payoff at expiration versus underlying price. The blue line shows the payoff of the covered‑call while the red dashed line shows the payoff of holding the stock alone. Hover over the chart to see exact values.
4. **Monte Carlo POP** – Below the table you’ll find the POP calculation for the selected candidate. This is computed by simulating 1,000 random price paths based on historical volatility and counting the fraction of outcomes where the covered call is profitable.
5. **Export PDF** – Use the **Export to PDF** button to save the current analysis as a PDF. A preview of the selected chart is embedded in the PDF.

## Earnings Dashboard

1. **Upcoming Earnings** – The left column lists all companies with scheduled earnings releases in the next seven days. Each entry shows the symbol, company name, scheduled date and the analyst EPS estimate.
2. **Ticker Drawer** – Click on any entry to open the drawer on the right. The drawer displays the last eight quarters of actual EPS vs. analyst estimates using a bar chart, the implied volatility (IV) crush percentage, and the expected move based on options pricing. If live API keys are configured this data comes from the FMP API; otherwise the sample file `earnings.json` is used.
3. **Refresh Data** – If you’ve entered an `FMP_API_KEY` in your Netlify settings, the scheduled function `refreshEarnings` will refresh the earnings cache once per day. You can also force a refresh by invoking the `/refreshEarnings` function from the Functions tab in the Netlify dashboard.

## Portfolio Tracker

1. **Transactions** – Use the **Add Transaction** form at the top of the page to record buys, sells or covered‑call premiums. Enter the symbol, quantity (+ for buys, − for sells), price and date, then click **Add**. Transactions are stored in the browser’s localStorage so they persist across sessions.
2. **Positions Table** – Below the form you’ll see a table summarising your positions. Columns include quantity, average cost basis, market value, realised P/L and unrealised P/L. The default cost method is FIFO.
3. **Cost Method Toggle** – Use the dropdown above the table to switch between FIFO, LIFO and Average cost accounting. The positions table recalculates cost basis and realised P/L accordingly.
4. **Export PDF** – Click the **Export Portfolio PDF** button to generate a PDF report of your current portfolio, including the transactions and summary table.

## Troubleshooting

* **Sample Data Badge** – If the badge reads “Sample Data” but you expected live data, check that your API keys are correctly set in the Netlify site’s environment variables. Remember to redeploy the site after updating environment variables.
* **Functions Not Working** – If the Netlify functions return 500 errors, view the function logs in the Netlify dashboard. Missing or incorrect API keys are the most common cause.
* **Local Changes Not Appearing** – After editing files locally you need to commit and push those changes to GitHub. Netlify will automatically rebuild and redeploy the site when it detects new commits on the main branch.

## Feedback & Contributions

Bug reports and feature requests are welcome. Feel free to open an issue or submit a pull request on GitHub to contribute improvements.
