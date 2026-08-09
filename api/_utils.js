const allowedHosts = (process.env.HOSTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function checkReferer(req) {
  const referer = req.headers.referer || '';
  if (!referer) throw new Error('Missing Referer');
  const refererHost = new URL(referer).hostname;
  if (!allowedHosts.includes(refererHost)) {
    throw new Error('Forbidden Referer');
  }
}

export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

import * as leancloud from './_leancloud.js';
import * as supabase from './_supabase.js';

const backends = { leancloud, supabase };

const backend = backends[process.env.DATA_BACKEND || 'leancloud'];
if (!backend) {
  throw new Error(`Unknown DATA_BACKEND: ${process.env.DATA_BACKEND} (expected "leancloud" or "supabase")`);
}

export const getRating = backend.getRating;
export const updateRating = backend.updateRating;
export const getVote = backend.getVote;
export const updateVote = backend.updateVote;
