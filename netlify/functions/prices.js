const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const symbol = (params.symbol || 'SPY').toUpperCase();
    const hasKey = Boolean(process.env.POLYGON_API_KEY || process.env.ALPHAVANTAGE_API_KEY);
    let sampleData = false;
    let series;

    if (!hasKey) {
      sampleData = true;
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', `prices_${symbol}.json`);
      if (!fs.existsSync(filePath)) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No price data for ${symbol}` }),
        };
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      series = JSON.parse(raw);
    } else {
      // TODO: fetch live price data when API key is provided
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', `prices_${symbol}.json`);
      const raw = fs.readFileSync(filePath, 'utf8');
      series = JSON.parse(raw);
      sampleData = true;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleData, series }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
