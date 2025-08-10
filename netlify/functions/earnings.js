const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const symbolParam = params.symbol ? params.symbol.toUpperCase() : null;
    const hasKey = Boolean(process.env.FMP_API_KEY);
    let sampleData = false;
    let data;
    if (!hasKey) {
      // Read sample earnings data
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'earnings.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
      sampleData = true;
    } else {
      // TODO: fetch live earnings data using the FMP API when a key is provided
      const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'earnings.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
      sampleData = true;
    }

    if (symbolParam) {
      // Return details for a single symbol
      const record = data.find((d) => d.symbol === symbolParam);
      if (!record) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `No earnings data for ${symbolParam}` }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData, details: record }),
      };
    }

    // Otherwise return next 7 days of earnings
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = data.filter((d) => {
      const date = new Date(d.date);
      return date >= now && date <= sevenDays;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleData, upcoming }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
