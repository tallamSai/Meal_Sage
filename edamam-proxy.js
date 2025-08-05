console.log("Starting Edamam proxy...");

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
console.log('EDAMAM_APP_ID:', process.env.VITE_EDAMAM_APP_ID);
console.log('EDAMAM_APP_KEY:', process.env.VITE_EDAMAM_APP_KEY);
console.log('EDAMAM_ACCOUNT_USER:', process.env.EDAMAM_ACCOUNT_USER);

const app = express();
app.use(cors()); // Enable CORS for all origins
const PORT = 3001;

app.get('/api/edamam', async (req, res) => {
  const { q } = req.query;
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(q)}&app_id=${process.env.VITE_EDAMAM_APP_ID}&app_key=${process.env.VITE_EDAMAM_APP_KEY}&health=alcohol-free`;
  try {
    const apiRes = await fetch(url, {
      headers: {
        'Edamam-Account-User': process.env.EDAMAM_ACCOUNT_USER
      }
    });
    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error('Edamam API error:', data);
      return res.status(apiRes.status).json({ error: 'Edamam API error', details: data });
    }
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Edamam proxy running on http://localhost:${PORT}`)); 