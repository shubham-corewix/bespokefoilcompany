# The Bespoke Foil Company - UNIFIED SITE (merged 26/07/2026)

**Build 11/08/2026** - Dixit's dynamic bio system carried over intact; B1 link-audit redirects added; `supabase/franchise-bios.sql` MUST be run before deploy (see runbook B2b).

**Full handover: see DIXIT-HANDOVER.md** - architecture, slug conventions, env vars, ordered go-live sequence, open items, and the hard-won rules. This README is the quick orientation only.

**This repo is now the WHOLE website - one Netlify deploy.** The previously separate deploys have been merged in. Deploys to the main site (takes thebespokefoilcompany.co.uk at cutover).

## What merged in (26/07)
| Was | Now |
|---|---|
| keepsake.thebespokefoilcompany.co.uk (kit LP + checkout) | **/our-kit** - THE product page: Stripe Payment Element drawer, wallets, quantity stepper. Indexed, self-canonical, Mark's SEO metadata, Product schema (4.9/65) |
| keepsake /memory-catcher/<slug> affiliate pages | **/memory-catcher/<slug>** here - edge function `netlify/edge-functions/memory-catcher.js` injects franchisee data into the /our-kit template via `_redirects` wildcard. Affiliate copies forced noindex; canonical /our-kit. Fallback slugs pre-Supabase: `ashley`, `salamata-bah` |
| franchise.thebespokefoilcompany.co.uk (Meta ads LP v8) | **/franchise** - indexed, self-canonical, Mark's metadata. `submit-lead.js` function included. Differing images namespaced `flp-*` |
| addons portal | **/addons** (route `# exclude`) - functions merged with renames: `addons-create-payment-intent`, `addons-stripe-webhook` (client fetch updated) |

**Retired:** old Wix-style our-kit page, old franchise page, static `memory-catcher-salamata-bah.html` (path now edge-served).

## CRITICAL before this goes live
1. **Env vars on THIS Netlify site** (union of all): STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, SHIPSTATION_API_KEY/SECRET, MANDRILL_API_KEY, META_CAPI_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY. Until Stripe vars are set, /our-kit renders but the payment drawer won't initialise.
2. **Stripe webhooks must be RE-REGISTERED** at this site's URLs: `/.netlify/functions/stripe-webhook` (kit) and `/.netlify/functions/addons-stripe-webhook` (add-ons). Each endpoint gets its own signing secret. DO NOT retire the old keepsake/addons deploys or repoint their subdomains until this is done and tested - live money flows.
3. **DIXIT: diff against your keepsake GitHub repo head** before adopting - this contains the 22/07 merged build; reconcile anything you pushed since.
4. Subdomain plan at cutover: keepsake./franchise./addons. 301 to /our-kit, /franchise, /addons (set at Netlify level on the old sites).
5. Apple Pay: register the final domain in Stripe Payment Method Domains.

## Everything else
Full conventions, discovery-file system, region CMS rules (109 slugs in DIXIT-region-routes-live-crawl.xlsx, routes at /franchises/<wix-slug>), QA history: see BFC-WEBSITE-THREAD.md and DIXIT-BRIEF.md.

## Analytics (MANDATORY on every page)

BFC no longer runs on Wix, so there is no CMS backend reporting traffic. GA is
the only source of truth for how people find and use the site. **A page that
ships without the tag is invisible for as long as nobody notices.**

Every public page must carry this as the FIRST line inside `<head>`:

```html
<script src="/shared/analytics.js"></script>
```

Measurement ID `G-L1J1KR2VZZ`. It lives in `shared/analytics.js` only, never
inline on a page. With 50 hand-maintained pages an inline snippet would mean 50
copies of the ID to keep in step.

**It must be first in `<head>`.** The file sets Google Consent Mode defaults to
`denied` before the GA library loads, so no analytics cookie is written until a
visitor accepts. Anything that runs ahead of it can write a cookie before consent
exists.

### This is enforced, not just documented

`scripts/check-analytics.js` runs as part of the Netlify build and **fails the
deploy** if any page is missing the tag. It also warns if the tag is not first in
`<head>`. A page that genuinely should have no analytics goes in the `EXEMPT` set
in that script, with a reason. Currently exempt: `snag-tool.html` and
`component-library.html`, both internal.

### When creating or regenerating pages

- New page: add the tag as the first line in `<head>` before anything else.
- Regenerated or rebuilt page: check the tag survived. It is the easiest thing to
  lose when a page is rewritten wholesale.
- Zipping a package for handover: run the build command locally first. If
  `check-analytics` fails, the deploy will fail too.

### Consent banner

`shared/analytics.js` also injects the banner, a small panel bottom-left, and
stores the decision in `localStorage` under `bfc-consent`. Bump `VERSION` in that
file to re-ask everyone after a policy change.

Follows the same pattern as the Twine Growth banner, reskinned to BFC. ICO
position: declining is exactly as easy as accepting, both buttons are the same
size, nothing is pre-selected, and the choice can be changed at any time.

- A **Cookie settings** link is injected into `.foot-legal` on every page, so
  withdrawing consent is as easy as giving it. This is a requirement, not a
  nicety. Fallbacks cover `.upf-foot` and a bare `footer` for the handful of
  pages with a different footer.
- Anything carrying `data-open-consent` reopens the choice, so the link can be
  placed manually on the privacy policy page too.
- **Escape declines** rather than dismissing silently, so there is never a state
  where the banner has gone but no choice has been recorded.
- `window.bfcConsent` exposes `get()`, `set(bool)`, `open()` and `reset()`.

`window.bfcConsent.get()` and `.set(bool)` are exposed, and a `bfc:consent` event
fires on decision, so the Meta Pixel on `/our-kit` and `/addons` can be brought
under the same banner later without reworking any of this. **It is not under it
today** - the Pixel still fires regardless of the choice made in the bar.
