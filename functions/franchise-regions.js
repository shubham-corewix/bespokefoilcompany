/**
 * franchise-regions.js
 *
 * Public read of franchise_regions for the /franchise-region listing page.
 * Uses the anon key + RLS (regions are publicly readable).
 *
 * GET /.netlify/functions/franchise-regions
 *   -> all regions, card-shaped for franchise-region.html
 *
 * GET /.netlify/functions/franchise-regions?outcode=IP1
 *   -> regions claiming that outcode via regions_by_outcode()
 *
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SELECT =
  'slug,region,city_name,is_available,buy_in,franchise_potential,coverage_areas,card_profile_summary';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function mapRow(r) {
  const coverage = String(r.coverage_areas || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    name: r.region,
    slug: r.slug,
    status: r.is_available ? 'available' : 'unavailable',
    price: r.buy_in || '£3,445',
    potential: r.franchise_potential || 'Either',
    coverage,
    description: r.card_profile_summary || '',
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
    const outcode = (event.queryStringParameters?.outcode || '').trim().toUpperCase();
    let rows;

    if (outcode) {
      rows = await sb('/rest/v1/rpc/regions_by_outcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_outcode: outcode }),
      });
    } else {
      // Prefer header raises default 1000-row cap enough for ~112 regions.
      rows = await sb(
        `/rest/v1/franchise_regions?select=${SELECT}&order=region.asc`,
        { headers: { Prefer: 'count=exact' } }
      );
    }

    const regions = (Array.isArray(rows) ? rows : []).map(mapRow);
    return {
      statusCode: 200,
      headers: { ...cors, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ regions }),
    };
  } catch (e) {
    console.log('[franchise-regions]', e.message);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Failed to load regions' }),
    };
  }
};
