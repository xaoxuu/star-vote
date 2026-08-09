import axios from 'axios';

function apiHeaders() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

function restUrl(table) {
  return `${process.env.SUPABASE_URL}/rest/v1/${table}`;
}

async function findOne(table, id) {
  const url = `${restUrl(table)}?select=*&id=eq.${encodeURIComponent(id)}`;
  const response = await axios.get(url, { headers: apiHeaders() });
  return response.data[0];
}

export async function getRating(id) {
  const row = await findOne('rating_counts', id);
  if (!row) return {};
  return {
    id: row.id,
    '1': row.s1,
    '2': row.s2,
    '3': row.s3,
    '4': row.s4,
    '5': row.s5
  };
}

export async function updateRating(id, score) {
  // RPC 内部使用 INSERT ... ON CONFLICT 原子自增
  await axios.post(`${restUrl('rpc/increment_rating')}`, { p_id: id, p_score: score }, { headers: apiHeaders() });
}

export async function getVote(id) {
  const row = await findOne('vote_counts', id);
  if (!row) return {};
  return { id: row.id, up: row.up, down: row.down };
}

export async function updateVote(id, type) {
  await axios.post(`${restUrl('rpc/increment_vote')}`, { p_id: id, p_vote: type }, { headers: apiHeaders() });
}
