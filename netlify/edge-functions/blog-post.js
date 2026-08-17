// netlify/edge-functions/blog-post.js
//
// Serves /post/<slug> from Supabase at request time. One template, no static
// generation.
//
// READ THIS BEFORE CHANGING ANYTHING HERE
// These 16 posts carry live SEO. Their metadata was ported from a Screaming Frog
// crawl of the Wix site specifically so the rankings survived migration. That is
// why the title, description, canonical and Open Graph tags are injected HERE,
// server-side, rather than by script in the page: Googlebot renders JavaScript,
// but the social scrapers (Facebook, WhatsApp, LinkedIn, X) do not, and a
// client-side fetch would also mean the crawler seeing an empty shell on first
// pass. The URLs must not change either - /post/<slug> is exactly what is indexed.
//
// netlify.toml:
//   [[edge_functions]]
//     path = "/post/:slug"
//     function = "blog-post"

const SITE = 'https://www.thebespokefoilcompany.co.uk';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

async function lookupPost(slug) {
  const url = Netlify.env.get('SUPABASE_URL');
  const key = Netlify.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) {
    console.log('[blog-post] SUPABASE_URL or SUPABASE_ANON_KEY missing');
    return null;
  }
  try {
    // published=eq.true is belt and braces - RLS already restricts anon to
    // published rows - but it keeps the intent visible at the call site.
    const res = await fetch(
      `${url}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) { console.log('[blog-post] lookup ->', res.status); return null; }
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.log('[blog-post] lookup failed:', e.message);
    return null;
  }
}

export default async (request, context) => {
  const slug = new URL(request.url).pathname.split('/').filter(Boolean).pop() || '';

  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return notFound(context);

  const p = await lookupPost(slug);
  if (!p) return notFound(context);

  const res = await context.next();     // post-template.html
  let html = await res.text();

  const canonical = `${SITE}/post/${p.slug}`;
  const img = p.hero_image_path
    ? (p.hero_image_path.startsWith('http') ? p.hero_image_path : SITE + p.hero_image_path)
    : '';
  const published = p.published_at ? new Date(p.published_at) : null;
  const modified  = p.updated_at ? new Date(p.updated_at) : published;

  /* read_time is stored, but computed from the body when it is not - 200 wpm,
     which is the usual reading-speed assumption. */
  const words = String(p.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = p.read_time || Math.max(1, Math.round(words / 200));

  const tags = Array.isArray(p.tags) ? p.tags : [];
  const tagsHtml = tags.map(t => `<span class="post-tag">${esc(t)}</span>`).join('\n');

  const faqs = Array.isArray(p.faqs) ? p.faqs : [];
  /* The section heading moves INTO this string so an empty faqs array renders
     nothing at all. It used to live in the template, which meant a post with no
     FAQ data showed a bare "FAQs" heading over empty space - which is exactly
     what shipped. The template comment even said "omit whole block if no FAQs";
     nothing implemented it. */
  const faqItems = faqs.map(f =>
    `<details class="post-faq"><summary>${esc(f.q)}</summary><div>${f.a || ''}</div></details>`
  ).join('\n');

  /* Wrap the whole section, heading included, so nothing renders when empty. */
  const faqsHtml = faqs.length
    ? `<section class="post-faqs"><h2>FAQs</h2>\n${faqItems}\n</section>`
    : '';

  /* Same for the closing block - an empty .post-body div still carries margin. */
  const finalThoughtsHtml = (p_final => p_final
    ? `<div class="post-body">${p_final}</div>`
    : '');

  /* Structured data. Emitted only when there are FAQs - an empty FAQPage is a
     validation error in Search Console. */
  const faqsJsonld = faqs.length ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: String(f.a || '').replace(/<[^>]+>/g, '') },
    })),
  }) : '{}';

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.title,
    description: p.meta_description || p.excerpt || '',
    image: img || undefined,
    datePublished: published ? published.toISOString() : undefined,
    dateModified: modified ? modified.toISOString() : undefined,
    author: { '@type': 'Organization', name: p.author || 'The Bespoke Foil Company' },
    publisher: { '@type': 'Organization', name: 'The Bespoke Foil Company' },
    mainEntityOfPage: canonical,
  });

  const related = await lookupRelated(p.slug, p.category);
  const relatedHtml = related.map(r =>
    `<a class="pr-card" href="/post/${esc(r.slug)}">` +
    (r.hero_image_path ? `<img src="${esc(r.hero_image_path)}" alt="" loading="lazy">` : '') +
    /* The template's CSS styles `.pr-card-body` (padding) and
       `.pr-card-body h3` (Fraunces 340). Emitting a bare <h3> missed both, so
       titles rendered as unpadded default bold sans. */
    `<div class="pr-card-body"><h3>${esc(r.title)}</h3></div></a>`
  ).join('\n');

  const fmt = (d) => d ? d.toLocaleDateString('en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  /* Every token the template carries. Anything missing renders empty rather
     than leaving a literal {{placeholder}} on the page. */
  const map = {
    slug: esc(p.slug),
    title: esc(p.title),
    seo_title: esc(p.meta_title || p.title),
    meta_description: esc(p.meta_description || p.excerpt || ''),
    og_title: esc(p.meta_title || p.title),
    og_description: esc(p.meta_description || p.excerpt || ''),
    og_image: esc(img),
    hero_image: esc(img),
    body: p.body || '',                      // trusted CMS HTML, injected as-is
    final_thoughts: finalThoughtsHtml(p.final_thoughts || ''),
    author: esc(p.author || 'The Bespoke Foil Company'),
    author_avatar: esc(p.author_avatar || '/assets/bfc-logo-v2.svg'),
    published_iso: published ? published.toISOString() : '',
    modified_iso: modified ? modified.toISOString() : '',
    published_display: esc(fmt(published)),
    read_time: `${readTime}`,
    tags_html: tagsHtml,
    faqs_html: faqsHtml,
    faqs_jsonld: faqsJsonld,
    related_html: relatedHtml,
    blogposting_jsonld: jsonld,
  };
  html = html.replace(/\{\{([a-z_]+)\}\}/g, (_, k) => (k in map ? map[k] : ''));

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

/* Three most recent published posts, excluding this one. */
async function lookupRelated(slug, category) {
  const url = Netlify.env.get('SUPABASE_URL');
  const key = Netlify.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/blog_posts?published=eq.true&slug=neq.${encodeURIComponent(slug)}` +
      `&select=slug,title,hero_image_path&order=published_at.desc&limit=3`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    return res.ok ? await res.json() : [];
  } catch { return []; }
}
