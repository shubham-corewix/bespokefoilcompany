// netlify/edge-functions/sitemap.js
//
// Serves /sitemap.xml at request time.
//
// WHY THIS IS AN EDGE FUNCTION AND NOT A BUILD ARTEFACT
// Franchise regions and blog posts are served dynamically from Supabase by their
// own edge functions, so they have no files on disk and no lines in _redirects.
// scripts/generate-sitemaps.js only knows about _redirects, so a build-time
// sitemap would list the ~39 static pages and none of the ~128 dynamic ones -
// live, crawlable, and invisible to search.
//
// This merges the two halves:
//   - static routes  <- sitemap-static.json, written by the build from _redirects
//   - dynamic routes <- Supabase, read fresh on request
//
// IMPORTANT: the build must NOT also write a static sitemap.xml. A real file on
// this path usually wins over the function, and the sitemap would quietly revert
// to the static half only. generate-sitemaps.js writes sitemap-static.json
// instead - if that ever changes back, this function stops being reachable.
//
// Env vars (already set for the other edge functions):
//   SUPABASE_URL, SUPABASE_ANON_KEY
//
// Wire-up in netlify.toml:
//   [[edge_functions]]
//     path = "/sitemap.xml"
//     function = "sitemap"

const SITE = 'https://www.thebespokefoilcompany.co.uk';

/* Cached for an hour at the edge. Crawlers hit this rarely, and an hour means a
   newly published post appears the same day without a Supabase read per request. */
const CACHE = 'public, max-age=3600, s-maxage=3600';

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* Supabase REST read. Anon key is correct here: this is a public read of rows
   that are already public pages. Protect with RLS allowing select of live rows. */
async function fromSupabase(table, select, filter) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.log('[sitemap] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return [];
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/${table}?select=${select}${filter ? '&' + filter : ''}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      console.log(`[sitemap] ${table} -> ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.log(`[sitemap] ${table} failed:`, e.message);
    return [];
  }
}

function urlBlock({ loc, lastmod, priority }) {
  return '  <url>\n' +
         `    <loc>${xmlEscape(SITE + loc)}</loc>\n` +
         (lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n` : '') +
         `    <priority>${Number(priority).toFixed(1)}</priority>\n` +
         '  </url>\n';
}

/* ---------------------------------------------------------------------------
   NOT YET PUBLISHED
   ---------------------------------------------------------------------------
   Kept in step with franchise-bio.js: a slug listed there 404s,
   so listing it here would advertise a dead URL to Google. Ryan, 14/08: Salamata is
   signed but not onboarded, so her page comes down until she is.

   A list here rather than a data change, deliberately. The bio page and the
   affiliate lookup BOTH gate on `active = true` in the franchisees table, so
   setting her inactive would take her page down AND kill her discount code and
   commission attribution at the same time. Those are separate decisions and
   should have separate switches.

   To publish someone: delete their slug from this list. Nothing else.
   --------------------------------------------------------------------------- */
const UNPUBLISHED_BIOS = new Set(['salamata-bah']);

export default async (request, context) => {
  const today = new Date().toISOString().slice(0, 10);

  /* 1. Static half, written by the build from _redirects. Fetched rather than
        imported so it always reflects the current deploy. */
  let staticUrls = [];
  try {
    const res = await fetch(new URL('/sitemap-static.json', request.url));
    if (res.ok) staticUrls = (await res.json()).urls || [];
    else console.log('[sitemap] sitemap-static.json ->', res.status);
  } catch (e) {
    console.log('[sitemap] sitemap-static.json failed:', e.message);
  }

  /* 2. Dynamic halves. Both are best-effort: if Supabase is unreachable the
        sitemap still returns the static routes rather than a 500. A short
        sitemap is recoverable; an error page tells Google nothing. */
  const [regions, posts, bios] = await Promise.all([
    fromSupabase('franchise_regions', 'slug,updated_at', 'is_available=eq.true'),
    fromSupabase('blog_posts', 'slug,updated_at', 'published=eq.true'),
    fromSupabase('franchisees', 'slug,updated_at', 'active=eq.true'),
  ]);

  const regionUrls = regions.map((r) => ({
    loc: `/franchises/${r.slug}`,
    lastmod: (r.updated_at || today).slice(0, 10),
    priority: 0.5,          // matches CATEGORY_PRIORITY['Franchise Regions']
  }));

  const postUrls = posts.map((p) => ({
    loc: `/post/${p.slug}`,
    lastmod: (p.updated_at || today).slice(0, 10),
    priority: 0.6,          // matches CATEGORY_PRIORITY['Stories']
  }));

  const bioUrls = (bios || [])
    /* Skip anyone not yet published. franchise-bio.js 404s these slugs, so
       listing them here would hand Google a dead URL. The two lists must
       stay in step - both live at the top of their own file. */
    .filter((b) => b.slug && !UNPUBLISHED_BIOS.has(b.slug))
    .map((b) => ({
    loc: `/franchises-bio/${b.slug}`,
    lastmod: (b.updated_at || today).slice(0, 10),
    priority: 0.6,
  }));

  /* 3. Merge. De-duplicated on loc so a route that exists both statically and in
        Supabase cannot appear twice - a duplicate <loc> is a validation error. */
  const seen = new Set();
  const all = [...staticUrls, ...regionUrls, ...postUrls, ...bioUrls].filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    all.map(urlBlock).join('') +
    '</urlset>\n';

  console.log(`[sitemap] ${staticUrls.length} static + ${regionUrls.length} regions + ${postUrls.length} posts + ${bioUrls.length} bios = ${all.length}`);

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': CACHE },
  });
};
