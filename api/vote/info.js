import { checkReferer, getVote, headers } from '../_utils.js';

export default async function handler(req, res) {
  try {
    checkReferer(req);
  } catch (e) {
    console.error('[vote/info] Forbidden referer:', e.message);
    return res.status(403).json({ error: 'Forbidden Referer' });
  }
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    const votes = await getVote(id);
    res.json({ votes });
  } catch (e) {
    console.error('[vote/info] ERROR:', e.response?.data || e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
