// netlify/edge-functions/memory-catcher.js
//
// Serves /memory-catcher/<slug> from ONE template (index.html) by looking the
// slug up in Supabase and injecting that franchisee's data at request time.
//
// This is a REFERENCE implementation for Dixit. The front-end contract is
// fixed; the parts marked "DIXIT" are yours to wire to the real Supabase.
//
// Contract (agreed 22/07):
//   - one template, edge-injected data (not per-franchisee static files)
//   - Supabase table: slug (unique), name, discount_code, active, ...
//   - photos are COMMITTED assets: assets/mc-<slug>.webp (not Supabase storage)
//   - commission source of truth downstream is Stripe metadata affiliate_slug
//   - unknown / inactive slug -> 404
//
// Wire-up in netlify.toml:
//   [[edge_functions]]
//     path = "/memory-catcher/:slug"
//     function = "memory-catcher"
//
// Env vars (Netlify dashboard):
//   SUPABASE_URL, SUPABASE_ANON_KEY  (anon key is fine - this is a public read
//   of non-sensitive display fields; protect the table with RLS allowing
//   select of active rows only)

export default async (request, context) => {
  const url = new URL(request.url);
  // /memory-catcher/<slug>  ->  grab the last non-empty path segment
  const slug = url.pathname.split('/').filter(Boolean).pop() || '';

  // Basic shape guard - must match the server-side sanitiser in
  // functions/create-payment-intent.js (cleanAffiliate): lowercase a-z 0-9 -
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
    return context.rewrite('/404.html');
  }

  // ---- DIXIT: look the slug up in Supabase ----
  // Return the franchisee row for an ACTIVE slug, or null.
  const franchisee = await lookupFranchisee(slug, context);

  // Unknown or inactive -> 404 (agreed).
  if (!franchisee) {
    return context.rewrite('/404.html');
  }

  // Build the object the template expects. Photo is a committed asset by slug.
  const mc = {
    name:  franchisee.name,
    slug:  franchisee.slug,
    code:  franchisee.discount_code,
    photo: `assets/mc-${franchisee.slug}.webp`,
  };

  // Fetch the template and inject. The template carries the literal token
  // '__MC_DATA__' (quotes included in the source); we replace the quoted token
  // with the JSON object so it parses as a real object in the page.
  const res = await context.next();          // serves index.html for this route
  let html = await res.text();
  html = html.replace("'__MC_DATA__'", JSON.stringify(JSON.stringify(mc)));
  // ^ double-stringify: outer gives a JS string literal in the source, the
  //   page's own JSON.parse turns it back into the object. Keeps injection to
  //   a single safe string with no HTML-context escaping surprises.

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
};

// ---------------------------------------------------------------------------
// DIXIT: replace the body of this with a real Supabase call.
// Kept dependency-free (fetch against the REST endpoint) so it runs on the
// edge without a bundler. RLS should restrict select to active rows.
// ---------------------------------------------------------------------------
async function lookupFranchisee(slug, context) {
  const SUPABASE_URL = Netlify.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Netlify.env.get('SUPABASE_ANON_KEY');

  // Fallback for local/preview or missing env: let the one known example work,
  // everything else 404s. Remove once Supabase is wired.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (slug === 'ashley') {
      return { name: 'Ashley', slug: 'ashley', discount_code: 'ASHLEY-WIG', active: true };
    }
    return null;
  }

  const endpoint = `${SUPABASE_URL}/rest/v1/franchisees` +
    `?slug=eq.${encodeURIComponent(slug)}` +
    `&active=eq.true` +
    `&select=slug,name,discount_code,active&limit=1`;

  const r = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return (Array.isArray(rows) && rows[0]) ? rows[0] : null;
}
