import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const appId = process.env.VITE_EDAMAM_APP_ID;
  const appKey = process.env.VITE_EDAMAM_APP_KEY;
  const accountUser = process.env.EDAMAM_ACCOUNT_USER;

  if (!appId || !appKey) {
    console.error('Missing Edamam credentials');
    return res.status(500).json({ error: 'Edamam API credentials not configured' });
  }

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(q)}&app_id=${appId}&app_key=${appKey}&health=alcohol-free`;

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accountUser) {
      headers['Edamam-Account-User'] = accountUser;
    }

    const apiRes = await fetch(url, { headers });
    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error('Edamam API error:', data);
      return res.status(apiRes.status).json({ 
        error: 'Edamam API error', 
        details: data 
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ 
      error: 'Proxy error', 
      details: err.message 
    });
  }
} 