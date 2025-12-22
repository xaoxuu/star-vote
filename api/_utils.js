const allowedHosts = JSON.parse(process.env.HOSTS || "[]");

export function checkReferer(req) {
  const referer = req.headers.referer || '';
  if (!referer) throw new Error('Missing Referer');
  const refererHost = new URL(referer).hostname;
  if (!allowedHosts.includes(refererHost)) {
    throw new Error('Forbidden Referer');
  }
}

import axios from 'axios';

const HEADERS = {
  'X-LC-Id': process.env.LEANCLOUD_APP_ID,
  'X-LC-Key': process.env.LEANCLOUD_APP_KEY,
  'User-Agent': 'Mozilla/5.0 (Feedback-App)',
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

const SERVER_URL = process.env.LEANCLOUD_SERVER_URL;

export async function updateRating(id, score) {
  const url = SERVER_URL + '/1.1/classes/Rating';
  const query = encodeURIComponent(JSON.stringify({ id }));
  const found = await axios.get(url + '?where=' + query, { headers: HEADERS });
  const obj = found.data.results[0];

  const field = score.toString();
  if (obj) {
    obj[field] = (obj[field] || 0) + 1;
    await axios.put(url + '/' + obj.objectId, { [field]: obj[field] }, { headers: HEADERS });
  } else {
    await axios.post(url, { id, [field]: 1 }, { headers: HEADERS });
  }
}

export async function updateVote(id, type) {
  const url = SERVER_URL + '/1.1/classes/Vote';
  const query = encodeURIComponent(JSON.stringify({ id }));
  const found = await axios.get(url + '?where=' + query, { headers: HEADERS });
  const obj = found.data.results[0];

  if (obj) {
    obj[type] = (obj[type] || 0) + 1;
    await axios.put(url + '/' + obj.objectId, { [type]: obj[type] }, { headers: HEADERS });
  } else {
    await axios.post(url, { id, [type]: 1 }, { headers: HEADERS });
  }
}

export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
