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
  'slug,title,excerpt,hero_image_path,author,author_avatar,published_at,read_time,featured';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function readMinutes(row) {
  return row.read_time || 5;
}

function mapRow(r, index) {
  const image = r.hero_image_path || '';
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt || '',
    image,
    author: r.author || 'Ashley Eccleston',
    avatar: r.author_avatar || '/assets/ff-ashley-700.webp',
    date: fmtDate(r.published_at),
    read: readMinutes(r),
    featured: index === 0,
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
      `/rest/v1/blog_posts?published=eq.true&select=${SELECT}&order=published_at.desc`
    );
    const posts = (Array.isArray(rows) ? rows : []).map(mapRow);
    return {
      statusCode: 200,
      headers: { ...cors, 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ posts }),
    };
  } catch (e) {
    console.log('[blog-posts]', e.message);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'Failed to load posts' }),
    };
  }
};
