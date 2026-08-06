// netlify/edge-functions/franchise-region.js
//
// Serves /franchises/<slug> from Supabase at request time. One template, no
// static generation, no build step - as specified.
//
// WHY AN EDGE FUNCTION RATHER THAN A CLIENT-SIDE FETCH
//   * a slug with no row must return a REAL 404. Under a plain _redirects splat
//     Netlify answers 200 for every path that matched, and a JS redirect after
//     that is a soft 404 - Google flags them.
//   * Open Graph tags must be in the HTML that is SERVED. Facebook, WhatsApp,
//     LinkedIn and X do not run JavaScript when they scrape a link, so meta
//     injected in the browser would leave all 112 regions sharing one preview.
//   Injecting at the edge solves both: the response is complete before it is sent.
//
// Follows the same shape as memory-catcher.js, which is the proven pattern here.
//
// netlify.toml:
//   [[edge_functions]]
//     path = "/franchises/:slug"
//     function = "franchise-region"

const SITE = 'https://www.thebespokefoilcompany.co.uk';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

async function lookupRegion(slug) {
  const url = Netlify.env.get('SUPABASE_URL');
  const key = Netlify.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.log('[franchise-region] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return null;
  }
  try {
    const res = await fetch(
      `${url}/rest/v1/franchise_regions?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) { console.log('[franchise-region] lookup ->', res.status); return null; }
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.log('[franchise-region] lookup failed:', e.message);
    return null;
  }
}

export default async (request, context) => {
  const slug = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';

  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return notFound(context);

  const r = await lookupRegion(slug);
  if (!r) return notFound(context);

  const res = await context.next();     // franchise-region-template.html
  let html = await res.text();

  const canonical = `${SITE}/franchises/${r.slug}`;
  const title = r.meta_title || `Baby Keepsake Franchise Opportunity in ${r.region}`;
  const desc  = r.meta_description || r.hero_subtitle || '';

  /* Rich-text fields arrive as Wix Ricos JSON. Flatten to paragraphs; if the
     value is already plain text or HTML it passes through untouched. */
  const rich = (v) => {
    if (!v) return '';
    const t = String(v).trim();
    if (!t.startsWith('{')) return t.startsWith('<') ? t : `<p>${esc(t)}</p>`;
    try {
      const doc = JSON.parse(t);
      const out = [];
      (function walk(n) {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === 'object') {
          if (n.type === 'PARAGRAPH') {
            const txt = [];
            (function grab(x) {
              if (Array.isArray(x)) return x.forEach(grab);
              if (x && typeof x === 'object') {
                if (x.type === 'TEXT' && x.textData) txt.push(x.textData.text);
                Object.values(x).forEach(grab);
              }
            })(n.nodes || []);
            if (txt.length) out.push(`<p>${esc(txt.join(''))}</p>`);
            return;
          }
          if (n.type === 'BULLETED_LIST') {
            const items = [];
            (n.nodes || []).forEach((li) => {
              const txt = [];
              (function grab(x) {
                if (Array.isArray(x)) return x.forEach(grab);
                if (x && typeof x === 'object') {
                  if (x.type === 'TEXT' && x.textData) txt.push(x.textData.text);
                  Object.values(x).forEach(grab);
                }
              })(li);
              if (txt.length) items.push(`<li>${esc(txt.join(''))}</li>`);
            });
            if (items.length) out.push(`<ul>${items.join('')}</ul>`);
            return;
          }
          Object.values(n).forEach(walk);
        }
      })(doc.nodes || []);
      return out.join('\n');
    } catch { return `<p>${esc(t)}</p>`; }
  };

  const map = {
    slug: esc(r.slug),
    region: esc(r.region),
    city: esc(r.city_name),
    seo_title: esc(title),
    meta_description: esc(desc),
    hero_subtitle: esc(r.hero_subtitle || ''),
    coverage: esc(r.coverage_areas || ''),
    baby_classes: esc(r.baby_classes_in_area || ''),
    summary: esc(r.card_profile_summary || ''),
    buy_in: esc(r.buy_in || ''),
    potential: esc(r.franchise_potential || ''),
    community_note: esc(r.community_note || ''),
    coverage_desc: esc(r.region_coverage_desc || ''),
    why_area: rich(r.why_area),
    baby_classes_list: rich(r.baby_classes_list),
    bio: r.franchisee_bio ? rich(r.franchisee_bio) : '',
  };
  html = html.replace(/\{\{([a-z_]+)\}\}/g, (_, k) => (k in map ? map[k] : ''));

  /* Open Graph, server-side. Social scrapers do not run JavaScript, so a
     client-side fetch would leave all 112 regions sharing one preview. */
  html = html.replace('</head>',
    `  <meta property="og:type" content="website">\n` +
    `  <meta property="og:title" content="${esc(title)}">\n` +
    `  <meta property="og:description" content="${esc(desc)}">\n` +
    `  <meta property="og:url" content="${esc(canonical)}">\n` +
    `  <meta property="og:site_name" content="The Bespoke Foil Company">\n` +
    `  <meta name="twitter:card" content="summary_large_image">\n` +
    `</head>`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=60',
    },
  });
};

async function notFound(context) {
  const nf = await context.rewrite('/404.html');
  return new Response(await nf.text(),
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
