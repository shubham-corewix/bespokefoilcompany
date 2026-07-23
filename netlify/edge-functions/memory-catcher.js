// netlify/edge-functions/memory-catcher.js
//
// Serves /memory-catcher/<slug> from ONE template (memory-catcher.html) by
// looking the slug up in Supabase and injecting that franchisee's data.
//
 // Contract (agreed 22/07):
//   - one template, edge-injected data (not per-franchisee static files)
//   - Supabase table: slug (unique), name, discount_code, active, ...
//   - photos are COMMITTED assets: /assets/mc-<slug>.webp
//   - commission source of truth: Stripe metadata affiliate_slug
//   - unknown / inactive slug -> branded 404
//
 // Env vars (Netlify dashboard):
 //   SUPABASE_URL, SUPABASE_ANON_KEY

export default async (request, context) => {
  const url = new URL(request.url);
  const slug = url.pathname.split("/").filter(Boolean).pop() || "";

  // Must match cleanAffiliate() in functions/create-payment-intent.js
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
    return context.rewrite("/memory-catcher-404.html");
  }

  const franchisee = await lookupFranchisee(slug, context);
  if (!franchisee) {
    return context.rewrite("/memory-catcher-404.html");
  }

  const mc = {
    name: franchisee.name,
    slug: franchisee.slug,
    code: franchisee.discount_code,
    photo: `/assets/mc-${franchisee.slug}.webp`,
  };

  // Fetch the shared affiliate template (not the site homepage).
  const templateUrl = new URL("/memory-catcher.html", url.origin);
  const templateRes = await fetch(templateUrl);
  if (!templateRes.ok) {
    return new Response("Affiliate template missing", { status: 500 });
  }

  let html = await templateRes.text();
  // Double-stringify -> safe JS string literal; page JSON.parse's it back.
  html = html.replace("'__MC_DATA__'", JSON.stringify(JSON.stringify(mc)));

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

async function lookupFranchisee(slug, context) {
  const SUPABASE_URL = Netlify.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Netlify.env.get("SUPABASE_ANON_KEY");

  // Local/preview fallback until env vars are set.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (slug === "ashley") {
      return {
        name: "Ashley",
        slug: "ashley",
        discount_code: "ASHLEY-WIG",
        active: true,
      };
    }
    return null;
  }

  const endpoint =
    `${SUPABASE_URL}/rest/v1/franchisees` +
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
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
