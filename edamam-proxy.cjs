const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.get('/api/edamam', async (req, res) => {
  const { q } = req.query;
  const url = `https://api.edamam.com/search?q=${encodeURIComponent(q)}&app_id=${process.env.VITE_EDAMAM_APP_ID}&app_key=${process.env.VITE_EDAMAM_APP_KEY}&health=alcohol-free`;
  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Edamam proxy running on http://localhost:${PORT}`)); 