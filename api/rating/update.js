import { checkReferer, updateRating, headers } from '../_utils.js';

export default async function handler(req, res) {
  try {
    checkReferer(req);
  } catch (e) {
    console.error('[vote/info] Forbidden referer:', e.message);
    return res.status(403).json({ error: 'Forbidden Referer' });
  }
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, value } = req.query;
  const score = parseInt(value);
  if (!id || isNaN(score) || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Invalid rating parameters' });
  }

  try {
    await updateRating(id, score);
    res.json({ success: true });
  } catch (e) {
    console.error('[rating/update] ERROR:', e.response?.data || e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
