# keepsake.thebespokefoilcompany.co.uk - Hero & Buy Section (sign-off pass)

Premium editorial rebuild of the kit page top section, for paid traffic only.
One HTML file plus cropped photography. Open index.html in any browser.

## Status (updated 20/07/2026)
The full page is built - hero, kit selector, personalisation, steps,
Foil Fusion band, FAQ and reviews. The Stripe checkout drawer, Netlify
functions, ShipStation handoff, Mandrill confirmation email and Meta
Pixel/CAPI are all wired. See CHANGELOG-MERGE.md for what changed in
the 20/07 merge.

## Design decisions
- Type: Fraunces (display serif, close in spirit to the logotype),
  Instrument Sans (UI/body), Nothing You Could Do (script - one word only).
- Signature element: "forever" in the headline carries a slow metallic
  foil sheen - the product, in typography. Respects reduced-motion.
- Palette: brand-confirmed 000000 / BEAD9D / DDD6CE / F6F6F4 / FFFFFF only.
- No nav, no menu. Logo only. Paid visitors have one job.
- Sticky mobile buy bar appears once the checkout buttons scroll off.

## What's stubbed
- Nothing in the payment path. The Payment Element and Express Checkout
  Element are mounted for real, with the PaymentIntent created by
  functions/create-payment-intent.js (bfc-addons pattern).
- Countdown uses SHIP_CUTOFF_HOUR = 12 with weekend rollover, same logic
  as the earlier build. Bank holidays not handled.
- Functions only run on a real Netlify deploy. Opening index.html locally
  will log a config 404 and checkout will not start - that is expected.

## Before launch (not needed for sign-off)
- Full-res photography from Ashley - current images are cropped from a
  page screenshot and are fine for judging design, not for production.
  The "That Never Fades" band image also needs a clean version without
  baked-in text.
- Dixit: set the Netlify env vars and redeploy, register the Stripe
  Payment Method Domain (wallets will not appear otherwise), confirm the
  webhook delivery log returns 200, keepsake subdomain DNS. Deploy via
  git or CLI - drag-and-drop will 404 the functions.
- noindex meta and canonical to the Wix product page are already in the
  head - keep them.

## Header & footer - AFFILIATE PAGES vs the general page (IMPORTANT)

This distinction matters when everything is pieced into the main migration, so
it is written down rather than remembered.

**This file is a Memory Catcher AFFILIATE page** (the MEMORY_CATCHER object is
populated - Ashley here). Affiliate pages are reached ONLY by scanning a
franchisee's QR code. The whole point is a closed loop: scan -> land here ->
buy ON THIS PAGE. The purchase must happen here so the franchisee's slug goes
into the Stripe metadata and they get their commission.

Therefore, on affiliate pages:
- Keep the SAME header and footer chrome as the rest of the site (brand
  consistency - logo, contact, payment marks, Trustpilot, legal).
- REMOVE the internal navigation links from that header/footer. No menu into
  Home / Shop / About / other products.
- Reason: if a referred customer can navigate into the main site, they may buy
  through a normal route that carries NO affiliate attribution, and the
  franchisee loses the commission they earned by sending that customer. The
  page is deliberately a one-way conversion trap.

**The general keepsake page is the opposite.** Once it is folded into the main
migration it becomes a normal site page and SHOULD carry the full header and
footer WITH navigation, like every other page. It is not attribution-sensitive,
so there is no reason to trap the visitor.

Summary: affiliate page = full chrome, navigation stripped. General page = full
chrome, navigation intact. Same look, different link behaviour, for a
commission-integrity reason.

(Note: this current build has no nav to strip yet - it is the paid-traffic
standalone with logo only. When the shared header/footer component is wired in
during the migration, this is the rule to apply per page type.)

## Dynamic franchisee layer - NOT built here (Dixit's, flagged 22/07)

This file is a STATIC TEMPLATE with one franchisee hardcoded in the
MEMORY_CATCHER object. It is not the production affiliate system. Dixit
correctly flagged that the network needs DYNAMIC pages: one URL pattern
/memory-catcher/<slug>, the slug looked up against Supabase to fetch that
franchisee's data at request time, so 20+ franchisees run off one template
rather than one static file each.

What is NOT in this build (Dixit owns it):
- slug -> franchisee lookup, backed by Supabase
- the URL serving mechanism for /memory-catcher/<slug> (rewrite to template +
  data injection, edge function, or per-franchisee pre-render on deploy)
- the franchisee data model (slug, name, discount_code, photo_url,
  shopify_location_gid, active, ...)

What IS already built and MUST NOT be rebuilt (the contract):
- The page renders entirely from one object:
    const MEMORY_CATCHER = { name, slug, code, photo };
  The dynamic page's only front-end job is to populate those four fields per
  request. Set null -> the affiliate box removes itself (plain kit page).
- Payment-side attribution is done and flows off `slug`:
    client sends affiliate: MEMORY_CATCHER.slug -> create-payment-intent
    -> Stripe metadata affiliate_slug (sanitised lowercase [a-z0-9-])
    -> webhook: ShipStation source `memory-catcher:<slug>`, customField1 `mc:<slug>`
  So the missing piece is the slug-to-franchisee DATA layer, not attribution.

### RESOLVED with Dixit (22/07) - architecture locked

1. Serving: Netlify EDGE FUNCTION injects data into one template. Route
   `/memory-catcher/:slug` -> netlify/edge-functions/memory-catcher.js looks the
   slug up in Supabase and replaces the '__MC_DATA__' token in index.html with
   that franchisee's JSON. Config is in netlify.toml ([[edge_functions]]).
2. Supabase table `franchisees`: slug (unique), name, discount_code, active
   (plus shopify_location_gid etc as needed). Edge function selects
   active=true only; protect with RLS. Env: SUPABASE_URL, SUPABASE_ANON_KEY.
3. Photos: COMMITTED assets, assets/mc-<slug>.webp (not Supabase storage - cost).
   Ashley's is already named this way. One WebP committed per new franchisee.
4. Commission source of truth: Stripe metadata `affiliate_slug`. (ShipStation
   source and customField1 still carry it as a convenience, but the dashboard
   reads affiliate_slug.)
5. Unknown/inactive slug: 404. Branded 404.html added; edge function rewrites
   to it for bad-shape, unknown, or inactive slugs.

### What Claude built (front-end half of the contract - done)
- index.html MEMORY_CATCHER is now injected via the '__MC_DATA__' token, with an
  Ashley fallback if the token is unreplaced (static preview still renders).
  Verified: injecting a different franchisee (Salamata) round-trips cleanly -
  name, code, photo path and the slug sent to checkout all correct.
- netlify/edge-functions/memory-catcher.js - REFERENCE edge function. Slug guard
  matches the payment-intent sanitiser. Supabase lookup is stubbed with a
  dependency-free REST call for Dixit to point at the real table (has an
  ashley-only fallback for local/preview until env vars are set).
- 404.html - branded, noindex, links to the kit product page.
- netlify.toml - edge route wired.

### What Dixit still owns
- Create the Supabase `franchisees` table + RLS, set SUPABASE_URL /
  SUPABASE_ANON_KEY in Netlify, and confirm the REST select in the edge
  function matches the real column names.
- Commit one mc-<slug>.webp per franchisee.
- Point the commission dashboard at Stripe metadata affiliate_slug.
- Confirm the edge function replaces the token on a real deploy (local preview
  uses the fallback, so this can only be fully confirmed live).
