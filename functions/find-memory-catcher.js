/**
 * blog-posts.js
 *
 * Public read of published blog_posts for the /blog listing page.
 * Uses the anon key + RLS (only published rows are readable).
 *
 * GET /.netlify/functions/blog-posts
 *   -> all published posts, card-shaped for blog.html
 *
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SELECT =
  'full_name,full_address,covering,sort_description,photo';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!SUPABASE_URL || !ANON_KEY) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_ANON_KEY missing' }),
    };
  }

  try {
    const rows = await sb(
      `/rest/v1/franchisees?active=eq.true&select=${SELECT}`
    );
    return {
      statusCode: 200,
      headers: { ...cors, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ rows }),
    };
  } catch (e) {
    console.log('[find-memory-catcher]', e.message);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Failed to load memory catchers' }),
    };
  }
};
