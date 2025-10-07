'use strict';

// replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key
const url = 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=KZLKH420TRGXBLPH';

fetch(url, {
    headers: {'User-Agent': 'node-fetch'}
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log('Error:', err);
  });
