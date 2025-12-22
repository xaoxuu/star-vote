import { checkReferer, updateVote, headers } from '../_utils.js';

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
  if (!id || !['up', 'down'].includes(value)) {
    return res.status(400).json({ error: 'Invalid vote parameters' });
  }

  try {
    await updateVote(id, value);
    res.json({ success: true });
  } catch (e) {
    console.error('[vote/update] ERROR:', e.response?.data || e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
