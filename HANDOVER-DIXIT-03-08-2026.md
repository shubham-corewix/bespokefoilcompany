# Handover to Dixit - 3 August 2026

Package: `thebespokefoilcompany.co.uk-03-08-2026.zip`

Full reasoning for every change is in `BFC-WEBSITE-THREAD.md` under dated blocks.
This document is the short version plus what is still open.

---

## Read this first

**Your Supabase schema is ahead of the copy in this package.** Once `gallery_state`
is added for the gallery pipeline, your version is newer. Do not reapply
`supabase/upload-portal.sql` from here over your own work.

**The gallery feed schema changed** from `{src, full, alt}` to
`{type, src, poster, alt}`. Any webhook written against the old shape needs
updating.

**`.gitignore` keeps disappearing** between handovers, which is why `.DS_Store`
files keep coming back. It is restored in this package. Worth checking it
survives your next commit.

---

## What changed in this run

### New: shared Stripe checkout

`shared/checkout.js` (27KB) now holds the drawer markup, its CSS and all Stripe
logic. **Both the product page and the home page use it** - the home page
previously fired `alert('Design preview...')` on its Buy buttons.

Extracted verbatim from the product page; the only change is that page-specific
values arrive through config:

```js
BFCCheckout.init({ getKit, getQty, setQty, getPersonalisation?, getAffiliate?, maxQty?, triggers })
```

**`CHECKOUT-TEST-SCRIPT.md` is the priority job.** I verified the module in a
headless DOM - it injects, wires, and calls `create-payment-intent` with the
correct SKU, quantity, affiliate and personalisation on both pages. **I could not
test an actual payment.** No card taken, no wallet rendered, no webhook fired.
That needs test keys in a browser and it must be done before this goes live. The
product page regression test at the top of that script matters most: that flow
worked before the change and must still work.

Read the comment block at the top of `shared/checkout.js` before editing. The
`shippingaddresschange` trap silently blocks every wallet button with no visible
error.

### Everything else

- **Analytics**: GA4 `G-L1J1KR2VZZ` on all pages via `shared/analytics.js`, with
  Consent Mode v2 defaulting to denied and a consent banner. `scripts/check-analytics.js`
  runs in the build and **fails the deploy** if a page is missing the tag.
- **Trustpilot**: figures centralised in `shared/trustpilot.js`. Two constants at
  the top, everything else reads from them, including the JSON-LD. Count is 72.
- **Product page**: now served at `/product-page/foil-handprint-footprint-kit-baby-keepsake`
  (the ranking URL), with `/our-kit` 301ing to it. 231 internal links repointed.
- **404**: `404.html` now exists and is branded. Previously every 404 showed
  Netlify's generic grey box.
- **Images**: ~75 new `img-*` assets from the library across 17 pages. Named by
  library number, page-scoped, so no shared asset was overwritten.
- **Mobile**: portrait containers become square below 600px; the second of two
  consecutive image-led bands is hidden.
- **Sitewide**: cart removed (44 pages, no JS was ever bound to it), 33 dead
  `#order` anchors repointed, social links wired, footer credit changed to Twine
  Growth, logo fill corrected to `#1d1d1b`.

---

## Open for you

### 1. Checkout testing - highest priority
`CHECKOUT-TEST-SCRIPT.md`. Nothing else should ship before this passes.

### 2. Four forms have no backend
None of these have any submit JavaScript - no handler, no `fetch()`. They were
never wired, so this is a build rather than a fix.

| Form | Page |
|---|---|
| Slot Reservation | `/slot-reservation-form` |
| Memory Catcher Enquiry | `/memory-catcher-enquiry` |
| Contact | `/contact` |
| Join Community | `/franchise` and others |

`functions/submit-lead.js` exists but **is not routed in `_redirects`**, so
nothing could reach it even if the forms did post. Worth reusing the pattern in
`upload-portal-submit.js`: write the row first so a failure still leaves a
record, then return a reference.

### 3. Franchisee login
`/franchisee-login` has no endpoint and no auth. Worth deciding between Supabase
Auth (the franchisee hub already reads from Supabase) and magic links before any
code is written. The "Forgot password?" link is deliberately still `href="#"` -
it has nowhere to go until the flow exists.

### 4. Blog to Supabase - read the caveat
16 static post pages, each with a `/post/<slug>` route, and **they carry live SEO**.
The metadata was ported from a Screaming Frog crawl of the Wix site specifically
to protect those rankings.

**Build it at build time, not in the browser.** Supabase becomes the source of
truth, the output stays static HTML, URLs are untouched. Client-side rendering
would mean Google crawling empty pages, which would undo the migration work.
Same build-hook pattern as `GALLERY-AUTOMATION-SPEC.md`.

### 5. Gallery automation pipeline
`GALLERY-AUTOMATION-SPEC.md`, sent separately. Two things in it that will cost a
day if missed: the purge job deletes the gallery's source files, and `status`
cannot double as the publication flag.

### 6. Affiliate pages 404 on the test deploys
`/memory-catcher/ashley-eccleston` returns 404. The edge function relies entirely
on Supabase since the hardcoded fallback slugs were removed at go-live step 5, so
it almost certainly needs `SUPABASE_URL` and `SUPABASE_ANON_KEY` setting on the
Netlify site - env vars do not travel with a deploy. The function logs both
failure modes, so the function log will confirm in one look.

### 7. Two bugs I could not reproduce
Both check out structurally: every element exists, IDs match, scripts parse
clean, nothing preceding them can throw.

- Slider buttons on `/foil-fusion-technology`
- Hamburger on `/franchise`

**What would settle it: the browser console error, the browser and version, and
whether it fails on mobile, desktop or both.** One line of console output.

One hypothesis worth checking first: `scroll-snap-type: x mandatory` can fight
programmatic `scrollTo({behavior:'smooth'})` in some browsers, and the symptom is
exactly "the buttons do nothing".

---

## Blocked on content, not code

- **View Region buttons** point at the one built region page. `regions.json` has
  **112 regions and one page exists**. Making the links dynamic today would 404
  for 111 of them. One-line change once the pages or CMS routes exist.
- **View Profile buttons** - same shape. One bio page exists (Ashley).
- **42 Wix CDN image references** across 14 pages. Hard deadline is the Wix
  account closing.
- **`mc-salamata-bah.webp`** is still a placeholder.

---

## Known and deliberate

- **~32 drawer CSS rules** remain inline on the product page and are now also
  injected by the checkout module. Identical rules, so cosmetic only. Left to
  keep that diff readable; worth removing once the checkout is proven.
- **Figtree** is preloaded on 48 pages for a single rule on the announce bar.
  Removing it drops a whole font family from every page load. Not done yet.
- **`story-video-*.webp` and `upf-large-icon.avif`** are orphaned - no page
  references them. Left in place rather than deleted.

---

## Housekeeping worth knowing

`sitemap.html` is **generated** from `scripts/sitemap-template.html` on every
build. Hand-editing it gets overwritten on the next deploy. If something needs
changing there, change the template.

The build command runs three checks in order:

```
node scripts/generate-sitemaps.js && node scripts/check-internal-links.js && node scripts/check-analytics.js
```

All three pass on this package. The link checker also warns when a link points at
a 301 source rather than its destination - that warning has caught real problems
twice, so it is worth reading rather than ignoring.
