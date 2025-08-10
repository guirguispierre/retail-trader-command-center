// Scheduled function to refresh cached earnings data.
// Netlify will run this function once per day as specified in netlify.toml.
const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    if (process.env.FMP_API_KEY) {
      // TODO: Fetch fresh earnings data from the FMP API and update the cache.
      // Because this repository is read‑only at runtime on Netlify, the fetched
      // data could be stored in a persistent storage (e.g. FaunaDB or Netlify
      // KV). For demonstration purposes we simply log that the refresh ran.
      console.log('refreshEarnings: would fetch live earnings data using FMP_API_KEY');
    } else {
      console.log('refreshEarnings: no FMP_API_KEY set – using sample data');
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'refreshEarnings executed' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
