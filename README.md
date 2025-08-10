# Retail Trader's Command Center

Welcome to the Retail Trader's Command Center. This project is an end‑to‑end implementation of a mini dashboard for retail investors. It consists of three primary modules:

* **Options Strategy Helper** – Explore covered‑call candidates for a given ticker (e.g. SPY) with payoff curves, candidate strikes and a simple Monte Carlo probability of profit (POP) simulation.
* **Earnings Dashboard** – View upcoming earnings over the next seven days and drill into any ticker to see the last eight quarters of EPS vs. estimates, implied volatility (IV) crush and expected price move.
* **Portfolio Tracker** – Add buy/sell transactions, track covered‑call premiums, compute cost basis, realised/unrealised P/L and toggle between FIFO/LIFO/Average cost accounting.

The application is built using **React** (via CDN) and **TypeScript** (compiled via Babel at runtime) and is deployed as a Single Page Application on Netlify. All sensitive API calls are proxied through Netlify Functions to avoid leaking API keys to the client. When no API keys are present the application transparently falls back to sample data stored under `src/data/` and displays a “Sample Data” badge in the header.

## Project Structure

```
retail-trader-command-center/
├── README.md              # project overview and usage
├── DEPLOY.md              # steps followed to deploy this project
├── USER_GUIDE.md          # how to use each feature of the dashboard
├── LICENSE                # MIT licence
├── package.json           # project metadata and scripts
├── .gitignore             # files and folders to ignore in git
├── .editorconfig          # consistent editor settings
├── .eslintrc.cjs          # linting rules (informational only)
├── .prettierrc            # formatting rules (informational only)
├── tsconfig.json          # TypeScript compiler configuration
├── vite.config.ts         # placeholder Vite config (not actively used)
├── netlify.toml           # Netlify build and redirect settings
├── netlify/
│   └── functions/         # serverless functions
│       ├── earnings.js     # proxy for earnings data
│       ├── options.js      # proxy for options calculations
│       ├── prices.js       # proxy for price series
│       └── refreshEarnings.js # scheduled function to refresh earnings cache
├── src/
│   ├── index.html         # entry HTML file loading React and our script
│   ├── app.js             # React code (written in JSX, compiled by Babel in the browser)
│   ├── styles/
│   │   └── main.css        # basic styling
│   └── data/
│       ├── earnings.json   # sample earnings data
│       ├── options_SPY.json# sample options chain for SPY
│       ├── prices_SPY.json # sample price series for SPY
│       └── portfolio.json  # sample portfolio transactions
├── docs/
│   ├── gifs/              # animated GIFs demonstrating core flows
│   └── screenshots/        # static screenshots for documentation
└── .github/
    └── workflows/
        └── ci.yml         # GitHub Actions CI configuration
```

## Running Locally

Running this project locally does not require a Node package manager or any special tooling. Simply open `src/index.html` in a modern browser and the app will load. During development you may run a simple HTTP server (e.g. Python’s `http.server`) to avoid CORS issues when fetching Netlify functions. If you do supply API keys in your Netlify site settings (`ALPHAVANTAGE_API_KEY`, `POLYGON_API_KEY`, `FMP_API_KEY`) the serverless functions will fetch live data; otherwise the sample data in `src/data/` will be used.

## Deployment

Deployment to Netlify is fully automated via the `netlify.toml` configuration and GitHub Actions. See **DEPLOY.md** for a detailed description of the steps taken to deploy this project, set up environment variables, and configure the scheduled function. The application is built via the `npm run build` script which copies the `src/` folder into a production‑ready `dist/` folder.

## Licence

This project is licensed under the MIT License – see the **LICENSE** file for details.
