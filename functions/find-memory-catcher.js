/**
 * find-memory-catcher.js
 *
 * Public read of active franchisees for the /find-a-memory-catcher listing.
 * Uses the anon key + RLS.
 *
 * GET /.netlify/functions/find-memory-catcher
 *   -> { rows: [...] } card-shaped for find-a-memory-catcher.html
 *
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SELECT =
  'slug,full_name,full_address,covering,sort_description,photo,founder';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/* covering may be text[], text, or null - always return a string[] for the UI. */
function asCoverage(v) {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (v == null || v === '') return [];
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapRow(r) {
  return {
    slug: r.slug || '',
    full_name: r.full_name || r.name || '',
    full_address: r.full_address || '',
    covering: asCoverage(r.covering),
    sort_description: r.sort_description || '',
    photo: r.photo || '/assets/mc-who-1100.webp',
    founder: r.founder === true,
  };
}

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
      `/rest/v1/franchisees?active=eq.true&select=${SELECT}&order=full_name.asc`
    );
    return {
      statusCode: 200,
      headers: { ...cors, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ rows: (Array.isArray(rows) ? rows : []).map(mapRow) }),
    };
  } catch (e) {
    console.log('[find-memory-catcher]', e.message);
    /* Fallback without founder if that column is missing. */
    if (String(e.message).includes('founder') || String(e.message).includes('42703')) {
      try {
        const rows = await sb(
          `/rest/v1/franchisees?active=eq.true&select=slug,full_name,full_address,covering,sort_description,photo&order=full_name.asc`
        );
        return {
          statusCode: 200,
          headers: { ...cors, 'Cache-Control': 'public, max-age=60' },
          body: JSON.stringify({ rows: (Array.isArray(rows) ? rows : []).map(mapRow) }),
        };
      } catch (e2) {
        console.log('[find-memory-catcher] fallback', e2.message);
      }
    }
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Failed to load memory catchers' }),
    };
  }
};
