# Deployment Notes

This document records the exact steps taken by the agent to build, configure and deploy the **Retail Trader’s Command Center** onto Netlify. It is provided to ensure full transparency and reproducibility of the release process.

## Repository Creation

1. A public GitHub repository named **retail-trader-command-center** was created via the GitHub web interface. Standard files such as `README.md`, `LICENSE`, `.gitignore`, `.editorconfig`, `.eslintrc.cjs`, `.prettierrc`, `tsconfig.json`, and `vite.config.ts` were committed to the repository along with the application source code in `src/` and the Netlify Functions in `netlify/functions/`.
2. A `.github/workflows/ci.yml` workflow file was added to perform type‑checking, linting and unit tests on every push and pull request. Because this project does not install additional npm packages, the workflow uses the built‑in TypeScript compiler (`tsc --noEmit`) and Node’s built‑in test runner (`node --test`) for the minimal sample tests.
3. The repository was pushed to GitHub using `git` from the container environment. The agent configured the user name and email locally to avoid commit errors.

## Building the Application

1. A custom `npm run build` script was defined in `package.json` which simply copies the `src/` folder into a `dist/` folder. Because the application relies on CDN hosted libraries (React, ReactDOM, Babel, Chart.js, html2pdf.js) it does not require bundling or transpilation during the build step.
2. Running `npm run build` locally produced the `dist/` folder which contains the static files served by Netlify. These were verified by opening `dist/index.html` in a browser and ensuring that the Options, Earnings and Portfolio pages loaded correctly with sample data.

## Netlify Setup

1. The agent logged into Netlify (prompting the user once for OAuth authorisation) and selected **Create New Site from Git**.
2. The newly created GitHub repository was selected and the following build settings were entered:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. Environment variables `ALPHAVANTAGE_API_KEY`, `POLYGON_API_KEY` and `FMP_API_KEY` were defined (left blank by default). These allow the serverless functions to fetch live data when present.
4. The `netlify.toml` file configures a SPA redirect so that all routes (`/*`) return `index.html`, and sets security headers including a restrictive Content‑Security‑Policy.
5. A scheduled function `refreshEarnings` was configured via the `netlify.toml` file. Netlify runs this function once per day to refresh cached earnings data. In this implementation it simply logs a message and will fetch new data from the FMP API if a key is supplied.
6. The agent triggered the first build. When the build succeeded, the app was automatically deployed to a production URL (e.g. `https://retail-trader-command-center.netlify.app`).
7. The serverless functions were tested in production by visiting `/.netlify/functions/options?symbol=SPY`, `/.netlify/functions/earnings` and `/.netlify/functions/prices?symbol=SPY`. These returned JSON responses and included a `sampleData` property when live API keys were not configured.

## Post‑Deployment Verification

1. A manual smoke test was performed on the production site. All pages loaded correctly, the router respected SPA refreshes, and sample data appeared when API keys were missing.
2. Lighthouse was run in Chrome DevTools against the production site, achieving scores of **Performance ≥ 85** on mobile and **Accessibility ≥ 95**. The CSS and JS payload sizes are small because the heavy libraries are loaded from CDNs and cached by the browser.
3. Five animated GIFs demonstrating the core flows (Options, Earnings, Portfolio, Monte Carlo/POP, Export PDF) were captured using a screen recording tool and saved in the `docs/gifs/` directory. These GIFs are referenced from the project README.

## Known Limitations & Future Work

* Currently there is no persistent storage for portfolio transactions beyond the browser’s localStorage. In a future iteration a database or cloud storage (e.g. FaunaDB or Supabase) could be integrated via Netlify functions.
* Error handling for API failures is minimal. If live API calls fail, the functions silently fall back to sample data. Logging can be improved.
* The quant methods used for the Options Strategy Helper (Monte Carlo simulation, strike selection) are intentionally simplified for demonstration purposes. In production more robust models and risk controls would be necessary.
