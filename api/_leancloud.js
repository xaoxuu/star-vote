import axios from 'axios';

function apiHeaders() {
  return {
    'X-LC-Id': process.env.LEANCLOUD_APP_ID,
    'X-LC-Key': process.env.LEANCLOUD_APP_KEY,
    'User-Agent': 'Mozilla/5.0 (Feedback-App)',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

function serverUrl() {
  if (!process.env.LEANCLOUD_SERVER_URL) {
    throw new Error('Missing LEANCLOUD_SERVER_URL');
  }
  return process.env.LEANCLOUD_SERVER_URL;
}

async function findOne(className, id) {
  const query = encodeURIComponent(JSON.stringify({ id }));
  const url = `${serverUrl()}/1.1/classes/${className}?where=${query}`;
  const response = await axios.get(url, { headers: apiHeaders() });
  return response.data.results[0];
}

export async function getRating(id) {
  return (await findOne('Rating', id)) || {};
}

export async function updateRating(id, score) {
  const url = `${serverUrl()}/1.1/classes/Rating`;
  const obj = await findOne('Rating', id);
  const field = score.toString();
  if (obj) {
    // 原子自增（Parse 兼容的 __op: Increment），避免并发丢计数
    await axios.put(`${url}/${obj.objectId}`, {
      [field]: { __op: 'Increment', amount: 1 }
    }, { headers: apiHeaders() });
  } else {
    await axios.post(url, { id, [field]: 1 }, { headers: apiHeaders() });
  }
}

export async function getVote(id) {
  return (await findOne('Vote', id)) || {};
}

export async function updateVote(id, type) {
  const url = `${serverUrl()}/1.1/classes/Vote`;
  const obj = await findOne('Vote', id);
  if (obj) {
    await axios.put(`${url}/${obj.objectId}`, {
      [type]: { __op: 'Increment', amount: 1 }
    }, { headers: apiHeaders() });
  } else {
    await axios.post(url, { id, [type]: 1 }, { headers: apiHeaders() });
  }
}
