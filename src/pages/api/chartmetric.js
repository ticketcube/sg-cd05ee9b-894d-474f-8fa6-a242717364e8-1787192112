// pages/api/chartmetric.js
import 'dotenv/config';

export default async function handler(req, res) {
  const { artist } = req.query;
  if (!artist) return res.status(400).json({ error: 'Missing artist query' });

  // 1. Get access token
  const tokenRes = await fetch('https://api.chartmetric.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshtoken: process.env.CHARTMETRIC_REFRESH_TOKEN }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.token) {
    return res.status(500).json({ error: 'Chartmetric token error', details: tokenJson });
  }

  // 2. Search artist
  const searchUrl = new URL('https://api.chartmetric.com/api/search');
  searchUrl.searchParams.set('q', artist);
  searchUrl.searchParams.set('type', 'artist');
  searchUrl.searchParams.set('limit', '1');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${tokenJson.token}` },
  });
  const data = await searchRes.json();
  const artistObj = data.obj?.artists?.[0] || null;

  res.status(200).json({ artist: artistObj });
}
