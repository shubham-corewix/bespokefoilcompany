# BFC Website - Thread Continuation Doc

**Purpose:** drop this into a fresh Claude thread to continue the Bespoke Foil Company website build with zero re-explaining. This thread is about **BFC's website specifically** (the static HTML migration off Wix). The separate "Migration Platform" thread is about productising this approach for other clients - keep them apart.

**How to resume:** upload the latest `bfc-site-repo.zip`, then this doc. Claude unzips into a working dir, reads this, and picks up. Repackage to `bfc-site-repo.zip` and `present_files` after each change.

**Thread naming:** `YYYY-MM-DD | BFC | <Workstream>`. Rename manually.

---

## WHAT THIS PROJECT IS

Hand-coded static HTML/CSS/JS marketing site for The Bespoke Foil Company (Ryan + Ashley's baby foil keepsake business, Wigan), migrating off Wix onto Netlify. Ryan directs, reviews on phone, deploys to Netlify himself. Dixit is the developer for backend/CMS/integration wiring. Team = Dixit only (never reference Guia or Clea).

---

## CURRENT STATE (as of this handoff)

**29 HTML pages built, all live-routed, on CSS `?v=10`.** Every footer and menu link resolves to a real page. All routes return 200. The site is ~80% there: the remaining 20% is Ryan's QA pass on the live Netlify deploy, final image swaps, and the technical wiring that goes to Dixit (see the separate Dixit brief).

**Customer-facing pages live:**
`/` (home) - `/our-story` - `/our-kit` (Order Your Kit) - `/premium-frames` - `/print-quality-guarantee` - `/foil-fusion-technology` - `/eco-friendly` - `/upload-portal` - `/tommys-charity` - `/kit-walkthrough-video` - `/bespoke-baby-gallery` - `/faq` - `/find-a-memory-catcher` - `/franchise` - `/franchise-region` (regions listing) - `/contact` - `/privacy-policy` - `/blog` (Stories & Inspiration hub).

**Template/collection pages:**
- `/franchise-region/west-norfolk-kings-lynn` - the one built region DETAIL page (template for the other ~111, a Dixit CMS job).
- `/franchise-bio/ashley-eccleston` - the one built franchisee BIO page (template).
- `/post/why-every-parent-needs-a-baby-footprint-keepsake` - the one built blog POST (from `post-template.html`).
- `/sitemap` - generated customer sitemap page.

**Utility / form pages (added recently, all `noindex`, surfaced via the sitemap "Utility Pages" section for testing):**
- `/memory-catcher/salamata-bah` - Memory Catcher affiliate/QR product page (duplicate of `/our-kit` + affiliate pull-out box). CMS-ready via a single `MEMORY_CATCHER` data object; Dixit swaps per catcher.
- `/upload-portal-thank-you` - "Thank you for uploading your prints" success page (full site chrome).
- `/franchise-success` - "Thank you for showing interest" success page (full site chrome).
- `/memory-catcher-enquiry` - "Register your interest" Memory Catcher enquiry form (full chrome + dark hero). Static UI only.
- `/slot-reservation-form` - "Pre-book Form" with £10 deposit (minimal focused chrome). Static UI only; Dixit wires Stripe.
- `/upload-portal-form` - multi-step upload portal, welcome + Step 1 (Your details) + Step 2 (Order details) built, scaffold ready for more steps. Minimal chrome. Static UI only; Dixit wires Zendesk + steps.

**The nav menu:** curated 9 primary links (Home / Our Story / Foil Fusion Technology / Eco-Friendly / Order Your Kit / Stories & Inspiration / Bespoke Baby Gallery / FAQ / Contact) + a distinct **Memory Catcher™ callout section** with two image cards (Become a Memory Catcher -> /franchise; Find a Memory Catcher -> /find-a-memory-catcher). Secondary pages are footer-only by design.

---

## RECENT CHANGES (most recent session block)

1. **Memory Catcher affiliate PDP** (`/memory-catcher/salamata-bah`) - duplicate of `/our-kit` with an affiliate pull-out box (headshot, "Exclusive offer from <name>", copy-code button for `SALAMATA` = free extra copy). CMS-ready via one `MEMORY_CATCHER` object. `noindex`, canonical -> Wix PDP.

2. **Utility + form pages** - the two thank-you pages, the two forms, and the upload portal form (see list above).

3. **"Utility Pages" sitemap convention** - extended `scripts/generate-sitemaps.js` with a `# util | Label` comment tag in `_redirects`. `util` routes render ONLY on the human `sitemap.html` page (under a "Utility Pages / testing" heading), kept OUT of `sitemap.xml` / `robots.txt` / `llms.txt`. **At go-live, switch the six `# util` tags back to `# exclude` in `_redirects`** to drop the whole testing section and keep those pages non-indexed. Documented in `scripts/README.md`.

4. **Logo swap (site-wide)** - replaced `assets/bfc-logo.svg` with the redrawn wordmark (aligned to site fonts). Fill normalised to pure `#000` so the white-on-dark hero filter (`brightness(0) invert(1)`) still works. One-file change updates all 29 pages. **NOTE: the ® in the logo artwork is baked in as vector paths - Ryan to re-export the logo with ™ and drop it in (same one-file swap).**

5. **Registered -> Trademark (® -> ™) across all text** - all 42 `&reg;` instances (all on "Foil Fusion Technology") changed to `&trade;`. Memory Catcher was already ™ everywhere. Zero registered marks remain in text. (Rights not yet secured; playing safe with ™.) The logo artwork ® is the only ® left on the site - see item 4.

6. **Memory Catcher Hub section** (franchise page, above "Why join the Bespoke Foil family?") - contained white rounded card (`border-radius:22px`), heading + two paragraphs on the right, two phone mockups (referral/QR + earnings) on the left. Copy locked (see below). Images converted to webp at 500/800/1100. **Spacing gotcha fixed:** `.mc-why-join` below has `margin-top:-70px` (deliberate original layering); the Hub section needed `padding-bottom:130px` + `.mc-hub-card{position:relative;z-index:1}` so the white box clears the stone band rather than being clipped by it.

**Hub section copy (locked):**
> **Manage your business via our Memory Catcher Hub**
>
> The Memory Catcher Hub is your central portal for running everything from one simple place. Track your commissions as they come in, reorder your stock, get to grips with our training videos, all in a few taps, and keep the whole business organised without the admin piling up.
>
> It's designed to take care of the day-to-day, so you don't have to - giving you the freedom to spend more time with your family, which is what the whole Memory Catcher ethos is about.

---

## STANDING RULES (locked - do not drift)

- **British English. Never em dashes** (use hyphens).
- **Memory Catcher™ Franchise** - singular, TM after "Franchise". An in-person baby keepsake experience, never a "class".
- **Founders Pricing £3,445** (first 10 franchisees, VAT included, quote pure cost only). Rises to £6,995.
- **Kit prices:** Foil Print £34.95 / Framed £49.95 / Premium £59.95. (See note: use HTML entity `&pound;` in code.)
- **Five Fibre Framework™** - TM after "Framework".
- **BFC product link** (blog/content): `https://www.thebespokefoilcompany.co.uk/product-page/foil-handprint-footprint-kit-baby-keepsake`
- **Sons:** Tommy (~June 2021), Teddy (~January 2024).
- **® -> ™ everywhere** until registration secured. Logo artwork ® still pending re-export.
- **Tone:** Northern warmth + commercial intelligence, two sentences per paragraph, story/opinion-first, no AI cliches. Short punchy fragments are on-brand ("No scripts. No pressure."). Ashley's voice for customer-facing; Ryan's for founder notes. Litmus: "would Ryan say this on a Zoom call?"

### Design system (locked)
- **Palette (CSS vars):** `--ink:#000000; --stone:#BEAD9D; --bone:#DDD6CE; --porcelain:#F6F6F4; --white:#FFFFFF; --stone-text:#7D6E52; --hairline:rgba(0,0,0,.12)`.
- **Fonts:** Fraunces (serif, `--serif`, weight 340, ALL headings) - Instrument Sans (body, `--sans`) - Nothing You Could Do (`--script`, signatures/accents). Figtree = announce bar only.
- **Container:** max-width 1280px; margins 40px desktop / 18px mobile.
- **Radii:** `--r-img:18px; --r-card:14px; --r-btn:10px`. (Hub card uses 22px for a softer feature look.)
- **Buttons:** corner radius (`--r-btn`) + square arrow icon, NEVER heavy pills. `.cta` is the reference.
- **Two header patterns:** `.hero-scope` (dark-photo-hero pages - white logo, overlay header) vs `.light-scope` (content/legal pages - solid header, dark logo). Blog/privacy/gallery/video use light-scope. Form/utility pages use a minimal focused chrome (logo + "Makers for Memory Catchers" endorsement, no site nav/footer).
- **Signature blocks:** `.sign-name` (script) + `.sign-role`, ~72px bottom padding desktop / ~56px mobile.
- **Image placeholders:** pick best-fit from asset bank on own initiative, flag with `<!-- IMAGE PLACEHOLDER: ... -->`. Never ask Ryan which image.

### Critical architecture (learned the hard way)
1. **Absolute asset paths** (leading `/`) for all `/shared/` and `/assets/`. Relative paths break on subpath pages. (Side effect: breaks local `file://` preview - use a local server.)
2. **Cache-busting:** `/shared/styles.css?v=N`. Bump N on every SHARED-CSS change, across ALL pages in one pass. Currently **v=10**. (Inline `<style>` changes and asset swaps do NOT need a bump.)
3. **Defensive SVG cap** in the menu (`.nav-menu svg{max-width:26px;max-height:26px}`) - keep it.
4. **Negative-margin layering:** some sections pull up over the one above (`.mc-why-join{margin-top:-70px}`). When placing a card/box directly above such a section, give it enough bottom padding + `position:relative;z-index:1` so it isn't clipped.

---

## THE DISCOVERY-FILE SYSTEM (auto-generated, never hand-edit)

`sitemap.xml`, `sitemap.html`, `robots.txt`, `llms.txt` are all generated from `_redirects` by `scripts/generate-sitemaps.js`, which Netlify runs on every deploy (`netlify.toml` build command).

**Single source of truth = `_redirects`.** Each 200 route carries its sitemap metadata as an inline comment:
```
/our-kit   /our-kit.html   200   # Category | Label | optional note for llms.txt
```
Grammar:
- `Category | Label` = labelled + grouped in all four files.
- third `| note` = llms.txt only.
- `# exclude` = live but kept out of ALL discovery files.
- `# util | Label` = live, shown ONLY on `sitemap.html` under "Utility Pages / testing", kept out of xml/robots/llms. **Temporary - flip to `# exclude` at go-live.**
- no comment = derived label under "Other".

Netlify ignores everything after `#`. **To add/rename a page:** add ONE `200` line in `_redirects` with the right comment. All four files rebuild on deploy. (Full detail: `scripts/README.md`.)

---

## VERIFICATION METHOD (the QA gate)

Sandbox image viewer is unreliable (it does NOT render CSS `var()` colours - the stone band shows grey, so visual overlap bugs can't be measured in-sandbox; trust the artifact preview / live deploy for anything colour- or layout-critical). Verify by measurement instead:

Local Node HTTP server mimics Netlify's `_redirects` rewrites (strips inline comments), then per page assert: 200 - CSS 200 correct `?v=` - serif H1 - exactly one H1 - `#navMenu` + `.burger` present (or correctly ABSENT on minimal-chrome pages) - footer links correct - no broken internal links - no horizontal overflow at 1280px + 390px - page-specific interactions work. Plus a Python `HTMLParser` tag-balance pass. A page isn't done until it passes all of it.

**Preview without deploying:** build a self-contained `franchise-preview.html` (or any page) - inline `shared/styles.css`, embed assets as base64 data URIs, strip srcset, disable internal nav (`href="#"`) - and `present_files` it as an artifact. Renders in a real browser engine, so it shows colours/layout truthfully (unlike wkhtmltoimage). Costs no Netlify credits. **Do not ship preview files in the repo - delete before zipping.**

---

## COLLECTION TEMPLATES (CMS-ready, for Dixit to wire)

Page types driven by JS data arrays (each array becomes the CMS feed later):
- **Blog:** `blog.html` hub (`POSTS` array) + `post-template.html` (tokenised) + `scripts/build-blog-post.js` + `scripts/blog-example-post.json` + `scripts/BLOG-CMS-BRIEF.md`. SEO rule: keep `/post/<slug>` URLs identical to Wix - zero redirects. Separate seo_title/og_title/meta/og_description per post. One H1. BlogPosting + FAQPage JSON-LD per post. **Hub must not go live pointing at unbuilt posts (they 404). The one existing post links to 3 related posts that don't exist yet - part of the Dixit CMS rollout.**
- **Franchise regions:** `franchise-region.html` (`FRANCHISE_REGIONS` array) + West Norfolk detail template. ~111 more via CMS; give each `# Franchise Regions | <name>` when wired.
- **Franchisee bios / Memory Catchers:** `find-a-memory-catcher.html` (`MEMORY_CATCHERS` array) + Ashley bio template.
- **Memory Catcher affiliate PDPs:** `memory-catcher-salamata-bah.html` (`MEMORY_CATCHER` object) - one per catcher.
- **Baby gallery:** `bespoke-baby-gallery.html` (`PHOTOS` array, 13 placeholder images). Built array-first for a future upload-portal webhook. Lightbox works.

---

## IMMEDIATE / PENDING WORK

**Ryan's side:**
- **Full QA pass on the LIVE Netlify deploy** - absolute paths/fonts/embeds/interactions only show true on Netlify. The Playwright browser checks (console errors, mobile overflow, multi-step form JS) couldn't run in-sandbox - run against live.
- **Logo ® -> ™ re-export** - re-export the wordmark SVG with ™, drop into `assets/bfc-logo.svg` (one-file swap).
- **Final image swaps** - Hub mockups are real; baby gallery still on 13 placeholders; enquiry-form select options and slot-form copy to confirm with Ashley.
- **Go-live sitemap decision** - flip the six `# util` tags to `# exclude` when ready to hide the testing section.

**Dixit's side:** see the separate `DIXIT-BRIEF.md` in this zip. Summary: CMS wiring (blog/regions/bios/gallery), form submissions + integrations (Stripe on slot deposit, Zendesk on upload portal, plus the tools he knows about), the rest of the upload-portal steps, the ~111 region detail pages, the Supabase custom CMS + franchisee dashboard.

**Known pending items:**
- **Salamata Bah bio page** - from the Ashley template. Deferred until she's fully onboarded. Do NOT build until asked.
- **Kit Walkthrough Video** - poster + placeholder; Dixit to wire the real video URL.
- **Blog** - only 1 real post; hub must not go live pointing at unbuilt posts. `post-template.html` sits at root with unfilled tokens - Dixit to noindex or move to an unpublished folder.
- **Trustpilot "65 reviews" footer link** - still `#` (low priority).
- **Parked:** FAQ shows a "£40" price that doesn't match the 3-tier pricing - Ryan to decide.

---

## ASSET BANK (in `/assets/`, `.webp` unless noted)
Logo: `bfc-logo.svg`. Heroes: `mc-hero`, `ff-hero`, `hero-196`, `contact-hero`, `charity-215` (multiple widths). Testimonials: `test-1/2/3`. Frames/prints: `inc-foil-hr`, `inc-framed-hr`, `inc-premium-hr`, `gallery-01..13`. People: `founders-074`, `ff-ashley`, `mc-ashley`, `story-*`. Memory Catcher: `mc-what`, `mc-who`, `mc-role-us`, `mc-role-you`. **Hub mockups: `mc-hub-referral-{500,800,1100}`, `mc-hub-earnings-{500,800,1100}`.** Steps: `step-1..6`. Charity: `charity-215`. Payment chips in `assets/pay/`. `tp-stars.svg`, `tp-stars-5.svg`.

---

## STANDALONE DEPLOYS (separate Netlify sites, NOT in this repo)
- Franchise Earnings Calculator - `calculator.thebespokefoilcompany.co.uk`
- Regional Map - `map.thebespokefoilcompany.co.uk` (112 regions, per-region embeds)

---

## WHAT'S NEXT AFTER QA
Once BFC's site is QA'd and signed off, the next phase is the **Supabase custom CMS** (blog, regions, bios, gallery + franchisee dashboard on one backend). Tracked in the separate Migration Platform thread as the productised offering, but BFC is the first implementation. Sequencing rule: lock templates in QA first, THEN build the CMS into finished templates.

---
## CHANGELOG - 23/07/2026 master handover consolidation
- Nine-step upload portal form merged in (was 2-step) + lockup/avif assets; endpoint hook /upload-portal-submit intact.
- Mark's live-crawl titles/descriptions ported to all matched pages; all SEO stubs cleared.
- Routes realigned to live Wix: /franchises/<slug> (region), /franchises-bio/ashley-eccleston (bio). SEO 301 block added for all renamed/retired Wix URLs. /prints correctly 301s to /print-quality-guarantee (it is the quality page on Wix, not a product page).
- All 15 blog posts built as static pages at /post/<wix-slug>, content ported from live; blog index slugs corrected (3 were drifting from live URLs). Post images reference Wix CDN - re-host before Wix closure.
- Trustpilot updated to 4.9 / 65 everywhere visible; Product JSON-LD (AggregateRating 4.9/65) added to our-kit.html head.
- DIXIT-region-routes-live-crawl.xlsx added (109 live region slugs + SEO metadata for CMS).
- Discovery files regenerated (Stories: 15).
- INTERNAL LINKING (standing approach, 23/07): no CMS means links are hand-authored, so (a) contextual internal links are part of every page build, and (b) scripts/check-internal-links.js validates every internal href against _redirects on each Netlify deploy (report-only, wired into netlify.toml build command; run with --strict to fail CI). It validates dynamic JS-built links (/post/, /franchises/, /franchises-bio/, /memory-catcher/) by prefix. First run caught and fixed two real bugs: find-a-memory-catcher built /franchise-bio/ links and franchise-region built /franchise-region/ links (both old patterns).
- OG IMAGE standing rule reconfirmed: every page's og:image = that page's own hero, cropped 1200x630. Blog posts currently use their Wix CDN hero as og:image (rule-compliant in source, not yet local); when heroes are re-hosted during final checks, crop each to a per-page local file (assets/og/post-<slug>.jpg) and repoint og:image + twitter:image.
- SNAG TOOL added (23/07): /snag-tool (route excluded from discovery files) hosts a bookmarklet for design QA. Click bookmark on any preview page -> "+ Snag" -> click element -> note. Records page, CSS selector, viewport, note; accumulates in localStorage across pages; Export downloads bfc-snags-*.json for the Claude thread. Readable source at scripts/snag-bookmarklet-source.js (re-minify into snag-tool.html href if edited).
- SNAG FIXES round 1 (23/07, via snag tool): region template (a) enquiry copy double-offset - parent .ri-enquiry-inner is already a centred 1280px container so the full-bleed calc() left padding was removed (fixed 40px); (b) rail CTA label was being hijacked by the generic .ri-rail .lbl rule (11px uppercase faint-grey = invisible on black + broken centring) - scoped .ri-rail .cta .lbl override added; (c) territory map iframe passed the retired slug west-norfolk-kings-lynn - regions.json/embed derive slugs from the /franchises/ link field, param corrected to norfolk-west. LESSON: when Dixit generates the 108 CMS region pages, the iframe param must be the region's live Wix slug (same value as the route).
- SNAG FIX round 2 (23/07): region template enquiry media now follows the .mc-register-media pattern from franchise.html - square (aspect-ratio 1/1), rounded (var(--r-img)), sticky top on desktop, top-aligned with the copy (inner align-items:start), margins 88px/40px desktop, 18px inset mobile. PATTERN RULE for end-of-page CTA/enquiry sections with a portrait photo: always square-crop via aspect-ratio, never stretch to column height.

---
## CHANGELOG - 26/07/2026 SINGLE-SITE MERGE (architecture change)
- Repo is now the unified website: keepsake build -> /our-kit (indexed PDP, self-canonical, schema kept), franchise LP v8 -> /franchise (indexed), addons app -> /addons (# exclude), affiliate pages -> /memory-catcher/:slug via edge function + _redirects wildcard to /our-kit.html template. Edge forces noindex on affiliate copies now the template is indexed; fallback covers ashley + salamata-bah pre-Supabase. Functions merged into /functions with esbuild bundler; addons' colliding two renamed addons-* and client fetch repointed. Old our-kit, old franchise, static salamata page retired. LP's 14 differing mc-* images namespaced flp-*; icons/videos subfolders flattened after a cp nesting trap. Link checker now wildcard-aware. 79/79 asset refs + all internal links verified over HTTP. See README.md for the go-live criticals (env vars, webhook re-registration, Dixit GitHub diff, subdomain 301s).
- DEPLOY FIX (26/07): first unified deploy failed - functions require('stripe') but the source deploys' package.json files never came across in the merge. Root package.json added (stripe ^17.7.0, satisfies both source ranges) + package-lock.json committed. node_modules never goes in the zip; Netlify installs at build. Lesson: merging serverless functions means merging their manifests too.
- ADDONS ROUTING FIX (26/07): the addons app's own _redirects revealed its real URLs - /add-ons-exclusive-discount-938476 (live checkout) plus two -locked browse-mode variants (page JS reads the path suffix). All three ported to root _redirects (# exclude) pointing at /addons/index.html; the invented /addons route removed. Subfolder _redirects/netlify.toml deleted (inert at subfolder level - only root copies count).
- FRANCHISE CHROME + UTILITY LISTINGS (26/07): /franchise now carries the full site header (sticky, burger nav, Order Your Kit CTA), nav menu, footer and chrome script grafted from the interior-page pattern; shared/styles.css loaded before the LP's inline styles so page styling keeps precedence. Utility Pages section now lists: Add-Ons Upsell App (live URL), Memory Catcher - Ashley affiliate example (/memory-catcher/ashley), Upload Portal Form (already present).
- SNAG FIXES round 3 (26/07, deploy QA): (a) franchise footer/header restyled wrongly - the LP's inline CSS shipped its own complete footer/announce/lp-header rule system which overrode shared chrome (loads later); 49 clashing rules stripped, chrome now styled by shared/styles.css alone. (b) black logo - the hero-scope wrapper (announce -> hero-scope -> header -> hero, per interior pages) was missing from the graft; now wraps header + mc-hero. (c) Trustpilot bar: sitewide swap tp-stars.svg -> tp-stars-5.svg (full five stars, already in asset bank) incl. sitemap template; announce alt now "Rated 4.9 out of 5". (d) /memory-catcher/ashley served plain product page - edge function not executing on the deploy; in-source `export const config = { path: "/memory-catcher/*" }` added (more reliable than toml-only). If it still doesn't fire after redeploy, the cause is the deploy TYPE: Netlify drag-and-drop drops may not bundle edge functions - test via `netlify deploy` CLI or a Git-connected site.
- CRITICAL FIX + SLUG CONVENTION (26/07 pm): discovered the 26/07 morning our-kit replacement NEVER PERSISTED - a failing cp (directory omitted, non-zero exit) broke the && chain so that python block silently never ran; /our-kit stayed the old Wix-style page on every package since, which is also why affiliate pages served plain (template had no token). Root-caused, re-run with hard assertions: /our-kit is now genuinely the keepsake checkout build (127KB, token present, indexed, self-canonical, Mark's metadata, schema, 5-star bar). LESSON (locked): multi-step shell commands joined with && around cp/copy operations must not carry critical writes behind them; verify file identity (size/token/marker), not just links, after every merge. SLUG CONVENTION (locked, per Ryan): Memory Catcher affiliate slugs are FULL NAMES (/memory-catcher/ashley-eccleston), matching the Supabase slug column and CMS. Bootstrap in our-kit is now path-gated: affiliate box renders ONLY on /memory-catcher/<slug> (client-side fallback covers drop deploys where edge functions don't run: ashley-eccleston, salamata-bah); plain /our-kit shows no box. Edge fallback keys updated to match. PLACEHOLDER FLAG: assets/mc-salamata-bah.webp is a best-fit stand-in (lifestyle image, not Salamata) - real photo needed; mc-ashley-eccleston.webp duplicated from mc-ashley.webp.
- PATH FIX (26/07): keepsake-derived /our-kit used RELATIVE asset paths (built for subdomain root); served at /memory-catcher/<slug> they resolved to /memory-catcher/assets/* and 404d - ALL 112 refs absolutised (/assets/...) across attributes, srcset lists, css url() and JS gallery/fallback arrays; edge photo path absolutised too. Stale keepsake-source Trustpilot numbers (4.5 alts, 4.8 lockup) re-fixed to 4.9 - NOTE: the fresh page copy predated Thursday's sweep, so number fixes had to be re-applied. All 42 unique asset refs verified 200 over HTTP. RULE (locked): any page merged from a standalone deploy gets paths absolutised BEFORE routing at a nested path.
- SNAG FIX (26/07): "Register your interest" CTAs on the earnings calculator (2x) and region map page, plus the franchise page privacy link, pointed at the live Wix site absolutely - all now internal (/memory-catcher-enquiry, /privacy-policy), target=_blank dropped for same-site navigation. 301 added: /memory-catcher-enquiry-form -> /memory-catcher-enquiry (URL is referenced from the live calculator subdomain).
- MERGE + RECONCILIATION (28/07): Dixit's repo export merged against the 26/07 master package. Full byte diff, 336 files each side: assets/ (245 files), shared/, scripts/ and addons/ all IDENTICAL - no visual regression possible from this merge. 11 files changed. KEPT from Dixit: Stripe `source` namespacing keepsake-landing -> main-keepsake-landing and addons-landing -> main-addons-landing, applied symmetrically across both create-payment-intent functions and both webhook gates (correct - it stops the old still-live deploys and the unified site processing each other's orders during parallel running); edge-function logging; removal of the hardcoded edge fallback slugs (go-live step 5). RESTORED (his base predated the 26/07 snag round and had reverted it, changelog line included): the three "Register your interest" CTAs had gone back to the absolute old Wix path /memory-catcher-enquiry-form AND the rescuing 301 had been deleted from _redirects - so that URL had no route at all and all three CTAs would have 404d the moment DNS cut over. Fixed as absolute /memory-catcher-enquiry (absolute retained deliberately: these pages also serve from the calculator. and map. subdomains where a relative path would 404), 301 restored as a safety net for links already in the wild. Franchise privacy link back to relative /privacy-policy, target=_blank dropped. RE-GATED: affiliate-commission-webhook source check had been commented out rather than renamed; now an allowlist of ['main-keepsake-landing','keepsake-landing'] so affiliate orders through EITHER deploy still earn commission while ungated 20% payouts on any future product reusing affiliate_slug stay impossible. HOUSEKEEPING: .gitignore and DIXIT-HANDOVER.md restored (both deleted), committed .DS_Store removed, README pointer restored. Discovery files regenerated, link checker green. STILL OPEN: order-confirmation email in functions/stripe-webhook.js references orderNumber/subtotal/postage which are never declared - the merge block throws ReferenceError on every order inside a non-blocking try/catch, so every customer confirmation email is silently failing. Unfixed pending a decision on where those three values should come from.

- MERGE ROUND 2 (28/07 pm): Dixit's `-latest` export reconciled. His new export branched from his OWN 04:32 zip at 06:26, i.e. BEFORE the reconciled baseline existed at 08:25 - so the 28/07 restorations were never in his tree and nothing was rejected. Only ONE genuine change since his last export: a Hub ledger block appended to creditCommission() in functions/affiliate-commission-webhook.js, upserting into `transactions` (on_conflict source,external_id) and seeding `month_status` (on_conflict franchisee_id,month) in POUNDS. That block is carried across VERBATIM, 1,388 chars byte-identical; the only line differing from his file is the source gate, which stays as the AFFILIATE_SOURCES allowlist. SCHEMA CONFLICT FOUND AND RESOLVED ON OUR SIDE, NOT HIS: his code does `franchisees?...select=id`, but supabase/commissions.sql created franchisees with `slug` as PK and NO id column - that query would 400, sb() throws, handler 500s and Stripe retries for three days while the Hub ledger never lands. Fixed by ADDING `id uuid unique default gen_random_uuid()` to franchisees and writing `transactions` + `month_status` DDL that matches his code exactly (both on_conflict targets backed by real unique constraints). UNITS NOTE (locked): `commissions` is integer pence, the Hub tables are numeric POUNDS because that is what the webhook writes - do not tidy one side without changing the webhook. FLAGGED, NOT CHANGED: his ledger writes sit outside a try/catch, so a Hub-table failure fails the whole handler even though the commission row already landed; awaiting Dixit's call before touching his code.
- UPLOAD PORTAL BUILD (28/07): all seven of Dixit's asks built. Inline error labels (created on demand, specific messages, clear on correction); country dropdown GB/IE/US/CA/AU/NZ with per-country NSN digit rules (GB 9-10, IE 7-9, US/CA 10, AU 9, NZ 8-10), pasted +44 and 0044 prefixes stripped; all 28 `required` attributes converted to `data-required` with `novalidate` on the form and validation driven from JS only; submit now validates EVERY step not just the visible one. ARCHITECTURE (locked): Netlify Blobs REJECTED - it has no browser upload path so files still cross the 6MB Lambda payload cap which cannot be raised on any plan, and it has no public URLs so reads hit the same 6MB ceiling. Zendesk caps a single attachment at 50MB and states it cannot be raised. Therefore Supabase Storage holds files, Zendesk holds workflow, ticket carries 90-day signed links (matches BFC's existing working setup per Ryan). TWO-PHASE SUBMIT: text row written FIRST (status pending) and signed per-object upload tokens returned, then browser PUTs each file direct to Storage via XHR with progress, then complete endpoint verifies objects exist, mints links, raises the ticket and flips to complete. A dropped upload therefore no longer loses the customer's details, and the old behaviour of silently redirecting to thank-you on failure is GONE. RETENTION: weekly scheduled purge, ships in DRY RUN until UPLOAD_PURGE_ENABLED=true, deletes files but KEEPS rows, and nothing is eligible until downloaded_at is stamped. OPEN: nothing sets downloaded_at yet - that hook is Ashley's download step; until wired the purge correctly deletes nothing, which is the safe direction but means storage grows. NO franchisee attribution by design (per Ryan: Memory Catchers don't touch anything post-sale; order_number is the join key). Client COUNTRIES and server PHONE_RULES tables must stay identical - verified equal by test.
- ZENDESK WHATSAPP FIELD (29/07, from Dixit's test of ticket #1099): ticket created fine but the custom WhatsApp field was empty because the payload never sent custom_fields. Fixed in functions/upload-portal-complete.js: custom_fields now carries [{id: 4751824796959, value: row.phone_e164}] - field is Text type so the value is the E.164 string, and the id is a safe integer so JSON.stringify keeps it unquoted. Field id overridable via ZENDESK_WHATSAPP_FIELD_ID for sandboxes. ALSO ADDED: explicit proof-whatsapp / proof-email tag from the customer's proofChannel choice - Zendesk WhatsApp automations should be conditioned on THAT TAG, never on the WhatsApp field being non-empty, otherwise an Email-proof customer whose number we happen to know gets WhatsApped without asking. ZENDESK_WHATSAPP_MODE=proof-only switches the field to populate only for WhatsApp-proof customers if an existing trigger already keys off field presence. Number format is E.164 with the leading plus; if the WhatsApp integration wants it stripped, do it in whatsappField() only.

---
## CHANGELOG - 30/07/2026 final snags and amends (thread open, entries appended as we go)

- VIDEO ASSIGNMENTS (30/07, Ryan signed off). Audit found only FIVE video slots on the whole site, two of them already filled and working: `/our-kit` gallery (`kit-upload.mp4`, 21s 1080x1080 silent loop, one of 15 slides) and `/franchise` (the `.mc-videos` marquee rail, 21 clips `mc-1`..`mc-30`, all present, ~500KB each, lazy-loaded with posters). Neither touched. Three were empty: `/our-story`, `/upload-portal-form` step 3, and `/kit-walkthrough-video`.
- `/our-story` -> `assets/our-story.mp4`, cut from `the-bespoke-foil-company-brand-video.mp4`. Encoded 1280x720 H.264 high/yuv420p CRF24, AAC 112k, `+faststart` (moov at byte 36, so it starts playing before the file finishes downloading). 24.9MB source -> 9.8MB. 1080p was tested and came out at 19.5MB for pixels nobody resolves in a 1280px column; 720p chosen deliberately. The page's existing JS already mounted `/assets/our-story.mp4` on click, so dropping the file in activated it with no wiring needed.
- `/upload-portal-form` step 3 -> `assets/upf-photographing-prints.mp4`, from `Photographing Your Prints`. 6.8MB -> 5.7MB, 720p, faststart. SELF-HOSTED DELIBERATELY (not YouTube): this video gates the upload step and a rejected submission costs real money, so no third-party player, no suggested videos, no "watch on YouTube" escape hatch at the moment of maximum drop-off risk.
- BUG FIXED - dead play button on upload portal step 3. The block carried `role="button"`, `tabindex="0"`, a play icon, `cursor:pointer` and a hover state, and a keydown handler that forwarded Enter/Space to a click. Nothing listened for the click. So the one thing standing between a customer and a rejected upload looked interactive and did nothing. Now mounts a real player on click, lazily, so the 5.7MB file is only fetched by customers who press play; poster restores on error.
- SNAG FIXED - portrait poster force-cropped into landscape slots on TWO pages. Both video slots used `story-video-*.webp`, which is 1000x1500 portrait, inside frames set to `aspect-ratio:16/9` (`/our-story`) and `16/11` (upload portal) with `object-fit:cover` - so only a horizontal band from the middle of the photo was ever visible. Replaced with 16:9 posters cut from the videos themselves (`os-video-poster-{700,1000,1400}.webp`, `upf-video-poster-{700,1000}.webp`), which also means the still now matches the opening frame so there is no jump on play. Upload portal video block given its own `aspect-ratio:16/9` overriding the generic `.upf-media` 16/11 rule: cropping a poster is cosmetic, cropping a playing video is not.
- ORPHANED, NOT DELETED: `story-video-{700,1000,1400}.webp` are no longer referenced by any page. Left in place pending Dixit's call.
- DONE (was OPEN): `/kit-walkthrough-video` placeholder (alert on click, plus visible "Video coming soon. This is a preview of the page design." copy). Decision made to embed YouTube `eTWixxBx768` (the 5m30s handprint tutorial) using a facade pattern - keep the existing poster and play button, load the iframe only on click - against `youtube-nocookie.com`. Facade matters twice over: a standard embed pulls ~1MB of Google player on page load, and BFC deliberately runs the Meta Pixel with no consent banner, so nothing should reach Google until the customer actively presses play. WIRED 30/07: id `eTWixxBx768` confirmed by Ryan (lives at `/instruction-video` on the live Wix site; that URL already 301s to `/kit-walkthrough-video` in `_redirects`, checked, no migration gap). The alert placeholder and the visible "Video coming soon. This is a preview of the page design." copy are both gone. `modestbranding` deliberately NOT used - deprecated as of 2024; `rel=0` kept but note it now only restricts end-screen suggestions to the same channel rather than removing them.
- BUG CAUGHT IN OUR OWN WIRING (30/07): `.kv-player::after` is the hover scrim and it is a PSEUDO-ELEMENT, so it survives `innerHTML = ''` and would have sat on top of the injected iframe swallowing every click on YouTube's controls. Fixed with an `.is-playing` class that sets `content:none` on the scrim, applied at mount. Worth remembering for any other facade we build: clearing innerHTML does not clear pseudo-elements.
- SNAG FIXED - the portrait-poster-in-a-landscape-frame problem was on a THIRD page. `/kit-walkthrough-video` used `ff-ashley-1400.webp` (1400x2100 portrait) inside `.kv-player` at `aspect-ratio:16/9` with `object-fit:cover`. Replaced with `kv-video-poster-{700,1000,1400}.webp` cut 16:9 from the tutorial itself (frame at 254s, Ryan's pick from six candidates). All three video slots on the site had the same fault.
- ORPHANED CSS, LEFT IN PLACE: `.kv-video-note` rules remain at two places in `kit-walkthrough-video.html` but the element is gone. Harmless; removing adds diff noise for no behavioural gain.
- FLAGGED FOR RYAN: `how-to-baby-footprint.mp4` (48s, 4K) was believed to be the clip already on the product page. It is not - `/our-kit` carries `kit-upload.mp4`, a 21s 1080x1080 SILENT square loop labelled "Uploading your prints from your phone". Different content, different shape, different length. If the footprint tutorial is on the live Wix product page it has not come across in the migration.
- PARKED: the five product clips (A5 Frame Black/White, Keyring, A3 Print, A3 Print White) have no slot on the site. Ryan to decide later.

### Snag batch 1 - Upload Portal (30 snags, exported 31/07/2026 07:33, reviewer Ryan)

All 30 against `/upload-portal-form`. Four root causes accounted for eleven of them, so most of this batch was CSS rather than one-by-one patching.

- **[01] already fixed.** Snags were taken against the deployed preview, which predates the video work earlier in this thread. `#upfKitVideo` already carries the real "Photographing Your Prints" player.
- **[02][03][18][19] error text sat to the RIGHT of the checkbox, not underneath.** Root cause: `.upf-check` is `display:flex` and the injected `<p class="frm-err">` becomes a third flex child, so it lands on the same row. Added `flex-wrap:wrap` plus `.upf-check .frm-err{flex:0 0 100%}`. One fix, four snags.
- **[04][05][06] filename and hint text ran on the same line as the drop-zone title.** Root cause: `.upf-drop .t` and `.upf-drop .h` are `<span>`s with no `display` set, so they flowed inline and the existing `margin-bottom:4px` on `.t` was doing nothing. Set both to `display:block`, added `word-break:break-word` so long filenames like "BK Projects - Leaflet.jpg" wrap instead of overflowing. Fixes mobile and desktop together, as asked.
- **[12][13][17][23][24] tile captions not centred, cramped.** Root cause: `.upf-tile .cap` is an inline `<span>`, so `text-align:center` could never centre it and vertical padding was collapsing. `display:block` plus padding raised to `14px 8px`. `white-space:nowrap` added, which also resolves [24] ("I ordered print only" was wrapping to two lines).
- **[07]** welcome image -> library **253** (`upf-welcome-{1000,1600}.webp`, srcset).
- **[08][09]** Personalisation banner -> **UPF-14**, caption removed. **[21][22]** Frame colour banner -> **UPF-08**, caption removed. **[25]** Card and foil banner -> **UPF-07**, caption and its `::after` rule removed. All three banners have wording baked into the artwork, so a new `.upf-media.art` variant uses `aspect-ratio:1/1` with `object-fit:contain` - the generic `16/11` cover crop was cutting the text off, which is what [08] was reporting.
- **[10][11]** font previews swapped from live text to artwork: Modern -> **UPF-13**, Cursive -> **UPF-12**. SEE OPEN QUESTION BELOW.
- **[14][15][16]** layout tiles -> **UPF-10**, **UPF-11**, **UPF-09** (`upf-layout-{1,2,3}.avif`).
- **[30] third layout tile orphaned bottom-left.** Three tiles in a two-column grid leaves the last one alone on its row. Added `.upf-choice.centre-last` scoped to the layout group only, so the two-tile font group above is untouched.
- **[20] "Please choose an option." gave no clue which group was unanswered.** Now reads the group's own `.upf-fieldlabel` and says "Please make a selection above: ...", with a generic fallback if no label is found.
- **[26]** generic chat-bubble icon replaced with a real WhatsApp glyph (filled, `fill:currentColor;stroke:none` since the sibling icons are stroked).
- **[27] gallery slider did not work because it was never built.** The markup was one static image plus three hard-coded decorative dots. Built a real slider: track, prev/next, touch swipe, and dots generated from the slide count so they cannot drift out of sync. Images **231, 195, 391, 425, 112** as `upf-slide-{1..5}.webp`, first eager and the rest lazy.
- **[28]** `.upf-lede` had `max-width:46ch`. Removed, so body copy now runs the full section width matching the media below it.
- **[29]** Skip button shared `.upf-next`'s black fill and sat directly above a black Continue, so it read as the primary action. Now a light secondary via `.upf-next[data-skip]`.

**OPEN QUESTION - [11].** Ryan's note says "Add image upf14 here" for the CURSIVE font preview, but UPF-14 is `desktop.avif` at 782x800 and UPF-14 is already assigned to the Personalisation banner in [08]. UPF-12 and UPF-13 are a matched pair at 376x120, which is the shape a font-preview strip needs, and [10] assigns UPF-13 to Modern. Applied **UPF-12** on that basis. One-line change if UPF-14 was genuinely intended.

**NEWLY ORPHANED:** `upf-large-icon.avif` is no longer referenced by any page (its content lives on as `upf-layout-3.avif`). Left in place pending Dixit's call. The `.upf-tile .prev .nm` / `.dt` rules are also now unused since the font previews became images; left in place, removing them adds diff noise for no behavioural gain.

### Snag batch 2 - Upload Portal screenshots (31/07/2026, actioned in one pass)

- **Personalisation banner left thin bars at the left and right edges.** UPF-14 is 782x800, not square, so `.upf-media.art`'s `object-fit:contain` pillarboxed it by ~9px a side. Fixed the ASSET rather than the rule: padded to a true 800x800 by edge-replication (stretching the outermost column outwards). Mirroring was rejected because the artwork carries a directional shadow, and a mirror would reverse the gradient and show a seam. `contain` is kept as the safety net for any future banner, so the anti-crop guarantee from snag [08] still holds.
- **Font previews heavily cropped.** `.upf-tile .prev` was `aspect-ratio:16/9` with `display:grid;place-content:center`. That combination sizes the grid track to the image's own width, so `max-width:100%` resolved against an already-oversized track, the artwork overflowed, and `.upf-tile{overflow:hidden}` chopped it - hence the middle slice of each name. The 16/9 box was a leftover from when these tiles held live text. Ratio removed; the 376x120 art (3.13:1) now sets its own height.
- **Layout tiles cropped.** `.upf-tile.tall img` forced `aspect-ratio:3/4` with cover, but the artwork is 400x560 (5:7). Ratio removed. UPF-11 was the odd one out at 400x537, which would have left it 4% shorter than its neighbour, so it was padded to 400x560 the same way. All three are now identical dimensions and sit level.
- **Selected tile state strengthened.** Added a bone caption bar on `:has(input:checked)`, matching the live portal Ryan referenced. Border plus shadow alone read weakly, particularly on a phone in daylight.
- **Step 8 gallery** switched from `16/11` to `1/1` per the screenshot.
- **Black band in the footer.** ROOT CAUSE: `shared/styles.css` carries a bare element selector `footer{background:var(--ink);padding:64px 40px 0}` for the sitewide four-column footer. `.upf-foot` set text properties but never a background, so the ink bled through. Reset to transparent with a hairline top border. Text updated to `Upload Portal v2.0 | © Bespoke Foil Company™ | Memory Catcher™`.
- CHECKED AND NOT A BUG: `our-kit.html` also has a bare `<footer>`, but it defines its own dark background deliberately (inverted logo, white links). Left alone. The portal was the only page affected - it looked like "every page" because it recurs on all nine steps of the same page.

### Snag batch 3 - Upload Portal (31/07/2026) - ONE root cause behind four separate reports

Batch 2 fixed symptoms and missed the actual fault. Correcting the record:

**ROOT CAUSE: the HTML `height` attribute was silently defeating every `aspect-ratio` rule on this page.** `width`/`height` attributes on `<img>` map to CSS as presentational hints. Author CSS beats them, but ONLY for properties it actually DECLARES. None of the `.upf-*` image rules declared `height`, so height stayed pinned at the attribute value. With width AND height both definite, `aspect-ratio` is ignored entirely by the spec. Every rule that sets an `aspect-ratio` now also declares `height:auto`. This one fault produced four separate snag reports (banner bars, font previews cropped, layout tiles cropped, gallery not square).

- **Banner bars were NOT caused by the 782x800 mismatch.** With `height:800px` pinned by the attribute, `aspect-ratio:1/1` never applied. REVERTED the padded asset - `upf-banner-personalisation.avif` is byte-identical to the original again - and switched `.upf-media.art img` to `height:auto` + `object-fit:cover`. The browser now scales to fill and trims ~2% top and bottom. No invented pixels.
- **REVERSED MY OWN BAD FIX.** Batch 2 padded the banner by edge-replication, stretching the outermost column 9px outwards. The right edge carries the card and envelope running off-frame, so it smeared real content into a flat streak (measured: 2 distinct colours across 12px). Ryan caught it. Padding is only safe against a plain backdrop; scaling to fill is the correct move when artwork runs to the edge. `upf-layout-2.avif` was reverted for the same reason.
- **Font previews still cropped after batch 2** because the batch 2 rule set `width`, `height` and `display` but NOT `aspect-ratio` or `object-fit`, so both still cascaded down from `.upf-tile img{aspect-ratio:1/1;object-fit:cover}`. `height:auto` then deferred to the inherited 1/1 and cover cropped a 3.13:1 strip to a square window. Now resets both explicitly.
- **Layout tiles** given `aspect-ratio:5/7` with `cover`. UPF-10 and UPF-09 are exactly 400x560 so they render pixel-perfect with zero crop; UPF-11 (400x537) is scaled to fill by the browser. All three sit level without touching the files.
- **"I ordered print only" wrapped despite `white-space:nowrap`** because the markup carried a literal `<br>`: `I ordered<br>print only`. `nowrap` prevents text wrapping, it cannot override an explicit break in the content. Removed. NOTE: `<br>` was used for deliberate two-line typography throughout this page (`Layout<br>Choices` etc). Fine on a banner, wrong on a grid tile where it breaks row alignment.
- **Step 8 gallery** now genuinely square (the `1/1` from batch 2 was inert for the same height-attribute reason). Crop is centre-based; flag any slide that loses something important and it can be adjusted per-image with `object-position`.

LESSON WORTH KEEPING: three of these were the same class of error - a property left undeclared, still arriving from somewhere else. When overriding image sizing, declare `width`, `height`, `aspect-ratio` AND `object-fit` together, or something upstream will win.

### Customer photos added to step 8 gallery (31/07/2026)

- 21 real customer photos supplied as `photos.zip` (65.8MB). Optimised to 800x800 WebP q80, **1.3MB total**, average 64KB.
- **PRIVACY: 20 of 21 carried EXIF, and 8 carried GPS COORDINATES.** Customers photograph keepsakes at home, so those are home locations, and they would have been published inside the image files. All metadata stripped. Orientation baked in with `exif_transpose` BEFORE stripping so nothing rotates once the EXIF is gone.
- **Renamed** from `firstname-surname-image.jpg` to neutral `bb-01..bb-21.webp`. Customer names should not appear in public asset URLs. Traceability kept in `CUSTOMER-PHOTO-MAPPING.md` - PRIVATE, must not ship to the site.
- Crops: centre square for landscape sources; portrait sources cropped with a 32% upward bias because faces sit above centre in phone photos. Ryan reviewed the contact sheet and signed off all 21 on 31/07.
- **BLOAT CONTROL - the reason slide count is now free.** Only slide 1 carries a real `src`. The other 20 use `data-src` and are hydrated on navigation, plus one preloaded ahead so the next tap is instant. Same pattern as the franchise marquee rail. A visitor who never touches the arrows downloads **155KB, not 1.3MB**, and that figure does not move as more slides are added.
- The five library slides (`upf-slide-1..5.webp`) were removed and deleted, replaced by the customer set.
- **OPEN - CONSENT.** Raised with Ryan, not yet confirmed. The step 8 tick covers uploads made through the portal. Any photo sourced from Instagram tags or DMs sits on a different footing and needs checking before it goes on public marketing pages.

**NEXT:** same 21 photos to be added to the Bespoke Babies gallery on the main site, plus a further batch of images and videos Ryan is sending.

- **Gallery dots removed (31/07, Ryan).** With 21 slides the dot row read as clutter. Arrows and touch swipe only now. Markup, CSS and the dot-building JS all removed cleanly, no orphan rules or references left. `.upf-dots` was only ever used on this page, so nothing else is affected. Hydration logic is untouched: `go()` still pulls the target slide plus one ahead, and reverse wrapping from slide 1 back to slide 21 hydrates correctly.

### Bespoke Baby Gallery rebuilt as a mixed media wall (31/07/2026)

**73 tiles: 43 customer photos + 9 customer videos + 21 existing Memory Catcher clips**, shuffled together in one wall. Order is randomised once at build time with a FIXED SEED (20260731), so the mix looks varied but does not reshuffle between deploys.

- **LAYOUT DECISION - square photos, NOT all-portrait.** Ryan asked whether everything should be portrait for consistency. Measured the cost across all 43 photos: a square crop keeps **72%** of the original frame, a 9:16 portrait crop keeps **57%**. Worst case `jon-ford-image.jpg` (4000x2252) keeps only **32%** as portrait against 56% as square. 26 of the 43 are landscape, so all-portrait would have mutilated the majority to match the minority. Instead the SQUARE is the grid unit: photos sit 1x1, videos span TWO rows. Grid items stretch by default, so a video tile is exactly two rows plus the gap tall and keeps its native 9:16 with zero crop. Consistent module, no destructive cropping, and the double-height tiles mark themselves out as video before anything moves.
- **Masonry replaced with CSS Grid.** The page used `column-count`, which cannot do row spanning. Now `repeat(4,1fr)`, dropping to 3 at 900px and 2 at 600px.
- **VIDEO OPTIMISATION to the Memory Catcher spec: 274MB -> 5.1MB.** All nine at 576x1024 to match Ashley's clips, **audio stripped entirely** (muted is mandatory for autoplay; stripping the track rather than muting saves the bytes too), speed-ups 1.5x to 2.0x, capped at 620kbps. Average 578KB against the 416KB benchmark. `salamata-bah-video.mp4` was 3m33s / 156MB - 57% of all video weight on its own - cut to an 8s window from 1:18 at 2x on Ryan's instruction, now 444KB. A 350x reduction. `gabbi-goldfarb` left at normal speed, at 3s a speed-up would have made it a blink.
- TWO ENCODING ERRORS CAUGHT IN TESTING: `-t` was placed after the speed filter so it limited OUTPUT not INPUT and every clip came out double length (fixed by moving `-ss`/`-t` before `-i`); and `jon-ford` landed at 3.4MB against a 416KB benchmark, so a bitrate ceiling was added rather than letting one grainy handheld clip carry eight times its neighbours' weight.
- **IMAGES: 121MB -> 3.8MB** at 1000x1000 WebP q80, average 91KB. Resolution raised from the portal's 800px so ONE set serves the wall, its lightbox and the upload portal. `bb-01..bb-21` deliberately kept pinned to the same photos as the portal set so those references did not silently change meaning; the 22 new ones are `bb-22..bb-43`.
- **PRIVACY: 24 of the 43 carried GPS coordinates** (up from 8 of the first 21 - the second batch was worse). All metadata stripped, orientation baked in first. Neutral filenames, mapping kept privately.
- **AUTOPLAY POLICING.** Thirty autoplaying clips would flatten a phone. Two IntersectionObservers: one hydrates `data-src` at 400px rootMargin, one plays only what is on screen at 25% threshold and pauses everything else. `preload="none"` throughout. Honours `prefers-reduced-motion` by never starting playback. **First-paint media payload is ~376KB against a 17.4MB full wall.**
- **THE 13 OLD `gallery-*` IMAGES WERE NOT DELETED.** Ryan asked to "get rid of the existing", but those files are referenced by **20 other pages** - all 15 blog posts, `/our-kit`, `/blog`, `/premium-frames` and the component library. Removed from THIS PAGE's feed only; files left on disk untouched. Deleting them would have broken 20 pages.
- Lightbox extended to handle video (pauses and releases its source on close). Feed schema is now `{type:"img"|"vid", src, poster?, alt}` - the webhook contract for the upload portal needs updating to match.

### Consent wording widened (31/07/2026) - was a live gap

The step 8 tick read "I consent to you sharing my uploads on your socials." That covers social media and NOT a permanent gallery on a commercial website, which is what `/bespoke-baby-gallery` is. Publishing customer photos there was not covered by what customers had actually agreed to.

Now reads: "I'm happy for you to share my photos and videos on your website and social media." with a sub-line "You can ask us to remove them at any time." (UK GDPR: consent must be withdrawable, and saying so plainly is both compliant and reassuring.)

NOTE FOR DIXIT: the Supabase column is still `social_consent` and the payload key still `socialConsent`. Left as-is deliberately - renaming touches the function, the schema and any existing rows. Worth knowing the name now under-describes what it covers.

OPEN: the 43 photos already prepared for the gallery were collected under the OLD wording. Ryan to confirm whether those parents were asked separately, or whether the wall should launch with a subset.

### Gallery automation spec written (31/07/2026) - GALLERY-AUTOMATION-SPEC.md

Ryan's call: no gating, no screening step. Content publishes automatically and the wall is reviewed after the fact, with individual items corrected or pulled in Supabase. Spec written to that brief.

TWO FAULTS IN THE EXISTING BUILD THAT THE SPEC HAS TO SOLVE:

1. **`status` cannot double as gallery state.** It is the submission lifecycle (`pending|complete|failed|purged`) and it drives the purge interlock. Gallery publication needs its own `gallery_state` column or the two will collide.
2. **`upload-portal-purge.js` would have silently emptied the wall.** It deletes `social_photo_path` and `social_video_path` once `downloaded_at` is set and the cutoff passes. A gallery pointing at those paths would lose its photos on a rolling basis, weeks after they went live, with no error anywhere. Fixed architecturally: derived gallery media goes to a SEPARATE public `gallery` bucket, originals stay in the private `upload-portal` bucket and stay purgeable.

Spec covers buckets, schema, the Supabase webhook plus row-claim guard against double-processing, `sharp` settings for images (metadata dropped by default - do NOT add `withMetadata()`), the exact ffmpeg recipe with the three gotchas that cost time today (`-ss`/`-t` before `-i`, `-an` mandatory for autoplay, `-maxrate` mandatory or one grainy clip runs 8x its neighbours), automatic cut parameters by source length, nightly build hook rather than per-upload rebuilds, and the takedown path.

Recommended order: schema and bucket, then images end to end, then the build hook - which alone delivers a self-filling photo wall. Video last, in a background function, since standard Netlify Functions time out at 10s and will not transcode a 30MB phone video.

- **BUG FIXED - lightbox showed the image and the video side by side.** Reported by Ryan 31/07. ROOT CAUSE: `[hidden]` gets `display:none` from the browser's UA stylesheet, but `shared/styles.css` declares `img{display:block}`, and author rules beat UA rules. So `lbImg.hidden = true` did nothing whatsoever and the image never went away. `<video>` has no equivalent element rule, so it hid correctly - which is why the symptom was an image ALWAYS on screen with the video appearing next to it on video items. Fixed with `.bbg-lb [hidden]{display:none}` (specificity 0,2,0, beats the bare `img` at 0,0,1, no `!important` needed). Also now releases the image `src` when switching to a video, mirroring what already happened the other way.
- AUDITED THE SAME TRAP SITEWIDE: five other pages toggle `.hidden` in JS (`blog`, `franchise`, `our-kit` x2, `upload-portal-form`). Every one targets a `div`, `button`, `p` or `input`, and `shared/styles.css` only sets `display` on `img`, so none of them are affected. No further action.
- NOTE: this is the THIRD time today the same class of fault has appeared - a property arriving from a rule that was not accounted for (`aspect-ratio`/`object-fit` cascading from `.upf-tile img`, the HTML `height` attribute defeating `aspect-ratio`, and now `img{display:block}` defeating `[hidden]`). Worth treating `shared/styles.css` element selectors as a standing hazard when writing page-level overrides.

### Google Analytics + consent added sitewide (31/07/2026)

Wix is gone, so there is no CMS backend reporting traffic. GA4 `G-L1J1KR2VZZ` now on all 50 pages.

- **Built as `shared/analytics.js`, NOT an inline snippet on each page.** 50 hand-maintained static pages with no templating means an inline gtag block would be 50 copies of the measurement ID to keep in step. One file, one place to change it, and it makes the tag machine-checkable.
- **CONSENT MODE v2, not a plain gtag snippet.** Ryan asked for GA plus a small cookie banner. Pasting the standard snippet and adding a banner would have made the banner decorative - GA would already have fired and written its cookie before the visitor saw the bar. Instead `analytics_storage` defaults to `denied` BEFORE the GA library loads, and flips to `granted` only on accept. gtag still loads and sends cookieless pings, so modelled traffic data survives a decline. This also means the banner does not need rebuilding when we refine it.
- Banner injected by the same file, BFC palette, decision stored in `localStorage` under `bfc-consent` with a `VERSION` field so everyone can be re-asked after a policy change.
- `window.bfcConsent.get()` / `.set()` plus a `bfc:consent` event exposed so the **Meta Pixel on `/our-kit` and `/addons` can be brought under the same banner later without rework. IT IS NOT UNDER IT TODAY** - the Pixel fires regardless of what the visitor chooses. Ryan's standing position has been to run it unbannered; worth revisiting now a bar exists, because a banner that governs one tracker and not another is harder to defend than no banner at all.
- **`scripts/check-analytics.js` added and wired into the Netlify build command.** Fails the deploy if any page is missing the tag, warns if it is not first in `<head>`. A written README rule gets forgotten; a failing build does not. Verified by deliberately stripping the tag from `faq.html` - exit code 1, correct page named - then restoring it.
- Own bug caught during that test: the checker counted the analytics `<script>` tag itself as a script preceding it, so all 48 pages reported a false ordering warning. Now measures from the start of the tag rather than the `src` path inside it.
- README updated with the mandatory rule, the enforcement note and the regeneration checklist.
- **The new build check earned its keep within minutes of being written.** Running the build sequence regenerated `sitemap.html` from `scripts/sitemap-template.html`, which had no analytics tag, and `check-analytics` failed the build immediately. Without it, `/sitemap` would have shipped untracked and nobody would have noticed. Tag added to the template.
- **DAY-ONE REGRESSION NOW CLOSED.** While in the template, ported the two fixes flagged on 30/07 that it would otherwise have reverted on the next deploy: the nav "Order Your Kit" CTA class (`nav-menu-order`, used on 0 pages, back to `nav cta on-dark` which is used on 43) and the responsive `.sm-hero p` `clamp()`. Verified by regenerating and checking the output.
- **Consent banner reworked to the Twine Growth pattern (31/07), reskinned to BFC.** Ryan supplied `consent.js` from Twine as the reference. Three things in it that the first BFC version was missing, one of which was a compliance gap:
  - **A way to change your mind.** UK GDPR requires withdrawing consent to be as easy as giving it, and the original had no route back once decided. A "Cookie settings" link is now injected into `.foot-legal` on every page, plus a `data-open-consent` hook so it can be placed manually anywhere (e.g. the privacy policy page).
  - **Escape declines rather than dismissing.** Prevents a state where the banner has gone but no choice was recorded.
  - `open()` and `reset()` on the public API.
- Reskinned to the BFC palette: white panel, `#DDD6CE` hairline, black filled Accept against an outlined Decline, both the same size (ICO position: declining must be exactly as easy as accepting). Twine's dark panel and orange primary do not belong on this site. Instrument Sans throughout. Privacy link points at `/privacy-policy`, not Twine's `/privacy`.
- Kept from the first BFC version and not in the Twine file: the `VERSION` field for re-asking after a policy change, the timestamped JSON record rather than a bare string (useful if consent ever has to be evidenced), and the `bfc:consent` event.
- Held it in `shared/analytics.js` rather than splitting into a second file as Twine does. Twine splits because its homepage inlines its own stylesheet; BFC has no such constraint, and one file means one script tag and one thing for `check-analytics.js` to verify.
- HARDENED: Google's own snippet writes `function gtag(){dataLayer.push(arguments)}`, relying on window properties being globally addressable. True in a browser, but it breaks under any stricter scope and cannot be exercised outside one. Now `window.dataLayer.push(arguments)` explicitly.
- Verified headlessly both ways: a first-time visitor gets `consent default` denied plus the banner; a returning visitor who accepted gets `default` then `update -> granted` and no banner.

### /our-kit moved onto the ranking product URL (31/07/2026)

**The redirect was running the WRONG WAY.** Line 94 of `_redirects` sent `/product-page/foil-handprint-footprint-kit-baby-keepsake` -> `/our-kit` 301, so cutover would have moved the site's best-ranking URL onto a new one. A 301 does pass equity, but moving an established URL carries transition risk where leaving it carries none. It is also the better URL semantically: `foil-handprint-footprint-kit-baby-keepsake` is keyword-rich, `our-kit` carries nothing. Reversed.

- `/product-page/foil-handprint-footprint-kit-baby-keepsake` now **serves** the page (200). `/our-kit` 301s to it.
- **CHAIN AVOIDED:** `/category/all-products` and `/our-kit.html` both 301'd to `/our-kit`. Once `/our-kit` also redirected, those would have become two-hop chains, which Google handles poorly. Both repointed directly. Audited afterwards: zero chains in `_redirects`.
- **231 internal links across 45 pages** repointed, so no internal click takes a redirect hop. The link checker's own "points at a 301 source" warning then caught 4 more in `scripts/sitemap-template.html` that the page-level sweep had missed, because that file regenerates `sitemap.html` on every build.

**FILE SPLIT.** Ryan: affiliate pages must strictly keep NO header or footer. The product page must have both. Same file could not do both, so:
- `our-kit.html` = integrated version with site chrome, served at the product-page URL.
- `keepsake-standalone.html` = untouched copy of the old standalone. Serves `/memory-catcher/*` (affiliate pages) and ships separately to `keepsake.thebespokefoilcompany.co.uk`.

**CHROME GRAFT WAS NOT A SIMPLE MARKUP SWAP.** `our-kit.html` does not load `shared/styles.css` at all - it is a fully standalone ads page with 196 of its own selectors. Loading the shared sheet wholesale collides on **73 selectors** including `.hero`, `.gallery`, `.badge` and `.card-btn`. Instead only the chrome rules were lifted out (header, nav overlay, footer, announce bar): 65 rules plus 4 media blocks, 9.2KB against 45KB for the whole sheet, colliding on only 6 selectors - all of them elements being replaced anyway. Appended AFTER the page's own styles so it governs those. First extraction attempt was contaminated because it pulled whole media blocks containing unrelated rules; redone filtering inside each query.

**SEO INHERITED EXACTLY.** Title taken verbatim from the live Wix page rather than invented: "Foil Hand & Footprint Kit Baby Keepsake | Capture Precious Moments". Canonical repointed to the product URL.
- PRE-EXISTING BUG FIXED: the page's canonical said `/our-kit` while its `og:url` said `keepsake.thebespokefoilcompany.co.uk`. Those contradicted each other.
- `/keepsake-standalone.html` 301'd so the raw file cannot be crawled and indexed as a duplicate.
- Edge function comments updated; they still described `/our-kit` as the indexed template.

OPEN: meta description was not recoverable from the fetched page. Worth Ryan pulling it from Wix SEO settings before cutover so nothing is lost.

### Chrome graft on the product page - FIXED after Ryan reported it broken (31/07)

Ryan's screenshot showed a wrecked header (duplicated CTA text, an unstyled black triangle where the button arrow should be, and the nav overlay's Memory Catcher cards rendering inline at the top of the page) and a centre-aligned footer. Three separate faults in my extraction, all mine:

1. **CSS COMMENTS WERE BEING SWALLOWED INTO THE SELECTOR CAPTURE.** The harvest regex `([^{}]+)\{` grabs everything since the last `}`, which includes any `/* comment */` sitting above a rule. The keep-test then examined the comment rather than the selector, so **every chrome rule with a comment above it was silently dropped** - 12 of them, including `footer`, `.nav-menu`, `.nav.cta`, `.announce` and `.burger`. Missing `.nav-menu{position:fixed}` is why the overlay rendered inline. Fixed by stripping comments before harvesting.
2. **`.cta` and `.sq` were never in scope.** The chrome selector list matched things like `header`, `.nav-`, `.foot-`. The header's button is `.nav.cta` but its base styling lives on plain `.cta` and `.cta .sq`, neither of which starts with a chrome prefix. So the arrow SVG rendered at natural size as a black triangle. Added as button primitives.
3. **Footer text stayed centred because of an undeclared property.** The standalone page's own `footer{...}` rule sets `text-align:center`. The chrome `footer` rule sets background, colour, size and padding but never declares `text-align`, so the page's own value kept cascading. **Same class of fault as the three found this morning.** Fixed properly by removing the page's own header/footer-scoped rules entirely (25 of them) rather than patching one property, since those rules style markup that no longer exists.

Rebuilt from `keepsake-standalone.html` (the pristine copy) rather than patching the broken output. Verified by a different method afterwards: extracted every class used in the header, nav overlay and footer markup and checked each against the page's own stylesheet. 43 classes, all styled. `.mlogo` is the only bare class with no rule, and it has none in `shared/styles.css` either, so it is unstyled on every page and not a fault.

Also caught: rebuilding from the standalone copy reintroduced 5 `/our-kit` links that the earlier sitewide sweep had already fixed. The link checker's "points at a 301 source" warning caught them.

### Product page header/footer round 2 (31/07, Ryan's screenshot)

- **CART REMOVED SITEWIDE, 44 pages.** No JavaScript was ever bound to it on any page - it was a dead affordance implying a basket flow that does not exist. Checkout happens directly on the kit page.
- **Header CTA removed on the product page only.** A header button pointing at the page you are already on is noise. Left in place everywhere else.
- **SPACING.** The site header is `position:absolute; top:44px`, so it OVERLAYS content. This page carried `padding: 56px` on `.hero`, sized for its old in-flow header, so the eyebrow sat under the logo. Announce bar 44px + header ~76px = ~120px of overlay. Now `clamp(132px, 9vw, 168px)`.
- **ALIGNMENT - moved the PAGE onto the site grid, not the header onto the page.** The site grid is `max-width:1280px; padding:0 40px`, used by `.nav-row`, `.foot-legal` and `.bbg-wrap`. This page was built standalone on `1180px/24px`, which puts its content 34px inside the logo and burger at every viewport width. The header is shared by 50 pages and 1280/40 is the established grid, so this page was the outlier. `.hero`, `.steps-head` and `.faq-grid` moved.
- **RESTING HEADER SEPARATOR restored.** Ryan remembered a subtle shadow under the light header and it had gone. Cause: the site header is fully transparent until `.scrolled` is added, at which point it gains a background, a hairline and a shadow. That is correct on a dark-hero page - there is nothing to separate from at the top - but this page is light all the way up, so at scroll position 0 the header had no edge whatsoever. The old standalone header solved it with `background: var(--porcelain)` plus a `border-bottom` hairline. Restored as a softer version of the scrolled treatment so it does not read as a solid bar.
- MISTAKE MADE AND CORRECTED IN THE SAME PASS: first concluded `header.scrolled` declared no `box-shadow` and added one. It does declare one - the earlier diagnostic truncated the rule at 120 characters and I read the truncation as the whole thing. Reverted before it could override the correct value with a fainter one. The actual gap was the RESTING state, not the scrolled state.

OPEN FOR RYAN: the resting separator is scoped to this page. 27 pages carry `light-scope`; if they have the same edgeless header at the top of the page, this should probably be promoted into `shared/styles.css` under `.light-scope header` rather than repeated.

### REGRESSION I CAUSED AND FIXED - media queries flattened on the product page (31/07)

Ryan reported the "What's Included" lightbox photo rendering wrongly at both widths. Not a lightbox problem: **when I rebuilt `our-kit.html` I destroyed every media query in the page's own stylesheet.**

CAUSE: the rule-harvesting regex `([^{}]+)\{([^{}]*)\}` matches the rules INSIDE an `@media` block but discards the `@media` wrapper. Reassembling from those matches promoted **all 22 of the page's responsive blocks to base level**, so mobile rules applied at desktop and, with duplicates now at equal specificity, the last one in the file won everywhere. `.inc-photo img` ended up permanently at `aspect-ratio:16/9` (the small-screen value) instead of `1/1.1` above 720px, which is exactly the symptom Ryan saw.

This affected the WHOLE page's responsive behaviour, not just the lightbox. The lightbox is simply where it was visible enough to spot.

FIX: rebuilt again from `keepsake-standalone.html`, this time walking `@media` blocks as units - stripping unwanted rules from inside each one while keeping the wrapper intact. 22 of the page's own blocks preserved, plus 8 from the grafted chrome. Verified by checking that `.inc-photo img` now has `16/10` at base, `1/1.1` inside `@media (min-width:720px)` and `16/9` inside `@media (max-width:719px) and (max-height:700px)`, matching the pristine copy.

ALSO CAUGHT IN THE REBUILD: the grafted header markup came from a snapshot of `premium-frames.html` taken BEFORE the sitewide cart removal, so it silently reintroduced a cart button. Removed, then swept sitewide again - which found two more stragglers in `franchise-bio-ashley-eccleston.html` and `scripts/sitemap-template.html` that the first pass had missed (the template regenerates `sitemap.html` on every build, so that one would have kept coming back).

LESSON: any regex that reassembles CSS from rule matches will silently flatten media queries. Parse blocks as units.

### Trustpilot figures centralised (31/07/2026) - 65 -> 72

The score and count were hardcoded into the markup of **46 pages, 98 separate values**. Moving 65 to 72 meant 98 edits, and the `aggregateRating` schema on the product page had already drifted out of step with the visible copy - which matters, because Google requires structured data to match what is on the page and a mismatch is a manual-action risk.

Now `shared/trustpilot.js`: **two constants at the top of one file**. It populates every `[data-tp-score]` and `[data-tp-count]` placeholder, and rewrites any JSON-LD `aggregateRating` on the page from the same two values, so schema can never drift from visible copy again. Server-rendered fallbacks stay in the markup so the numbers are still right with JavaScript off.

**WHY IT IS NOT FULLY AUTOMATIC.** Ryan asked how to make this update itself. Three routes, only one free:
1. **Trustpilot's own TrustBox widget** - free, live, self-updating forever. Renders THEIR design, not ours. Right choice anywhere the exact look does not matter; wrong for the custom hero and footer treatments.
2. **Trustpilot Business API** - keeps our design AND updates automatically, but it is a **paid add-on**. Confirmed in an earlier session that SEO widgets and the API sit behind paid tiers on the free plan.
3. **Scraping the public profile at build time** - TESTED AND REJECTED. `uk.trustpilot.com` returns bot detection on automated fetches, and the search index was still reporting 65 a month after the fact. Not viable.

So the number stays manual, but manual in one place with a `CHECKED` date beside it rather than scattered across 46 files.

NOTE: three pages (`keepsake-standalone`, `premium-frames`, `print-quality-guarantee`) use a different footer markup shape (`.f-tp-u` rather than `.tp-meta`) and needed handling separately. Worth knowing there are two footer variants in circulation.

### Footer credit changed to Twine Growth (31/07/2026)

`Website by My Wix Designer` -> `Website by Twine Growth`, linking to `https://www.twinegrowth.com`. 44 pages plus `scripts/sitemap-template.html` (which regenerates `sitemap.html` on every build, so missing it would have left one page crediting MWD indefinitely). Zero `mywixdesigner` references remain.

Added `target="_blank" rel="noopener"` - the old link had neither, so it navigated away from the site in the same tab. `rel="noopener"` is standard practice on any `target="_blank"`.

LEFT AS A FOLLOW-FOR-RYAN: the link is dofollow, so every page of this site passes link equity to twinegrowth.com. That is 44 sitewide footer links from an established domain, which is fine and intentional between two businesses he owns, but sitewide footer links are the pattern Google scrutinises most closely for manipulation. Worth being aware of rather than acting on.

- **Header overlapping the hero text (31/07, Ryan).** The base `.hero` padding I set earlier was being overridden by `@media (min-width:920px){.hero{padding-top:72px}}`, which I had missed. 72px was correct for the OLD standalone header, which was `position:relative` and sat in flow. The site header is `position:absolute` at `top:44px` and ~76px tall (16 + 44 burger + 16), so it ends at 120px, and 44 + 72 = 116px put the content **4px underneath it**. Because the header is semi-transparent with a `backdrop-filter`, the overlap rendered as BLURRED text rather than hidden text, which is why it read as a rendering fault rather than a spacing one. Desktop override now 128px, giving 52px clearance; mobile stays at the 132px floor for 56px. Checked the rest of the page for other `padding-top` overrides that could clash - only `.nav-menu-cta`, unrelated.

### Social links wired (31/07/2026) - Dixit QA item

The Facebook and Instagram icons were present in the markup on 45 files but every one was `<a href="#">`. Not missing, dead. **92 dead links wired.**

- Facebook: `https://www.facebook.com/TheBespokeFoilCompany`
- Instagram: `https://www.instagram.com/thebespokefoilco/`

Both URLs were already live in `keepsake-standalone.html`'s `.f-social` block, so Ryan's Instagram URL was verified against what the site already used rather than taken on trust. Targeted by `aria-label` rather than position, so Facebook and Instagram could not be swapped. All get `target="_blank" rel="noopener"`.

Covered `scripts/sitemap-template.html` too, which regenerates `sitemap.html` on every build - missing it would have left one page with dead icons reappearing after every deploy.

The bio page carries TWO social blocks: `.bio-social` (the Memory Catcher's own) and `.foot-social` (site footer). Both now point at the company accounts, which is right for Ashley as founder. **FLAG FOR RYAN: when other franchisees get bio pages, `.bio-social` should almost certainly carry THEIR accounts, not the company's.** Worth deciding before Salamata's page is built.

ONE DEAD ANCHOR LEFT SITEWIDE: "Forgot password?" on `franchisee-login.html`. Left deliberately - that page has no auth backend at all and is on Dixit's list, so the link has nowhere to go until the login flow exists.

### Light-page header separator promoted sitewide (31/07, Ryan's call)

Moved from a page-scoped rule on the product page into `shared/styles.css` as `.light-scope header`, so all 27 pages carrying that class get it from one place. `.light-scope header.scrolled` keeps the stronger scrolled treatment on top.

`our-kit.html` needed the rule INLINED as well: it deliberately does not load the shared sheet (73 selectors would collide), so the shared rule cannot reach it. Commented on both sides so they stay in step. Also given the `light-scope` class, which it did not carry.

`keepsake-standalone.html` deliberately excluded - it keeps its own in-flow header with a real `border-bottom`, so there is no overlay and nothing to separate.

### Gallery consent - Ryan's decision, recorded (31/07)

The 43 customer photos were collected under the previous "share my uploads on your socials" wording, which did not cover the website. **Ryan's decision: launch all 43.** Recorded here so the basis is documented if it is ever queried. The consent copy has since been widened, so anything collected from 31/07 onwards is covered for both website and social.

- **STRUCTURAL BREAK FOUND AND FIXED on `our-kit.html`.** While rolling out the light-page header separator, verification showed the page had **an unclosed `<style>` block**: a `</script>` sat where `</style>` should have been, immediately before `</head>`. Introduced during one of the earlier chrome-graft passes. Browsers auto-recover from this, which is why every screenshot still rendered and nothing looked wrong - but the document was invalid and everything after the style tag was technically inside it. Repaired, and every page audited for the same fault: all balanced.
- Worth noting HOW it was found. A previous script reported "inlined into our-kit's own stylesheet" without checking its own result, and the replace had silently no-opped because the target string did not exist. Adding a read-back assertion after the write is what surfaced it. **Scripts that mutate files should verify, not report.**

### Branded 404 page built (31/07/2026)

`404.html` did not exist. The Memory Catcher edge function rewrites unknown or inactive slugs to `/404.html`, and every unmatched path on the site fell through to **Netlify's generic grey box with a link to their support docs**. That is what Ryan hit on `/memory-catcher/ashley-eccleston`, and it was happening on every 404 sitewide, not just that one.

Built on the standard light-page chrome: nav overlay, header, footer, `light-scope` so it picks up the resting header separator. Routes out to the kit, the homepage, and six useful pages, so a lost visitor has somewhere to go rather than a dead end.

- **`noindex, follow`.** Netlify serves this file with a real 404 status for unmatched paths, so the status code does the work; the meta tag is belt and braces. `follow` is deliberate - the outbound links should still be crawled.
- **Kept out of the sitemap.** No `_redirects` entry was added, so `generate-sitemaps.js` (which reads live 200 routes) never sees it. Verified: 0 occurrences in `sitemap.xml`. Netlify's own convention serves `404.html` from the publish root without needing a route.
- Passes `check-analytics` (it is now page 50 in that scan) and the link checker.

CAUGHT DURING THE BUILD: the chrome markup came from a snapshot taken earlier today, so the new page arrived carrying **a cart button, two dead `href="#"` social links, "65 reviews", the My Wix Designer credit and five `/our-kit` links** - every one of which had already been fixed sitewide. The link checker's "points at a 301 source" warning flagged the last of those. All brought up to date before shipping. **Any page built from that snapshot in future needs the same sweep.**

STILL OPEN, SEPARATE ISSUE: the affiliate 404 itself. The edge function relies entirely on Supabase since the hardcoded fallback slugs were removed at go-live step 5. On the `adorable-khapse` test deploy it is almost certainly missing `SUPABASE_URL` / `SUPABASE_ANON_KEY`, since env vars do not travel with a deploy. The function logs both failure modes, so one look at the Netlify function log will confirm.
- **404 fixes (31/07, Ryan).** Two things missing: the Trustpilot announce bar and a visible header shadow. The announce bar was never in the chrome snapshot I built the page from, and `header{top:44px}` is positioned specifically to sit under it - without it the header floated 44px down over nothing. Added. The shadow rule WAS applying correctly; it was simply too faint to read, because `rgba(240,239,236,.72)` over a `--bone` page is effectively the same tone and the `-14px` spread killed what was left. Strengthened to `0 1px 0 rgba(16,14,12,.07), 0 2px 14px -8px rgba(16,14,12,.16)`, matching the precedent already on `franchise-bio-ashley-eccleston.html`. Applied in `shared/styles.css` and our-kit's inline copy together.

### Order CTAs repointed to the product page (03/08/2026, Ryan)

Ryan: no anchoring on the home page, Order Your Kit should land on the product page.

**33 links repointed in total, and 30 of them were completely dead.** Only the home page has an `id="order"` section, but **29 other pages carried `href="#order"`** - a bare fragment with no matching element, so clicking Order Your Kit on the blog, gallery, contact, our-story, all 16 blog posts and 10 others simply did nothing. Not a wrong destination: no destination. That is a significant conversion leak and it was invisible to the link checker, which validates paths rather than fragments.

Also fixed the Tommy's Charity CTA on the home page, which was `href="#"` while `/tommys-charity` exists.

Covered `scripts/sitemap-template.html` as well, since it regenerates `sitemap.html` on every build.

**LEFT IN PLACE, NEEDS A DECISION:** the `#order` section itself is still on the home page - kit selector, three prices, two pay buttons. Nothing links to it now, so it is only reachable by scrolling. It also contains `#expressPay` and `#cardPay`, which have never had any JavaScript bound to them (this is the "Buy Now not working" QA item). Options: remove the section, or leave it as a product showcase with its buttons repointed at the product page. Ryan to decide.

### Checkout extracted to a shared module, home page now sells (03/08/2026)

Ryan: the home page takes a lot of direct traffic and should allow an impulse purchase without a page hop. Built as **one shared module used by both pages**, not a copy - prices live in markup `data-price` attributes and the SKU map in code, so two copies would mean two places for a price to drift, discovered only when someone is charged wrongly.

`shared/checkout.js` (27KB): drawer markup, drawer CSS and all Stripe logic. Extracted VERBATIM from the product page; the only changes are that values which used to come from that page's scope now arrive through config:

```
BFCCheckout.init({ getKit, getQty, setQty, getPersonalisation?, getAffiliate?, maxQty?, triggers })
```

- **Home page**: `#expressPay` and `#cardPay` previously fired `alert('Design preview: Stripe Payment Element mounts here')`. They now open the real drawer. Quantity is drawer-only (no stepper on that page), personalisation defaults to `{mode:'later'}`, which matches the section's own copy about choosing colours later.
- **Product page**: inline checkout removed, drawer markup removed, now calls the same module with its own personalisation and Memory Catcher affiliate wiring.
- `MAX_QTY` and the kit display names moved INTO the module so the two pages cannot disagree on either.
- `return_url` was hardcoded to the site root, which would have bounced a product-page buyer to the home page after paying. Now returns to whichever page the purchase started from.

**THREE REAL BUGS THE TEST HARNESS CAUGHT** (jsdom, not by reading):
1. The module hard-referenced `#checkoutBtn` and `#stickyGo`, which do not exist on the home page - it threw and halted the entire module on load. Triggers are now config-driven and missing ones are skipped with a warning.
2. `names[...]` and `MAX_QTY` were outer-scope references that survived extraction and threw at drawer-render time.
3. A regex rebinding `qty` corrupted the string literal `cd-qty` into `cd-cfg.getQty()`, and broke the object shorthand `qty,` into invalid syntax.

**VERIFIED, and the limits of that verification.** Both configurations were run in a real DOM (jsdom): drawer injects, CSS injects, triggers wire, `create-payment-intent` is called with the correct SKU, qty, affiliate and personalisation, the summary renders the right kit name and totals, and switching kit changes the SKU. **What could NOT be verified: an actual Stripe payment.** No card taken, no Apple Pay render, no address reaching ShipStation, no webhook fired. That needs test keys in a browser and is Dixit's to confirm before this goes live.

LEFT DELIBERATELY: ~32 drawer CSS rules remain inline on the product page and are now duplicated by the module's injected copy. Harmless (identical rules) and removing them is diff noise on an already large change; worth a tidy later.

### Image snag batch - Explore section (26 snags, exported 03/08/2026 17:23)

24 image swaps plus 3 design changes, across `/eco-friendly`, `/foil-fusion-technology`, `/our-story`, `/premium-frames`, `/print-quality-guarantee`, `/tommys-charity`, `/upload-portal`.

**NEW ASSETS RATHER THAN OVERWRITES - this was forced, not a preference.** The snagged slots use assets shared right across the site: `mc-what` appears on **46 pages**, `founders-074` on 22, `gallery-03` on 20, `ff-ashley` on 18. Overwriting any of them would have silently changed images on pages nobody asked about. Worse, there were **direct conflicts**: `inc-framed-hr` is the slot for both snag 02 (wants 459, on eco-friendly) and snag 19 (wants 491, on print-quality-guarantee); `ff-hold` is the slot for both snag 04 (067) and snag 05 (332). Same file, different requested images - impossible to satisfy by overwriting. So every replacement is a new `img-<libnum>-<width>.webp` and only the snagged page is repointed.

- Each replacement is generated at the **exact ratio and width set the original slot used**, so no layout shifts: 900x990 for the `inc-*` slots, 1.50 for the `ff-*` bands, 0.67 portrait for `ff-ashley`, 1.00 square for `gallery-03`, and so on. 50 new files.
- Selectors were resolved with a **real HTML parser** honouring `nth-of-type`, not regex, so each snag hit the element Ryan actually clicked.

**BUG I CAUSED AND CAUGHT:** the first pass swapped by first-match-in-file rather than by resolved element. Snag 24 (`mc-what` -> 088 on the up-band) landed on the **nav overlay's Memory Catcher card** instead, because that is the first `mc-what` in the document. Reverted and reapplied to the correct element. The parser-based verification is what surfaced it - a regex-only check would have reported success.

**DESIGN CHANGES:**
- **[21] `/tommys-charity` `.tc-why`** rebuilt as a two-column grid, image 074 left of the copy, square-cropped so it reads as a portrait rather than a banner. Stacks image-first below 860px.
- **[22] `.tc-cta`** was a flat `--stone` band. Now a full-bleed background photo (435) with a dark gradient scrim and white text, matching the hero pattern used sitewide. Padding raised to `clamp(88px, 11vw, 140px)`. The button was `.cta dark` (dark fill) which would have disappeared into the new dark background, so it is now `.cta on-dark`.
- **[26] `/upload-portal`** heading was `max-width: 14ch`, forcing three lines. Now `22ch`, which lands it on two.

### Snag batch - Franchise, forms and utility pages (exported 03/08/2026 18:22)

The export contained 44 snags but **26 were the same ids already actioned in the 17:23 batch** - the tool exports everything ever logged, not just new entries. Checked by id, not by page, so nothing was re-done or missed. **18 genuinely new.**

**Images (9):** `/find-a-memory-catcher` hero -> 166; `/memory-catcher-enquiry` hero -> 387; `/slot-reservation-form` -> 390; `/upload-portal-thank-you` -> 395 (cropped lower at 42% so more of the handprint shows, as asked); `/franchises/norfolk-west` hero -> 390, band -> 169, enquiry portrait -> 461; `/franchises-bio/ashley-eccleston` join band -> 458; `/sitemap` hero -> UPF.
- 387 is a PORTRAIT source (4221x6331) and first came out 2000x3000 in a landscape hero band. Re-cut to 3:2 before use.

**[17] Ashley's profile photo** was `mc-ashley-1000.webp`, 1000x1500 portrait with her head low in frame under a lot of ceiling. Re-cut from source 461 as a true **square** at 62% of frame width, positioned so her face sits in the upper third. Both asks satisfied: square, and zoomed in.

**Text and layout (9):**
- **[01] `/faq`** - "or call 07506 998934" now breaks onto its own line. The number is wrapped in `&nbsp;` so it can never split across lines itself.
- **[03] `/blog`** search input was `max-width: 440px` inside a 1280px row, leaving a long empty gutter. Now full width.
- **[04] `/franchise-success`** faint logo watermark removed - both the `.fs-mark` markup and its now-dead CSS.
- **[06] `/memory-catcher-enquiry`** "BY BESPOKE FOIL COMPANY" removed.
- **[07]** same page, hero copy sat low because `.mc-hero` was `align-items: flex-end`. Now `center`, with balanced padding top and bottom.
- **[14]+[15] `/franchises-bio/ashley-eccleston`** - **15 supersedes 14** and I followed 15. Ryan first asked for double padding above AND below, then corrected to above only so it matches below. Both sections were already `max-width: 1280px`, so the width already matched; what actually differed was the gutter (18px vs 40px) and the top padding (20px vs 80px below). Now `80px 40px 80px`, with the mobile gutter kept at 18px.

**NOT ACTIONED - [09] `/slot-reservation-form` heading.** The note reads "Make pre-boot farm the fig tree fund, not the script." Wispr Flow has mangled it. "Pre-book Form" is clear, and "not the script" is clear - `.slot-title` is currently `font-family: var(--script)`, the handwritten face. But "the fig tree fund" is ambiguous: it could be **Figtree** (which is in the codebase, though only for `.announce` and already queued for removal) or **Fraunces**, the serif used for every other page title. Those give very different results, so this needs one word from Ryan rather than a guess.

### Snag batch - systemic mobile and header issues (03/08/2026 19:14, zesty-granita deploy)

Seven snags, all systemic rather than one-off.

**[01] BLACK BARS ON THE REPLACED IMAGES - MY BUG, NOW FIXED.** The crop helper computed the target box from the requested ratio but did not clamp it to the source. When a source was NARROWER than the target ratio (portrait source, landscape target) the crop box came out taller or wider than the image, and PIL padded the overflow with black. It was baked into the file, not a CSS problem, which is why it showed at every size. Worst case: `img-444` from a 4467x6254 portrait source forced to 1.50 - a landscape strip of photo floating in black. **26 files affected.** Crop maths rewritten to always trim pixels, never pad, and all 55 ratio-cropped images regenerated. Verified by sampling edge pixels on every generated file, then visually.

**[03] Logo not central on the product page - caused by my own earlier change.** Removing the header CTA from that page left `.nav-right` empty, so the 30px burger on the left had nothing balancing it on the right and the "centred" logotype sat off to one side. Given `.nav-right` a `min-width: 30px` at mobile.

**[04] Burger invisible on the product page.** `.nav-row .burger span` was `background: var(--white)` at mobile, which assumes a dark hero. This page is light to the top, so the burger only became visible once `header.scrolled` kicked in. Now `var(--ink)`.

**[05] Product page body inset from the header.** Below 600px `.nav-row` drops to an 18px gutter but the page's own containers stayed at 40px, so the copy sat 22px inside the logo and burger. Added a `max-width:600px` block matching them all to 18px.

**[06] Portrait images too deep on mobile.** Every portrait container (`4/5`, `3/4`, `1/1.1`, `5/7`) is now `1/1` below 600px, across 7 pages. Roughly a third off the height of each band. Desktop untouched, as asked.

**[07] Two images back to back on mobile.** On `/our-story`, band 1 is text-then-image and bands 2 and 3 are image-then-text, so when they stack you get image immediately followed by image. `.os-band + .os-band.img-left .os-media { display: none }` hides only the second of such a pair. `display:none` rather than markup removal so desktop keeps both.

**[02] LOGO - CANNOT ACTION, NEEDS THE CORRECT FILE.** Ryan reports the old logo has "crept back in". There is only ONE company logo in the repo, `assets/bfc-logo.svg`, it is used by all 138 header and footer references, and it is **byte-identical to the file in Dixit's 03/08 zip**. I have never modified it in either session, so nothing has crept anywhere - whatever is there now has been there throughout. Either the correct version was never in the repo, or it was replaced before this zip was cut. Need the correct SVG from Ryan.

### Logo corrected + full regression audit (03/08/2026)

**The logo artwork was never wrong.** Ryan supplied two files and reported the old logo had "crept back in". Rendered all four variants side by side to check:
- Supplied file 4 vs `assets/bfc-logo.svg`: **the artwork is pixel-identical**. Same viewBox (184.5 x 18.65), same 3 paths, same letterforms. The ONLY difference is the fill token: repo had `#000`, the correct file has `#1d1d1b`, the softer near-black used across BFC print work. At 22px in a header that is essentially invisible, which is why nobody spotted it for weeks.
- Supplied file 6 vs `assets/mc-logo.svg`: **byte-identical, md5 matches.** Already correct.

So nothing crept back. The wordmark has been right all along; a colour token was stale. Applied anyway - `#1d1d1b` is the correct brand value and it should be right in the file, not approximately right.

**REGRESSION AUDIT.** Ryan's real concern was whether other work had silently reverted. Ran 27 checks covering every substantive change logged across both sessions: the branded 404, GA4 coverage and Consent Mode defaults, the consent banner and its reopener, the build-time analytics check, Trustpilot centralisation and the count, the Twine Growth credit, social links, cart removal, dead `#order` anchors, the product-page 200 route and its inherited title, all 43 customer photos and 9 videos, the 73-tile gallery, all three video slots, the shared checkout module on both pages, the light-page header separator, the sitemap template fixes, the widened consent wording, `.gitignore` and `.DS_Store`.

**27/27 intact.** One initially flagged as regressed - the consent wording - turned out to be my check being whitespace-sensitive: Dixit ran `upload-portal-form.html` through a formatter, which put spaces inside the tags. The wording itself is unchanged.

Worth keeping this audit. It is cheap to re-run and it is the only way to know a handover has not quietly undone something.

### sitemap.xml moved to an edge function (04/08/2026, Dixit's call)

Franchise regions and blog posts are being served dynamically from Supabase via edge functions, so they have no files on disk and no lines in `_redirects`. `scripts/generate-sitemaps.js` only reads `_redirects`, so a build-time sitemap would have listed the 39 static pages and **none of the ~128 dynamic ones** - live, crawlable, invisible to search. Dixit chose to serve `sitemap.xml` from a function rather than rebuild daily.

Built as `netlify/edge-functions/sitemap.js`, registered on `/sitemap.xml`.

- **`generate-sitemaps.js` no longer writes `sitemap.xml`.** It now writes `sitemap-static.json` - the same routes, same lastmod, same per-category priorities, as data. This was not optional: a real `sitemap.xml` file on the publish root would win over the edge function claiming that path, and the sitemap would silently revert to the static half only. `sitemap.html`, `robots.txt` and `llms.txt` are unchanged and still built.
- The function merges `sitemap-static.json` with two Supabase reads (`franchise_regions` where available, `blog_posts` where published), de-duplicates on `loc` so a URL cannot appear twice, and emits the same XML shape the build used to.
- Priorities kept aligned with the generator's own table: regions 0.5, posts 0.6.
- Cached an hour at the edge, so a crawler does not trigger a Supabase read per request but a new post still appears the same day.
- **Supabase failure is non-fatal**: if either read fails the function logs it and returns the static routes rather than a 500. Tested - a 500 from `franchise_regions` still yields a valid 39-URL sitemap. A short sitemap is recoverable; an error page tells Google nothing.

Tested with stubbed Supabase and the real `sitemap-static.json`: 41 URLs from 39 static + 2 regions + 1 post, zero duplicates, valid XML, correct content-type, and a null `updated_at` falls back to today rather than emitting an empty `<lastmod>`.

**DEPENDS ON DIXIT'S SCHEMA.** The function assumes `franchise_regions(slug, updated_at, is_available)` and `blog_posts(slug, updated_at, published)`. If the column names differ, three lines need changing. Flagged to him.

### Snag batch - eco-friendly + foil fusion (5 snags, 04/08/2026 11:29)

- **[01] `/eco-friendly` `.eco-better` did not separate** because it had **no background at all** - it sat on the page between `.eco-bone` (porcelain, full-bleed) above and `.eco-keepsake` below, so there was nothing to separate from. Given the bone tone as a CONTAINED card (`max-width:960px`, `margin:56px auto`, rounded) rather than another full-bleed band, so it reads as a separate editorial note in a page that already alternates stone/porcelain bands. Mobile keeps the card but insets it 18px so it never touches the screen edge.
- **[02] press image re-cropped.** `img-444` was cut at 30% down the source, which framed the window and clipped the foil print at the very bottom edge. Re-cut at **62%**, which pushes the window out and brings the foiled footprints and the press into the same frame. Verified visually.
- **[03] the three feature icons were genuinely wrong.** All stroked at 1.6 with `fill:none`:
  - The **star was lopsided** - hand-rounded relative coordinates where the lower-left arm reached `y=21` while the upper arms stopped near `y=8.8`. Replaced with a true pentagram computed from an outer radius of 8.6 and an inner radius at the golden ratio (0.382x), so all five points are equal.
  - **Two overlapping circles** for "Lifetime durability" meant nothing as an outline. Replaced with a shield.
  - Bare tick for "Flawless finish" replaced with a check inside a circle, which reads as finished rather than as a stray mark.
  - Added `stroke-linecap/linejoin: round` - without them the star points render chipped at 22px.
- **[04] mobile hero scrims deepened SITEWIDE**, as asked. Each hero carries two: a `90deg` horizontal for desktop and a `180deg` vertical inside a mobile media query. **Only the mobile ones were touched** - 15 scrims across 14 pages - each stop lifted (roughly +0.14 / +0.16 / +0.10, capped at .80/.78/.92 so the photo is still visible). Desktop unchanged.
- **[05] testimonial photos replaced** with the three files Ryan supplied: **210 Megan, 431 Heather, 372 Charlotte** - matched by eye against the live screenshot, in that order. Cropped to the card's `16/10` so `object-fit:cover` has nothing left to trim.
  - These files are **shared by 4 pages** (`foil-fusion-technology`, `premium-frames`, `print-quality-guarantee`, `component-library`), so overwriting them updated the component everywhere in one go - which is what Ryan asked for. **Deliberately different from the earlier image snags**, where each page needed its own copy because pages wanted different images in the same slot.
  - The old files had **inconsistent ratios** (1.50, 1.40, 1.40). All three are now 1.60, so the cards match. Stale `width`/`height` attributes on `foil-fusion-technology` corrected from 800x533 to 800x500; the other two pages already declared 800x500.

### Snag round - 04/08 afternoon

- **Testimonial component unified.** `foil-fusion-technology` was running an entirely different component (`.ff-tst-card`) from `premium-frames` and `print-quality-guarantee` (`.kb-card`) - which is why replacing the shared images updated the photos everywhere but left the STYLE inconsistent. Ported the `.know-best` / `.kb-card` section verbatim from `premium-frames`: static three-up grid, stone verified tick instead of the green `#00b67a` star, no slider arrows. Removed 15 `.ff-tst` rules, the orphaned `.ff-tst{}` rule and the dead `tstTrack` slider IIFE. Media queries walked as units during the CSS strip so none were flattened.
- **Our Story tiles cut on mobile.** `.os-card` is `aspect-ratio: 3/4`, which at ~500px wide is **660px of height each** - three stacked is most of a phone screen's scroll. Below 600px they are now `16/9`, **281px each, 42% of the previous depth**, with the label scaled to match.

**LOGO - THE FILE IN THIS REPO IS ALREADY THE ONE RYAN KEEPS SENDING.** Checked three ways:
- `assets/bfc-logo.svg` is **byte-identical (same MD5)** to `Bespoke_Foil_Company_x_Memory_Catcher_-_Logo_Files_-_4.svg` as sent today.
- Compared against the **30 July baseline**: the path data is *identical*. The only thing that ever differed was the fill token, `#000` vs `#1d1d1b`, which was corrected on 03/08.
- `bfc-mc-lockup.svg` carries its own copy of the wordmark with different path data, but rendered side by side the letterforms match.

So the artwork in the repo has been the same since at least 30 July, and it matches file 4. If the correct mark is genuinely a *softer serif with rounder corners*, **file 4 is not that file** - it needs a different export from the logo pack. Flagged to Ryan; cannot be actioned without the right file.

**BLACK BARS - not reproducible in this package.** Every `img-*` asset was checked programmatically for symmetrical dark edges (0 found) and the card images inspected visually - clean, and all size variants are ratio-consistent. `.os-card img` and `.kb-photo img` are both `object-fit: cover`, which cannot letterbox. The bars were real on 03/08 morning, caused by the crop-padding bug, and were fixed that afternoon. Most likely the deploy under review predates that fix. Asked Ryan to confirm which build.

### LOGO - Ryan was right, and I was wrong twice. Root cause found (04/08/2026)

I twice told Ryan the logo was correct because `assets/bfc-logo.svg` was byte-identical to the file he sent. **That was true and still missed the point.** Rendering both at high resolution and zooming into the trailing glyph settles it:

- **Deployed** (Ryan's screenshot): **®** - a circled R
- **The file he sent, and the file in the repo**: a circled **"tm"**

Two genuinely different marks. Similar at 22px in a header, which is why a byte comparison of the repo file against the supplied file kept coming back clean - **I was comparing the two correct copies to each other and never once looked at what was actually on screen.**

**ROOT CAUSE: the immutable cache header.** `netlify.toml` serves `/assets/*` with:

```
Cache-Control = "public, max-age=31536000, immutable"
```

`immutable` tells browsers and the CDN the file at that URL will **never** change, so they are entitled to keep it for a year without revalidating. Replacing `bfc-logo.svg` in place on 03/08 could therefore never reach anyone who had already loaded the old one - Ryan included. The fix looked applied in the repo and was invisible in the browser. That is exactly the symptom he kept reporting.

**FIX: cache-busted filename.** Shipped as `assets/bfc-logo-v2.svg`, all **156 references across 48 files** repointed (including `scripts/sitemap-template.html`), and the old `bfc-logo.svg` **deleted** so it cannot be reintroduced or served from anywhere.

`bfc-mc-lockup.svg` was checked too - it carries its own copy of the wordmark, and it renders the circled-tm, so its artwork is already correct.

**LESSON, worth remembering:** any asset under an `immutable` cache header must be replaced by CHANGING ITS FILENAME, never by overwriting it in place. Every other asset in `/assets/` has the same exposure - a like-for-like replacement of any of them will look correct in the repo and stay stale in the browser.

- **Frame collage image swapped (04/08).** Ryan identified the cause of the black edges on that one: **they were baked into library image 530 itself**, not introduced by any crop. Replaced with **067**, a cleaner five-finish frame corner shot on a light background. Cropped to the slot's 3/4 with a 0.62 horizontal bias, chosen from three test positions because a centre crop cut the oak and white finishes out of frame - 0.62 keeps all five with the oak corner as the focal point.
  - Shipped as `img-067-frames-{800,1200}.webp`, a **NEW filename** rather than overwriting `img-530`. `/assets/*` is served `immutable` for a year, so an in-place replacement would never reach anyone who had already loaded the old file. Same lesson as the logo.
  - **067 now appears twice on this page**: the hero (`img-067-2000`, 1.50 landscape, full-bleed behind the title) and this collage tile (0.75 portrait, close crop). Different crops of the same shot, and far enough apart on the page that it should read as intentional - but worth Ryan's eye on a deploy, and a different library image would avoid the question entirely.
  - Alt text improved from "every finish" to naming the five: black, walnut, ash, oak and white.
  - `img-530-1200.webp` is now orphaned. Left in place rather than deleted.

### Snag - Bespoke Difference icons + gift band scrim (04/08, 2 snags)

- **The Bespoke Difference icons.** The four items carried generic stroke glyphs (a shield-check, a globe, a lightbulb and a power symbol) with no relation to their labels. Ryan's reference from the live site shows filled stone discs with white pictograms.
  - **Only ONE of the four was in `assets/icons/`**: `eco-friendly.svg`, the recycling/leaf triangle, which matches "Sustainable Gifting Option" exactly. The `feature-01..04` set in that folder is a different group entirely (hands with a sparkle, a phone with a tick, scissors, sparkles) and belongs elsewhere.
  - Drew the missing three to match the house style precisely - 53x53 viewBox, `#B9A394` filled disc, `#DCD0C8` pictogram, same as `eco-friendly.svg`: `diff-safe.svg` (hands cupping a heart), `diff-premium.svg` (infinity), `diff-fusion.svg` (sphere with meridians). Rendered and checked against the reference before wiring.
  - Applied on **both** pages carrying the strip - `premium-frames` and `print-quality-guarantee` - as Ryan asked, 8 icons total. Inline SVG replaced with `<img>` referencing the asset files, so the set is now shared rather than duplicated in markup.
- **Gift band scrim** was a flat `rgba(16,14,12,.62)`, leaving the copy competing with a busy photo. Now a vertical gradient at `.72 / .80 / .86`, darkest where the text sits.

### CACHE BUST - the black bands were never a crop bug (04/08/2026)

Ryan reported the Our Story cards still showing black bands above and below on desktop, after I had twice confirmed the files were clean. **Same root cause as the logo: the immutable cache header.**

On 03/08 morning I generated the `img-*` set with the crop-padding bug, which baked black bars into the files. That afternoon I fixed the maths and **regenerated them in place, under the same filenames**. `/assets/*` is served `Cache-Control: public, max-age=31536000, immutable`, so the CDN and every browser that had already loaded the broken versions kept serving them - for a year. The repo was correct and the browser was stale, exactly as with the logo, and my file-level checks kept passing because the files really were fine.

**FIX: every regenerated asset versioned.** 71 `img-*` files plus the 6 `test-*` testimonial images (also overwritten in place, on 04/08) renamed with a `-v2` suffix and all references updated. Verified: zero references without `-v2`, zero missing files.

**RULE, now proven twice in two days:** under an `immutable` header an asset can only be replaced by CHANGING ITS FILENAME. Overwriting in place is invisible to anyone who has already loaded the page, and no amount of checking the repo will reveal it.

### Snag batch - eco-friendly + Tommy's Charity (5 snags, 04/08 13:30)

- **[01] `.eco-better`** card now runs the full 1280px body width as asked, with the copy inside capped at 760px via `.eco-better > *` so the lines do not become unreadably long across a full-width box.
- **[02] `.tc-cta` text was still dark.** I set `color: var(--white)` on the section when I rebuilt that band, but **the page's own `.tc-cta h2` and `.tc-cta p` rules sit later in the stylesheet at equal specificity and reset it to `--ink`**. Later wins. Fixed at source rather than adding another override.
- **[03] `tc-who` image squared** - was 1400x1000 (1.40 landscape) beside a text column. Re-cut square from source 112 so the two columns balance.
- **[04] `.tc-who-inner` was `max-width: 900px`** and **[05] `.tc-why` was `1080px`**, against the site grid of 1280px. Both corrected - that is why the copy on this page never lined up with the rest of the site.

### Tommy's Charity rebuilt on the shared band pattern (04/08/2026)

Ryan: the layout still did not match the rest of the site - an over-long image in "Who are Tommy's?" and a family photo and sign-off presented differently from every other page. He pointed at `/our-story` as the reference.

**Root cause: this page never used the shared component.** It had two bespoke layouts:
- `.tc-who-inner` - `max-width: 900px`, `grid-template-columns: 1fr 1fr`
- `.tc-why` - `max-width: 1080px`, `grid-template-columns: 380px 1fr` (a FIXED narrow image column, which is why the family photo looked stunted next to a full-width text block)

Neither matched the site's 1280px grid or the `.os-band` pattern every other content page uses. Widening them earlier fixed the gutters but not the underlying structure, which is why it still looked wrong.

**Rebuilt both sections as `.tc-band`, a direct port of `.os-band`**: `max-width:1280px`, `padding: 0 40px`, `1fr 1fr` above 920px, `gap: 72px`, `align-items: center`, `.tc-media` at `aspect-ratio: 4/5` with `object-fit: cover`, `.img-left` swapping the order, and the same mobile behaviour (`1/1` below 600px, image first). All the old `.tc-who*` / `.tc-why*` rules removed, media queries walked as units so none were flattened.

Also aligned the sign-off: `.tc-sign .sign-name` was 28px ink; `/our-story` uses the script face at 38px in `--stone-text` with the role in `--ink-faint`. Matched, and the 72px bottom padding dropped since it now sits inside a band rather than a full-width section.

### Dynamic franchise regions + blog BUILT (04/08/2026)

Dixit deployed and found no dynamic code. He was right: the previous session settled the architecture over five rounds of questions but never produced any code. Built now - see `DYNAMIC-PAGES-NOTES.md`.

Two edge functions (`franchise-region.js`, `blog-post.js`), two templates, full Supabase schema with RLS, and a seed file carrying all 112 regions and 1,482 postcodes generated from the CSV with coordinates merged from `regions.json`.

Rendering is **server-side at the edge**, not client-side, which was the whole point of the earlier discussion: social scrapers do not run JavaScript, so meta and Open Graph injected in the browser would leave every region and post sharing one link preview. A slug with no row returns a **real 404 status**, not a 200 with 404 content.

Routing: `/franchises/*` and `/post/*` splats to the templates. **16 hardcoded post routes plus the single region route removed**, and the 16 static post pages and one built region page deleted - they would have been a second crawlable copy of the same content. Both templates 301'd so they cannot be reached directly.

Tested against stubbed Supabase and the real templates: hits render with zero leftover placeholders and correct structured data; misses and malformed slugs both return 404; Ricos rich text flattens to paragraphs; the map iframe receives the right slug.

**NOT DONE, flagged in the notes:** the region LISTING page and the blog LISTING still read their static arrays. Detail pages are dynamic, indexes are not.

### Home hero crossfade (05/08/2026)

Ryan: eight images from the library on a slow, premium crossfade, and heavily optimised because it is the first thing that loads on the busiest page.

Slides in order: **196, 253, 390, 184, 338, 421, 169, 097**.

- **All cropped to a single 16:9**, so the framing never shifts during a dissolve. A set of mixed ratios would visibly jump on every transition.
- **Timing: 4s per slide, 1.6s dissolve.** Deliberately far slower than a normal UI transition - a 300ms fade reads as a slideshow, 1.6s reads as a film cut. Asked for delicate, not fast.
- **WEIGHT - the important bit.** Only the first slide loads eagerly (`fetchpriority="high"`); the other seven are `loading="lazy"`. **First paint costs 52KB, against 95KB for the single static hero it replaces** - so the page now starts LIGHTER than before despite carrying eight images. All eight together are 563KB, and they only arrive as the rotation reaches them.
- Encoded at q72 rather than the usual 82: the hero sits behind a 72% dark scrim, so fine detail is invisible anyway and every KB is first-paint cost on the busiest page.
- **The next slide is decoded one beat early** via `img.decode()`, so a fade never begins against an undecoded image and stutters.
- **Pauses when the tab is hidden** - a backgrounded tab should not be decoding images nobody is looking at.
- **`prefers-reduced-motion` never starts the rotation** and disables the transition; the first slide simply stays. Verified: with the query matching, the active slide is still index 0 after 4.2s.

Tested in a real DOM (jsdom): 8 slides present, exactly one carries `.on` at rest, the first is eager and the rest lazy, and after 4.2s the active slide has advanced to index 1.

`hero-196-*.webp` is still used by `/eco-friendly` and the component library, so it stays.

- **Hero crossfade was static on deploy - my CSS never landed.** The insert used `s.replace('</style>', ...)` on `home.html`, but **home.html has no `<style>` block at all** - it takes everything from `shared/styles.css`. There was no `</style>` to match, so the replace was a no-op, and the script printed a success line without checking its own result. The markup and JS shipped; the CSS did not, so all eight images stacked with no opacity rule and the page looked static.
  - **Third time this pattern has bitten in three days**: a script reporting rather than verifying. Fixed here by asserting on a read-back of both files afterwards.
  - Rules now live in `shared/styles.css`, **scoped to `.hero-fade`, never bare `.hero-bg`** - a single-image hero inheriting `opacity: 0` would render blank. Only `home.html` uses `.hero-bg` today, but the scoping means a future page cannot be broken by it.
  - `shared/*` is cached for a week, so the `?v=` query on the stylesheet link was bumped; without that the fix would not reach anyone who had loaded the site in the last seven days.
  - **Verified properly this time**: real `home.html` with the real stylesheet inlined into jsdom, checking COMPUTED styles - slide 0 at opacity 1 and slide 1 at 0 initially, then flipped after the interval fires. Not just "the file contains the text".

### Snag batch - 05/08/2026 14:37 (16 snags, 14 actioned)

[01] was the hero crossfade, already built. [15] is a note that the slot form will use the same Stripe checkout when wired - no action.

- **[09] Foil Fusion Technology™ - 50 missing trademarks across 33 files.** Swept sitewide with a regex that skips URLs, `href` and `data-page` values so no link was corrupted. Verified afterwards: zero prose occurrences left unmarked, zero attributes touched.
- **[02] review stars.** The single "verified" glyph was the same lopsided hand-rounded star found on the feature icons - its lower-left arm reached y=17.5 while the upper arms stopped near y=6.8. Replaced with **five** true pentagrams (outer radius 10.2, inner at the golden ratio) on all three pages carrying the component: `foil-fusion-technology`, `premium-frames`, `print-quality-guarantee`. Three reviewers each.
- **[03]** "Bespoke" in The Bespoke Difference now set in the handwritten face, sized up 1.45em and nudged 3px down so the baseline sits level with the sans around it. Applied on both pages with the strip.
- **[14] RESOLVED A 5-DAY-OLD AMBIGUITY.** "fig tree" was **Figtree**, not Fraunces. `.slot-title` is now Figtree semi-bold, colour unchanged. This was flagged as unclear on 31/07 and left rather than guessed - the guess would have been wrong.
- **[05]** upload portal image -> **483**. **[06]** franchise hub feature tile now carries image **390** filling the right third, full-bleed to the tile edge, hidden below 700px rather than squeezing the copy.
- **[07]** memory catcher hub mockup was capped at `max-width: 300px` (250px below the next breakpoint), which is why it sat small. Caps removed, image scales to the gutter.
- **[08] + [10]** region cards and Memory Catcher cards were `--porcelain` on a `--porcelain` page, so they sat flat. Both now white with a soft lift shadow.
- **[12] + [13]** the "Memory Catcher" lockups were the script FONT, so they carried no trademark. Both now use the real SVG - `mc-logo-white.svg` on the dark enquiry hero, `mc-logo.svg` on the slot form - sized to match the type they replace.
- **[11]** contact: phone forced onto its own line with a non-breaking space so the number cannot split, plus a **WhatsApp button** between the lede and the form. Number `447506998934` taken from the `wa.me` link already used on the upload portal rather than invented.
- **[16]** "real earning potential" now semi-bold in `--stone-text`, the accent already used for links and signatures.

**HELD - [04] the Bespoke Difference icons.** Ryan said he would upload the exact SVGs alongside these snags; they were not in this batch. The three I drew on 04/08 are still in place. Waiting on the files rather than redrawing again.

### Real icons supplied + snag batch (05/08 15:12, 10 snags)

**[01] The four Bespoke Difference icons are now the supplied files**, replacing the three I drew on 04/08. Ryan sent five: `safe-mess-free`, `eco-friendly`, `last-forever`, `foil-fusion`, `parent-community`. Mapped by label - Safe & Mess-Free, Sustainable Gifting, Always Premium (infinity), Exclusive Foil Fusion (overlapping circles with a helix). **`parent-community` is unused so far** - it does not correspond to any of the four labels, so it is in `assets/icons/` waiting for wherever it belongs. Installed with `-v2` filenames so the immutable cache cannot serve my drawn versions; those three deleted.

- **[02] the doubled circle.** The `.ic` wrapper drew its own stone disc AND the supplied SVGs each contain one, so two circles stacked and the inner one sat visibly off-centre. Wrapper reduced to a plain sizing box. Applied on both pages carrying the component.
- **[03]** "Bespoke" script bumped 1.45em -> 1.62em.
- **[04]** Tommy's "Who are Tommy's?" band boxed as a white card with a soft shadow, matching the carded components elsewhere.
- **[05]** upload portal sign-off: "Ryan / Co-founder" -> "Ashley & Ryan / Co-founders".
- **[06]** bio contact buttons. "Send Me a Message" now goes to WhatsApp (`wa.me/447506998934`, the same number as `/contact`) with a filled white WhatsApp glyph, colour unchanged. "Email Me" had **no `.sq` block at all**, which is why it rendered shorter than the button above; it now has one with a mail icon and matches.
- **[07]** "What I Offer" used the **same heart** as "Your Local Baby Memory Catcher" directly above it. Now a gift icon. Took three attempts to land because the path was split across two source lines, so every single-line pattern missed it.
- **[08]** `.bio-join-inner` was `max-width: 1280px` INSIDE the section's 40px padding, while `.bio-body` is `1280px` INCLUDING its padding - so the join band ran **80px wider** than the body above. Now 1200px, which matches.
- **[09]** Ashley's card photo was `object-position: center top`, framing low on a portrait source in a 4/3 box. Now `center 28%`.
- **[10]** "View profile" was unboxed text, so it read as floating. Outlined pill with a hover state, matching the ghost buttons used elsewhere.

### Missing card/foil option on the add-ons app (05/08/2026)

**White Card | Rose Gold Foil** was absent from the add-ons app. The FAQ already promises the full matrix - "Card colour: Black or White", "Foil colour: Gold, Silver, or Rose Gold" - so all six combinations should exist and one was missing.

**It was in TWO places, and fixing only one would have been worse than leaving it.** `addons/index.html` holds the dropdown list, and `functions/addons-create-payment-intent.js` holds an identical list used to **validate the customer's choice server-side**. Add it to the dropdown alone and the new option would appear, be selectable, and then fail at payment. Both updated and verified byte-identical afterwards.

**The upload portal was already correct** - its `cardFoil` select carries all six.

**FLAGGED, not changed: the two systems name the same combinations differently.**

```
upload portal : White card / Rose gold foil     (slash, sentence case)
add-ons app   : White Card | Rose Gold Foil     (pipe, title case)
```

Harmless while they are separate systems. It becomes a real problem the moment an order flows from one to the other, or if anyone reports across both - the strings will not match and the same choice will look like two different products. Worth normalising before launch, but it is a data decision rather than a snag, so it is left for Ryan.

- **Email Me button - the icon was there, CSS was hiding it (05/08).** I added the `.sq` block with a mail icon in the previous round and it never appeared, because `.bio-actions .cta.ghost .sq { display: none }` already existed on the page. That rule was defensive - written when `.ghost` had no icon at all - and I did not check for it before adding one.
  - **That rule was also the size difference.** The `.sq` block is what sets the button's height, so hiding it made Email Me shorter than Send Me a Message. Both symptoms Ryan reported had the same single cause.
  - Now `display: grid` with a transparent fill and a hairline border, so the icon reads on the outlined button rather than sitting in a stone tile like the dark one.
  - **Verified with computed styles**, not by reading the markup: both buttons now report `padding: 7px 7px 7px 18px` and a visible `.sq` containing an SVG. The markup was already correct last time, which is exactly why checking it proved nothing.

### Franchise hub feature tile - 50% image with a gradient fade (05/08/2026)

- Image column **33% -> 50%**, copy padding raised to match so the text still clears it.
- **The hard edge replaced with a `mask-image` gradient**, not an overlay. An overlay gradient would have to match the card's white exactly, and would show as a visible band the moment that background changes; a mask fades the image itself to transparent, so it dissolves into whatever is behind it.
- **Image recut.** The original was cropped 0.62 for a 33% column; at 50% that over-cropped top and bottom. Now 0.80 and **biased right (0.72)** on purpose - the left of the image sits under the fade, so the subjects need to be on the right where they stay fully opaque.
- **Fade length chosen by rendering it, not by guessing.** The first attempt reached full opacity at 46%, which washed out half the photo and left the second woman as a ghost - the point of going to 50% was to show more image, not less. Tightened to `transparent 0%, .45 at 12%, opaque from 30%`.
- Degrades safely: without `mask-image` support the image simply renders with a hard edge, which is exactly the current live behaviour rather than a break. Both `-webkit-mask-image` and standard `mask-image` declared.

### Snag batch - 05/08 16:26 (3 snags)

- **[01] `/franchise-region`** now has a "View regions on a map" button under the search row, linking to `/memory-catcher-region-map`. Placed there deliberately so it reads as the alternative to searching rather than a stray link.
- **[02]** `.mc-find-cta` was `border-radius: 999px` - a full pill, where the site standard is `var(--r-btn)` (10px). My mistake from the previous round; corrected.
- **[03] UGC reel added to the home page**, directly above the Trustpilot reviews section as asked.
  - Built on the **same pattern as `.mc-videos` on `/franchise`**: infinite marquee, portrait `9/16` tiles, edges masked so items enter and leave rather than popping, track duplicated in the markup so the loop is seamless at `-50%`. Pauses on hover.
  - **24 unique tiles: 15 video, 9 photo** - 9 customer clips, 6 Memory Catcher clips and 9 customer photos from the Bespoke Baby Gallery, shuffled on a fixed seed so the order is stable between builds.
  - **The 9 customer videos had no posters**, so each tile would have been a black box until it decoded. Generated with ffmpeg, then recompressed to 300px wide - they only ever display at 248px.
  - **Nothing loads until scrolled to**: videos carry `data-src` with `preload="none"` and hydrate through an IntersectionObserver, photos are `loading="lazy"`. Verified in jsdom - 30 videos, all with `data-src`, **zero with `src`** before scroll. Full weight if every clip plays is 7.5MB, none of it on first paint.
  - `prefers-reduced-motion` swaps the marquee for a static swipeable rail.
  - CSS went into `shared/styles.css`, not a page `<style>` block - home.html has none, which is what silently broke the hero crossfade earlier today. Stylesheet `?v=` bumped to 12.
  - **Caught during verification**: I wrote the photo paths as `bb-XX-v2.webp`, but only `img-*` and `test-*` were versioned in the cache-bust - the `bb-*` gallery photos never were. All nine would have 404'd.

### Sitemap fixes + Ashley upload spec (05/08/2026)

**Ryan noticed pages had disappeared from the sitemap page. He was right, and there were two separate faults.**

1. **Blog posts and franchise regions had vanished from `sitemap.html`.** When both went dynamic their `_redirects` lines were removed, and that page is built from `_redirects` only - so 16 posts and every region silently dropped off the human-readable sitemap. `sitemap.xml` was unaffected because the edge function pulls them from Supabase. The generator now queries Supabase for both and renders "Stories" and "Franchise Regions" sections, skipping gracefully with a logged line when credentials are absent so a local build still works.
2. **`cssVer` was hardcoded at `'v=10'`** in the generator while every other page had moved to v=12. `sitemap.html` was requesting a stylesheet version nothing else on the site used, and would have drifted further on every future bump. Now read from `home.html` at build time so it cannot drift again.

Also added `/gallery-upload` as a util route so Ashley's upload page appears under Utility Pages on the sitemap and does not get forgotten.

**`GALLERY-UPLOAD-SPEC.md` written.** Ryan confirmed consent is handled (largely Ashley's own footage, verbal consent in person) and that the existing nightly rebuild is fine, so neither is in scope. The spec's critical point is formats: **iPhones shoot HEIC and `.mov` by default**, `sharp` throws on HEIC without libheif, and the ffmpeg recipe assumes `.mp4`. Unhandled, a large share of her uploads fail silently - and the spec is explicit that failures must surface in the UI rather than the file just disappearing.

### Sitemap rebuilt from local data + build-time guard (05/08/2026)

Ryan was right that the previous fix did not work, and the reason matters: **I made the generator query Supabase, but Supabase is not populated yet**, so it logged one line and emitted nothing. 112 regions and 15 posts still absent. A build must never depend on a remote service being populated in order to produce a complete sitemap.

**Now read from LOCAL data**, which already existed in the repo:
- `regions.json` - 112 regions with names and links
- `data/blog-posts.json` - **new**, 15 posts recovered from the baseline pages before they were deleted, cross-checked against the baseline `_redirects` (15 routed, 15 recovered, none missing)

Folded into the grouped set before rendering, so they reach **all four outputs**: `sitemap.xml` (via `sitemap-static.json`), `sitemap.html`, `robots.txt` and `llms.txt`. **150 URLs total.**

**`scripts/check-sitemap.js` added and wired into the build.** It fails the deploy if:
1. a 200 route points at a file that does not exist
2. a non-excluded route is not linked from `sitemap.html`
3. any region in `regions.json` or post in `data/blog-posts.json` is missing
4. an HTML file exists that no route points at

Proved it fails: stripping the regions out of `sitemap-static.json` produced `112 of 112 franchise regions missing` and exit code 1. This class of failure has now happened twice silently; it cannot happen a third time without breaking the build.

**Full audit run.** 36 pages, 43 routes, 150 sitemap URLs. Everything not on the sitemap is explicitly excluded and correct: the two locked add-ons pages, the component library, the franchisee login, the map embed, the snag tool and the two upload-portal form endpoints. `404.html` has no route by Netlify convention. **The product page IS present** and was already there - `/product-page/foil-handprint-footprint-kit-baby-keepsake`, listed under Explore as "Foil Hand & Footprint Kit Baby Keepsake" and again in the footer as "Order Your Kit".

### gallery-upload.html built for review

The route existed but the page did not, hence the 404. Built as a front end only - **it validates and previews locally and sends nothing**, so Ryan can approve the interface before Dixit wires the pipeline.

Mobile-first: one column, large targets, safe-area padding for the notch. Tap-to-choose with multi-select, drag-and-drop on desktop, thumbnail per item, optional caption that becomes the alt text.

**It flags HEIC and .mov on sight** rather than letting them fail later, and failures render as a red row with the reason. The one thing this tool must never do is silently drop a file - Ashley would assume it worked.

### Deploy failure and the fix (05/08/2026)

`check-sitemap.js` failed the Netlify build on 16 orphaned files - the static blog pages and the old region page. **The check was correct; the cause was a merge artefact.** Those files were deleted from the package on 04/08, but **copying a zip over a repo applies additions and edits and never deletions**, so the new scripts landed while the removals did not.

Two changes:

1. **Orphan detection downgraded to a warning.** Blocking a deploy over an unreferenced file is the wrong trade - it is untidy, not harmful. The three checks that matter stay fatal: a route pointing at a missing file, a non-excluded route absent from `sitemap.html`, and any of the 112 regions or 15 posts missing. Verified both ways - warns and exits 0 with legacy files present, still fails with `112 of 112 franchise regions missing` when the data is stripped.
2. **16 legacy 301s added**, and this is the part that actually mattered. `/post-<slug>.html` is crawlable at its literal path; left alone it is a duplicate of the live `/post/<slug>` URL with no canonical, which splits ranking signals silently. Harmless when the files are absent - the rules never match.

`DEPLOY-FIX-05-08-2026.md` written with the `git rm` list. **`post-template.html` and `franchise-region-template.html` must stay** - they are what the edge functions render into.

- **Gallery upload page layout broken on first build (05/08).** The drop zone rendered as three overlapping boxes with the label text cut off. Cause: **`.gu-drop` is a `<label>`, which is `display: inline` by default, and I never declared a display.** An inline box containing block-level children fragments across line boxes, and each fragment draws its own border and radius - which is exactly what the screenshot showed. One line: `display: block`.
  - Same class of mistake as the Email Me button and the hero crossfade: writing CSS for an element without checking what it already computes to. Verified this time with **computed styles in jsdom** - `.gu-drop` reports `block`, the file input reports `none`, the queue rows report `grid`.
  - Also drove the file handler with stubbed files to check the validation actually fires: HEIC and `.mov` flagged as "will be converted", a 300MB file and a PDF both rejected with visible reasons, and the caption field only rendered on accepted rows.

### Sitemap restructured + auto-update chain closed (05/08/2026)

- **Utility Pages moved to position one** so the internal tools are reachable without scrolling.
- **Franchise Regions (112) and Stories (15) moved out of the main grid** into their own full-width bands below it, each separated by a rule and set in **three columns** (two below 900px, one below 560px). They were turning the page into a single very long scroll. Each band shows a count pill so the size is obvious at a glance.
- **Supabase-first with a local fallback.** `generate-sitemaps.js` now queries Supabase for regions and posts and falls back to `regions.json` / `data/blog-posts.json` when it is unset, unreachable, or **returns nothing**. That last case is deliberate: an empty table almost always means "not seeded yet", and treating it as "the site has no pages" is exactly what produced a sitemap missing 127 URLs on 05/08. Tested all three paths - live returns Supabase rows, empty and 500 both fall back to 127 local entries with the reason logged.
- `SITEMAP-HOW-IT-UPDATES.md` written, answering Ryan's question: `sitemap.xml` updates per request via the edge function, `sitemap.html` on the next build, and a new static page needs one `_redirects` line and nothing else.

### "View Upload Portal" button added to the hero (06/08/2026)

Ryan: customers search specifically for the upload portal, land on `/upload-portal`, and the ones who have lost their QR code have no way onward - they message Ashley instead.

**Confirmed: the page had ZERO links to `/upload-portal-form`.** Every other page in the site links to `/upload-portal` (the explainer) and none link to the portal itself, so a customer who arrived on the explainer genuinely had nowhere to go. Added `.cta on-dark` under the hero copy.

Verified with computed styles: inside `.up-hero-inner`, immediately after the paragraph, `inline-flex`, carrying the `.sq` arrow, and using the `on-dark` variant so it reads on the dark hero.

**NOTE FOR RYAN:** the same gap exists elsewhere. `/contact`, `/our-kit`, `/franchise`, `/bespoke-baby-gallery` and the region template all mention the upload portal and link to the explainer, but none link to the portal itself. Whether that is right depends on whether the portal should be reachable without a QR code at all - a deliberate decision rather than an oversight, so it is flagged rather than changed.

### Kit comparison band added to both product pages (06/08/2026)

Dropped in directly after the Foil Fusion band on `our-kit.html` and `keepsake-standalone.html`, kept black as Ryan asked so the two dark sections read as one continuous statement before the FAQ lightens the page again. 10 comparison rows, 20 tick/cross marks, identical on both.

**Three things the draft needed before it could go in:**

1. **Class scoping.** It used bare `.inner`, `.lede`, `.accent` and `.foot` inside the band - all of which exist on the host pages. Renamed to `.kc-inner`, `.kc-lede`, `.kc-accent`, `.kc-foot`. Checked before inserting: **zero collisions** on either page afterwards.
2. **A stale `/our-kit` link.** The draft's CTA pointed there, which is now a 301 source. The link checker caught it.
3. **The CTA pointed at the page it sits on.** "Shop the Kit" linking to the product page made sense on a standalone draft; inside the product page it is a link to nowhere. Now a `Choose Your Kit` button that opens the same checkout drawer as every other buy control, falling back to scrolling to the kit selector if the drawer is not ready.

`--ink` is `#000000` in the draft, in `shared/styles.css` and on both pages, so the band is black exactly as drawn.

Verified structurally on both pages: band present, 11 rows, 10 labels, sits after `.fusion` and before `.faq`, no stray unscoped classes, JS clean, style tags balanced.

### UGC reel added to the product pages (06/08/2026)

Same component as the home page, sitting directly above the Trustpilot band on `our-kit.html` and `keepsake-standalone.html`. 24 unique tiles duplicated for the loop, 15 video and 9 photo, identical to home.

**The gallery CTA is deliberately omitted**, per Ryan: this is a product page and the point is to keep people on it. The `.ugc-cta` rule ships unused, which is harmless and keeps the CSS identical to the shared copy.

**The CSS had to be INLINED, not inherited.** Neither product page loads `shared/styles.css` - 73 selectors would collide - so the `.ugc` rules could never have reached them from there. This is the same trap that made the hero crossfade ship dead: the markup and JS would have been present and the section would simply have rendered as a stack of untiled images. Commented on the page so the two copies stay in step.

Verified with computed styles on both: reel sits above `.reviews`, 48 tiles, `9/16` ratio, 248px wide, marquee animation running, **30 videos all carrying `data-src` and none carrying `src`** - nothing loads until scrolled to.

**NOT added elsewhere.** Only `foil-fusion-technology.html` also has a `.reviews` section, and it is an explainer rather than a product page. `premium-frames` and `print-quality-guarantee` use the `know-best` testimonial block instead and have no `.reviews` band to sit above. Flagged for Ryan rather than assumed.

### Trustpilot reviews levelled up across the site (06/08/2026)

Ryan spotted the home page carrying only a handful of reviews where the product page has the full set. Audited every reviews component:

| Page | Before | After |
|---|---|---|
| `our-kit` | 56 | 56 |
| `keepsake-standalone` | 56 | 56 |
| `home` | **6** | **56** |
| `foil-fusion-technology` | **6** | **56** |

The component is byte-identical across all four - same `.reviews` / `.review-track` / `.review-card` structure, same card shape, same nav arrows. Only the list was short, so the fix was replacing the card block rather than porting anything.

**Checked the 56 are genuinely distinct before propagating**: 56 cards, 56 unique reviewer names, 56 unique card markups. Not a marquee duplicating a smaller set. Verified in a real DOM afterwards on all four pages - every card inside `.review-track`, nav arrows intact, articles balanced.

**`premium-frames` and `print-quality-guarantee` deliberately untouched.** They carry `know-best`, the PHOTO testimonial component (Megan, Heather, Charlotte), which is a different thing entirely - and their only Trustpilot mention is the announce bar in the header, not a reviews band. There is nothing on those pages to extend.

No weight cost: the extra cards are text plus the shared `tp-stars-5.svg`, which every page already loads.

### UGC reel: one source of truth (06/08/2026)

Ryan named the component and set the convention - one version, updated everywhere, reshuffled whenever fresh content lands.

**The problem it solves:** the reel was hardcoded into THREE pages (`home`, `our-kit`, `keepsake-standalone`). Adding a clip meant editing all three by hand and hoping they matched. They would not have stayed matched for long.

Now `data/ugc-reel.json` is the only place content lives, and `scripts/build-ugc-reel.js` renders it into every page carrying a `.ugc-track`, as the first step of the build.

**The shuffle is seeded from the item list**, which gives exactly the behaviour asked for:
- same items -> same order every build, so unrelated deploys produce no diff noise
- add or remove anything -> the whole reel reshuffles

Uses mulberry32 rather than `Math.random()` deliberately: a random shuffle would rewrite three HTML files on every single build and fill every diff with churn.

**Missing assets fail the build.** A tile pointing at a file that is not there renders as a blank box and goes unnoticed for weeks, so it is an error not a warning. Tested: adding a non-existent path produced `FAILED - assets missing`.

The surrounding markup is left alone, so `home` keeps its gallery button and the two product pages keep their no-button variant. Verified all three carry an identical 48-tile order afterwards, with the CTA difference intact.

`UGC-REEL-HOW-TO-UPDATE.md` written for Ryan - add files, add JSON lines, deploy. Includes the ffmpeg one-liner for posters and a note that `our-kit` and `keepsake-standalone` carry an inlined copy of the reel CSS because neither loads `shared/styles.css`.

### Performance made a build rule, not a habit (06/08/2026)

Ryan: the reel should always be as optimised as it is now. Turned that from something I have to remember into something the build enforces.

**First, fixed what was already over.** Every `mc-*` poster was **576px for a 248px tile** - more than 2x DPR needs. Resized all 21 to 300px at q70 under `-v2` filenames (immutable cache), and repointed the references. **867KB -> 368KB, 58% saved.** The reel's own poster load went from 435KB to **283KB**. Those posters are shared with the `/franchise` reel, which renders at the identical 248px, so both pages benefit.

**Then added a weight budget to `build-ugc-reel.js`:**

| Asset | Budget | Over budget |
|---|---|---|
| Photo tile | 300KB | **fails the build** |
| Video poster | 80KB | **fails the build** |
| Video clip | 1400KB | warns only |

Photos and posters are fatal because at a 248px render size the extra bytes are pure waste. Videos only warn - a heavier clip can be a fair trade, and they are lazy-loaded below the fold either way.

**Proved it works**: added a 4000px, 1.7MB camera-roll-style JPEG and the build stopped with `1724KB (budget 300KB) - tiles display at 248px, 1000px wide is plenty`. That is the exact failure mode this guards against, since a straight phone photo is 3-5MB and would otherwise ship unnoticed.

Current load: **283KB of posters up front, 922KB of photos lazily, 7.5MB of video only if a clip actually plays.**

### UGC reel expanded from 24 to 66 tiles (06/08/2026)

Ryan sent `Archive.zip` - 41 videos and one HEIC, 201MB. Not UGC in the strict
sense: roughly 30 are properly shot brand films (1920x1080, two at 4K), the
genuinely handheld material is the nine WhatsApp clips and two iPhone files.
Content now spans four things it did not before: Ashley at the foil press, the
packaging process, families taking prints at home, and finished keepsakes filmed
by customers.

**House spec, measured rather than assumed.** Probed all 30 existing clips first:
576x1024, h264, yuv420p, silent, 106-1060KB. The `mc-` series sits at exactly
8.08s and 24fps across sixteen of them, which is the "sped up" feel Ryan was
describing. Every new encode targets that.

**Two calls Ryan made before encoding**, both expensive to redo across 41 files:

| Decision | Choice | Why it mattered |
|---|---|---|
| Landscape to portrait | **Centre-crop all** | 38 of 41 sources are 16:9 going into a 9:16 tile - a centre crop discards ~68% of frame width |
| Long clips | **Cap speed at 2x, trim the rest** | Sources run 3.4s to 42.8s; speeding a 42.8s clip into 8s is 5.35x and looks frantic |

Duration rule implemented as: `d <= 8s` left alone at natural length;
`8 < d <= 16s` sped by `d/8`; `d > 16s` sped 2x on a **centred 16s window**.

**The encoder verifies rather than reports.** Each output is probed back and
asserted on dimensions, absence of an audio stream, duration within 0.6s of
expected, and both budget ceilings. Posters step `-q:v` up from 4 until under
78KB rather than assuming q4 lands there. One file (`bfc-25`) came back with
empty dimensions from a run that was killed mid-write - the assertion caught it,
a success line would not have.

**Naming:** `bfc-01` to `bfc-30` for the brand and product films, `bb-vid-10` to
`bb-vid-20` continuing the existing customer series, `bb-44.webp` for the photo.
No collisions with existing assets, so no cache-busting suffix needed.

**Result:** 41 clips, all 576x1024, all silent, avg 377KB video and 15KB poster.
13.1MB added. Reel went 24 -> 66 items (56 video, 10 image), regenerated into
`home`, `keepsake-standalone` and `our-kit`. `bespoke-baby-gallery.html` verified
**byte-identical to baseline** - Ryan was explicit this content is reel-only.

Full chain green afterwards: 150 sitemap URLs, 1457 internal links resolve, 36
pages carry analytics.

**Open:** heading still says "Real families, real keepsakes", which no longer
covers the behind-the-scenes half. Ryan is choosing a replacement. The build
leaves surrounding markup alone, so that is a manual edit on three pages.

**Flagged:** `bfc-08` is a leaflet with a QR code rather than a keepsake - the
weakest tile in the set and the obvious first cut if the reel needs trimming.
Alt text left empty on the new videos to match the existing 24; worth a pass if
accessibility comes up.

### Reel performance: two real bugs found after shipping 66 tiles (06/08/2026)

Ryan asked whether the expanded reel would hurt loading speed, particularly on
the product page. It would have. Measuring rather than reassuring turned up two
problems, one of which I introduced and had called "not alarming" an hour
earlier.

**1. Posters were downloading on page load. All of them.**

`preload="none"` governs video data ONLY. A real `poster` attribute is an
ordinary image fetch that happens as soon as the element renders, regardless of
viewport. Confirmed against MDN and web.dev: only `loading="lazy"` defers a
poster, and the reel did not have it.

So the reel was pulling **865KB of posters on every load** of home, the product
page and the affiliate page, for a section at 68% down the product page. It was
283KB before the new clips, which is why it had never been noticed.

Fixed by emitting `data-poster` and letting the observer promote it. Eager cost
is now **zero bytes**. The build asserts no real `poster="` survives on any page,
so it cannot silently regress.

`loading="lazy"` on `<video>` would work natively and is well supported now, but
it also alters `preload` and autoplay behaviour and the reel calls `.play()`
explicitly. Not worth the interaction risk when the observer must exist anyway.

**2. Adding content silently sped the marquee up 2.75x.**

`animation: ugc-scroll 90s linear infinite` is hardcoded, and the animation
travels -50% - one full copy of the track. That duration was only ever right for
the item count it was tuned against.

| Items | Track width | 90s means |
|---|---|---|
| 24 | 6,432px | 71px/s - the tuned speed |
| 66 | 17,688px | **197px/s** |

The build now writes `animation-duration` inline on the track at 3.75s per item
(90/24, the original cadence), so 66 items gives 248s and the original 71px/s.
Inline beats the stylesheet shorthand on specificity, which avoids editing CSS in
three places (`our-kit` and `keepsake-standalone` carry inlined copies).
Reduced-motion still wins: it clears `animation-name`, and a duration alone
animates nothing. Verified the rule is top-level, not inside a media query.

**Also done:**

- **Split the observer in two.** Posters at `rootMargin: 600px`, video at `0px`.
  The old single 300px observer hydrated ~10 clips at once on a wide desktop.
  Now only genuinely visible clips decode, and posters arrive *earlier* than
  before, not later. Play cap of 8 desktop / 4 mobile as a floor.
- **Save-Data and 2G** get posters and no video, via `navigator.connection`.
- **The build now owns the observer script.** It was hand-copied into three pages
  and now carries real logic; three copies would drift for exactly the reasons
  the tiles are already generated. Marked `<script data-ugc-reel>`.
- **`renderLimit`** added to `data/ugc-reel.json`, unset by default. Ships N tiles
  per build from the full pool, same seed, rotating as content is added.

**Verification.** Build is idempotent across three consecutive runs (byte-
identical). Verified with jsdom that the inline duration computes to 248s -
though jsdom did not resolve the stylesheet cascade or custom properties, so the
`.ugc-track` media-query nesting and the `--bone` tile background were checked
directly in the CSS instead rather than assumed from a passing test.

**Net position.** Eager reel cost went 283KB -> 865KB -> **0 bytes**. Because the
marquee speed is restored, the data rate during dwell is unchanged from before
the new clips landed - roughly 2.5MB over ten seconds on screen, 4.2MB over
thirty. Adding content grew the *pool*, not the per-second cost. The one genuinely
new cost is DOM: 112 `<video>` elements per page, up from 30. `renderLimit` is
the lever if that ever matters.

### renderLimit set to 32, with rotation moved into the browser (06/08/2026)

Ryan approved capping the rendered tiles "as long as it's rotating and getting
fresh content". Checked before setting it, and the implementation I had written
would not have met that condition.

**The build-time selection was a frozen subset, not a rotation.** The seed is
derived from the content list, so the same 32 tiles came out of every build.
Proved it: two consecutive builds produced an identical tile hash.

Worse, no build-time seed could fix it. **This is a static site.** A time-based
or random seed only re-evaluates when a deploy runs. Two months without a deploy
means two months of the same 32 tiles and 34 clips nobody ever sees.

**So rotation moved client-side.** The build inlines the full 66-item pool as
JSON next to the tiles, and the observer picks a fresh 32 on every page load.

Why this costs nothing: at the point the script runs, every tile carries
`data-src` and `data-poster` and has fetched nothing at all. Reassigning them is
free. The inline pool is 4.1KB and it replaces more tile markup than it adds.

The rendered 32 are not placeholders - they are correct tiles, so a visitor
without JavaScript still gets a reel, and there is no layout shift during the
swap.

**Two constraints it has to hold, both verified in jsdom rather than assumed:**

| Constraint | Why | Result |
|---|---|---|
| Both halves of the track get the same selection | The marquee animates to -50%; differing copies would visibly jump | identical every run |
| Selection genuinely varies | Otherwise it is the frozen subset again | 61 of 66 distinct clips across 4 loads, 66 of 66 across 12 |

**The test found a real bug.** `window.matchMedia(...)` was called unguarded for
the play cap. In jsdom it threw and took the whole observer with it - rotation
had already run, but no poster was ever promoted, so every tile would have sat
as a bare `--bone` box. Any browser with IntersectionObserver has matchMedia, so
it would probably never have fired in production, but it is a one-line guard
against an entire class of silent failure. Wrapped in try/catch.

**Final per-page cost:**

| | Before the new clips | All 66 rendered | Now |
|---|---|---|---|
| Reel bytes on load | 283KB | 0 | 0 |
| Tiles in DOM | 48 | 132 | 64 |
| Reel `<video>` elements | 30 | 112 | 56 |
| Scroll cycle | 90s | 248s | 120s |
| Clips in rotation | 24 | 66 | **66** |

Pages grew ~10KB each against baseline, less than the ~13KB the all-66 version
cost, despite carrying the pool.

### Reel heading rewritten, and the build now owns it (06/08/2026)

"Real families, real keepsakes" only described half of what the reel now shows.
Replaced with:

> **From our press to your wall**
> The foiling, the packing, the sessions, and what families send us afterwards.

The heading carries the arc, making to owning. The lede does the enumerating,
because that is the part the heading cannot do in five words.

**Moved both into `data/ugc-reel.json`.** They were hand-written into three pages
and were identical in all three, which was luck rather than design - the tiles
and observer are already generated for exactly this reason. Copy changes are now
one line.

The gallery CTA is still untouched: `home` has one inside the reel section, the
two product pages do not. Verified that split is unchanged against baseline. The
build rewrites only the `<h2>` and the `<p class="lede">`.

**A bug I wrote and the idempotency check caught.** The first version guarded the
replacement with `if (head === before) return null` - fail if the text did not
change. That is the wrong assertion. A second build legitimately produces no
change because the copy is already correct, so **the build failed on every run
after the first**. The inverse of the classic failure on this project: instead of
a replace silently matching nothing, I asserted a change where a no-op was
correct.

Fixed by testing whether the *pattern matched* rather than whether the string
changed. Now idempotent across four consecutive runs, and a negative test
(swapping `<h2>` for `<h3>`) still correctly fails the build with exit 1.

`.ugc .lede` is `max-width: 56ch`; the lede is 77 characters, so it wraps to two
lines by design. Only em dash remaining on those pages is inside the Trustpilot
customer review, which is quoted verbatim and left alone.

### The reel tiles were never loading on scroll, and had not been for a while (06/08/2026)

Ryan screenshotted the product page: bone-coloured empty tiles, one image
showing. That one image was an `<img>` with native `loading="lazy"`, which is why
it worked. Every video tile was blank.

**Root cause is a browser limitation, not the logic.** The marquee is a
compositor-driven `transform` animation, and IntersectionObserver does not
reliably fire for elements moved that way - the compositor holds the real
position while the main thread keeps a stale one, so intersection is computed
against where the tile used to be. Mozilla bug 1419339 documents it and notes
that animating `left` instead makes it go away, because `left` is not
compositor-handled. WebKit fixed their version only in 2024.

**This was broken from the day the reel shipped.** It was invisible because
`poster` was a real attribute: every tile had an image whether the observer fired
or not. Deferring the posters this morning removed the mask. So I did not write
the bug, but I did remove the thing hiding it, which amounts to the same thing
from Ryan's side.

It also explains the screenshot exactly. IO fired once at observe() time against
`translateX(0)`, so the first few tiles got posters - but those are not the tiles
the animation had moved into view by the time he scrolled to it.

**The fix: stop observing the tiles.**

| Element | Mechanism | Why |
|---|---|---|
| `.ugc` section | IntersectionObserver, `rootMargin: 200px` | Static, never moves, IO is reliable |
| Each tile | `getBoundingClientRect` on a throttled rAF sweep | Forces a style flush, so always the live animated position |

Sweeps run every 150ms while the section is on screen and stop when it leaves.
rAF rather than `setInterval` so it pauses in background tabs. Every rect is read
before anything is written, or it would thrash layout once per tile.

**An unexpected gain.** `.ugc-viewport` has `overflow: hidden`, and `rootMargin`
only expands the root, never an intermediate clipping ancestor - so the 600px
poster lead time I documented this morning was never actually working either.
`getBoundingClientRect` ignores ancestor clipping, so doing the geometry by hand
delivers lead time IO could not have provided here at all.

**Verified rather than assumed.** Built a jsdom harness that drives
`getBoundingClientRect` itself and physically moves the tiles between sweeps, as
the compositor does. Result: **0 posters at load, 50 of 50 promoted after the
marquee moved them through.** That is the exact behaviour that was failing.

### Heading and lede, final (06/08/2026)

Ryan wrote the final copy himself, keeping the shape of the original heading
rather than my "From our press to your wall":

> **Real families, forever keepsakes**
> Moments captured by parents using our kits, and by Memory Catchers taking
> prints in person across the UK. Plus some sneak peeks of behind the scenes
> with Ashley...

"forever keepsakes" against the old "real keepsakes" is a small change that does
the work - it keeps the line people already know and shifts the second half from
authenticity to permanence.

The lede runs 163 characters against a `56ch` max-width, so roughly three lines.
Flagged to Ryan, left as written.

Note "taking prints **in person** across the UK" - consistent with the standing
rule that Memory Catcher is an in-person keepsake experience and never a class.
Both live in `data/ugc-reel.json`.

### The product page reel: relative paths under a nested URL (06/08/2026)

After the compositor fix, home worked and the product page still did not. Ryan
noticed the distinguishing detail himself: **the photos were loading, the videos
were not.** That is a path problem, not an observer problem.

```
/product-page/foil-handprint-footprint-kit-baby-keepsake  ->  our-kit.html
/memory-catcher/<slug>                                    ->  keepsake-standalone.html
```

Both are served at URLs with **two path segments**, so the browser resolves
relative URLs against `/product-page/`, not `/`.

| Asset | As written | Resolves to |
|---|---|---|
| video `src` | `assets/videos/bfc-11.mp4` | `/product-page/assets/videos/bfc-11.mp4` **404** |
| video `poster` | `assets/videos/bfc-11-poster.jpg` | `/product-page/assets/videos/...` **404** |
| image `src` | `/assets/bb-09.webp` | `/assets/bb-09.webp` **200** |

`data/ugc-reel.json` had the **video entries relative and the image entries
absolute**. Home is served at `/`, where the relative form happens to resolve
correctly, which is exactly why this presented as a product-page-only fault and
survived this long.

Scanned both nested pages for every relative reference: the reel video assets
were the **only** ones. Everything else on those pages was already absolute.

**Fixed in the build, not only in the data file**, so a hand-added relative path
cannot reintroduce it. `abs()` normalises on read, and the verification pass
fails the build on any relative path in the tile markup or the pool.

Two false positives while writing that guard, both worth recording:

1. It matched `data-src="' + it[1] + '"` inside the observer's own source - a
   string literal, not a path. Scoped the check to the markup between the track
   opener and the pool script.
2. It flagged image alt text. Pool entries are `['v', src, poster]` but
   `['i', src, ALT]`, so index 2 is only a path on a video entry.

Both are the same lesson as the earlier idempotency bug: a check that fires on
the wrong thing is as bad as no check, because it trains you to ignore it.

### Handwritten accent in the reel heading (06/08/2026)

Ryan asked for "forever keepsakes" in the Memory Catcher handwritten face for
warmth. `{braces}` in the heading copy now mark an accent span:

```json
"heading": "Real families, {forever keepsakes}"
```

Escaped first, then the braces are converted, so copy still cannot inject markup
(braces are not characters `esc()` touches).

`.ugc h2 .ugc-accent` uses `var(--script)` ("Nothing You Could Do"), which is
already defined and the font already loaded on all three pages. Sized to 1.22em
because the script face has a much smaller x-height than Fraunces, and
`letter-spacing: 0` because the h2's -.015em tracking crushes a handwriting font.

Rule added in **three places** - `shared/styles.css` plus the inlined copies in
`our-kit.html` and `keepsake-standalone.html`, neither of which loads the shared
sheet. **Stylesheet bumped `?v=12` -> `?v=13`** across all 35 pages.

Verified against baseline: 34 pages differ ONLY by the version bump; the three
reel pages are the only real content changes. `bespoke-baby-gallery.html` is
untouched apart from the bump.

Preview of three accent sizes shipped as `reel-heading-preview.html` for Ryan to
pick from. 1.22em is what is in the build.

### Product page mobile gutters: the 03/08 fix was stacking (06/08/2026)

Ryan on mobile: margins off on either side, "From kit to keepsake" and the FAQ
too far in, and too much space above the hero eyebrow.

**There was already a fix for this, from 03/08, and it was the cause.** It set an
18px gutter below 600px but listed **both** the section and the inner container
it wraps, so the two stacked:

| Band | Outer | Inner | Actual inset |
|---|---|---|---|
| Hero | `.hero` 18 | - | **18px** correct |
| Steps | `.steps` 18 | `.steps-head` 18 | **36px** |
| FAQ | `.faq` 24 (never listed) | `.faq-grid` 18 | **42px** |
| Reviews | `.reviews` 24 (never listed) | `.reviews-head` 18 | **42px** |
| Review cards | `.reviews` 24 | `.review-track` 24 | **48px** |

Only the hero got a single 18px, which is exactly why it alone looked right and
every band below it sat progressively further in.

**Root cause is a divergence from the shared sheet.** The canonical pattern is
**the section carries no side padding and the inner container owns the gutter** -
`.reviews` is `80px 0 88px` with `.reviews-head` at `0 40px`. `our-kit.html`
carries its own copy of this CSS (it does not load `shared/styles.css`) and had
inverted it on `.faq` and `.reviews`, putting 24px on the section as well.

Restored the shared pattern inside the `max-width:600px` block. All five bands
now compute to **18px**, verified by walking the cascade and confirming no later
rule re-overrides them.

**Desktop deliberately untouched.** Above roughly 1360px the 1280px container
caps first and the section padding never binds, which is why this only ever
showed on a phone.

**Hero top spacing.** Base is `clamp(132px,9vw,168px)`, and 9vw on a phone is far
below the floor, so mobile was getting **132px - more than desktop's 128px**,
despite the mobile header being shorter. Backwards. Set to **96px** below 600px,
matching home's mobile hero, reclaiming 36px above the fold.

**Also found:** `.kit-wrap` and `.inc-wrap` were in that selector list and exist
nowhere in the markup. Dead selectors, dropped.

**Flagged, not actioned:** `keepsake-standalone.html` (the affiliate page at
`/memory-catcher/<slug>`) has **no mobile block at all** and runs a flat 24px
everywhere. Not the same bug - nothing stacks, so nothing looks wrong - but it
does not follow the 40/18 standard either. Left alone pending Ryan's call, since
changing how the affiliate page looks was not asked for.

Preview at 390px with 18px guides shipped as `product-page-mobile-gutters.html`.

### Reel accent: word spacing halved, foil gradient applied (06/08/2026)

Ryan: close the gap between "forever" and "keepsakes" by 50%, and colour it like
the hero's "forever" on the product page.

**Word spacing, measured rather than guessed.** Pixel-analysed Ryan's screenshot:

| | Measured | As em |
|---|---|---|
| script space (inside the accent) | 35px | **0.515em** |
| Fraunces space (before the accent) | 13px | 0.233em |

The script face carries a word space more than twice the serif's, which is why
"forever keepsakes" had a hole in it while the space before it looked tight.
`word-spacing: -.26em` halves it to 0.257em - near enough the serif space that
the line now reads evenly. The 50% instinct was the right one, and it happens to
land the two spaces on top of each other.

**The colour is not a colour.** `h1 .kept` is an animated foil gradient with
`background-clip: text`, not a flat fill - appropriate for a foil company.
Lifted verbatim so the accent shimmers the same way. `color: var(--stone)` added
as a fallback for anything without `-webkit-text-fill-color`.

**Found while doing it: the product page hero shimmer has never animated.**
`our-kit.html` sets `animation: foil 7s ease-in-out infinite` on `h1 .kept` but
**never defines `@keyframes foil`**, and it does not load `shared/styles.css`.
The gradient rendered statically. Adding the keyframes there fixes the hero as
well as the reel accent.

**Reduced motion needed patching by hand on two pages.** `shared/styles.css` has
a global `* { animation: none !important }`, but `our-kit.html` and
`keepsake-standalone.html` scope theirs to `.hero *, .kit, .sticky` - so a new
animation outside those selectors is not covered. Added `.ugc h2 .ugc-accent` to
both.

Rule updated in **three places** again. **`?v=13` -> `?v=14`.**

**A verification bug worth recording.** My first check reported the two inline
pages as FAIL. They were fine - the regex `\.ugc h2 \.ugc-accent\s*\{` was
matching the *reduced-motion* rule, whose selector list now also ends in
`.ugc h2 .ugc-accent`. Re-ran filtering for the block that carries
`font-family`. Third time this session that a check fired on the wrong thing;
the pattern is always the same, a selector or string that looks like the target
but is not it.

### Official TrustBox in the footer, replacing the static badge (06/08/2026)

Ryan proposed swapping the hand-built footer badge for the Mini TrustBox.
**Agreed** - and it is a very different proposition from swapping the reviews
carousel, which I argued against earlier. The footer badge is a score and a
count, nothing a crawler needs as prose, and it is the one place where
verification is worth more than crawlability.

**Three corrections to the snippet Trustpilot generated:**

| Issue | Why it mattered |
|---|---|
| No `data-theme` | The attribute defaults to **light**. The wordmark and meta text render black, and the footer is `#000`. It would have shipped black on black and looked broken. |
| `data-locale="en-US"` | UK business, UK profile. |
| Fallback link to `www.trustpilot.com` | `shared/trustpilot.js` already uses `uk.trustpilot.com` as its PROFILE constant. |

The theme one is the significant catch. It is visible in Ryan's own preview
screenshot - black wordmark on a transparent checkerboard - and would not have
shown up until it was live.

**The figures are kept, as the widget's fallback.** Everything inside a
`.trustpilot-widget` container is no-JS fallback that the widget replaces on
load. Trustpilot's boilerplate puts a bare `<a>Trustpilot</a>` there. Putting the
real stars and "TrustScore 4.9 - 72 reviews on Trustpilot" in that slot instead
means a human gets the verified widget and a crawler still reads the figures.
**Nothing is lost by swapping**, which is what made this an easy yes.

**New `scripts/build-trustpilot.js`, wired into the netlify build.** It reads
SCORE and COUNT from `shared/trustpilot.js` and writes them into the **raw
HTML**, then fails on any mismatch. This closes the gap flagged earlier today:
`trustpilot.js` fills the figures at runtime, which is correct for browsers and
Googlebot but invisible to every AI crawler, so the moment the numbers changed
the raw HTML would have gone stale for exactly the crawlers Ryan is trying to
reach. Tested by changing COUNT to 81 and confirming it propagated.

Bootstrap script placed at the end of `<body>` rather than in `<head>` as
Trustpilot instructs. It is `async` either way and the badge is always below the
fold, so this costs nothing and blocks nothing. Only written to pages that
actually carry a widget - 30 of 38.

**A verification lesson, again.** My first negative test stripped `data-theme`
from a page and expected the build to fail. It exited 0 - because the build
**regenerates** the widget block, so it self-healed before the guard ran. The
test was wrong, not the guard. Re-tested against the real failure mode, a bad
template in the script, and both the theme and locale guards fire correctly.
That is the fourth check today that fired on the wrong thing.

**Stylesheet `?v=14` -> `?v=15`.**

**Needs an eyeball on the live site:** `data-style-height="180px"` is
Trustpilot's own generated value and it may leave a gap under the badge in the
footer. I cannot render a third-party iframe here, so it is not something to
guess at. Trim if it looks loose.

**Still open, and worth more than any of this:** nothing on the site or in
either order email asks a customer to leave a review. 72 reviews against 10,000+
kits sold.

### Hero Trustpilot badge now jumps to the reviews section (06/08/2026)

Ryan: clicking the Trustpilot badge in the product hero should anchor down to the
reviews, which is what people expect of a review widget on a product page.

**The badge was not a link at all.** It is our own static markup, not a
Trustpilot iframe - which matters, because a click inside a third-party iframe
cannot be intercepted. Being our own markup made this trivial.

Applied to `our-kit.html` and `keepsake-standalone.html`, whose hero blocks are
byte-identical. `home.html` is deliberately left out: its `.hero-proof` is a
different element ("Over 10,000 kits sold since 2017"), not a Trustpilot badge.

Four changes:

| Change | Why |
|---|---|
| `id="reviews"` on the section | It only had `aria-labelledby`, no id of its own - nothing to anchor to |
| Badge wrapped in `<a href="#reviews">` with an aria-label | Without the label the accessible name reads "4.9 out of 5 stars 4.9 on Trustpilot" from the two img alts |
| `<b>4.9</b>` -> `<b data-tp-score>4.9</b>` | It was a loose copy of the score that nothing maintained. Now synced with the footer |
| `.reviews{scroll-margin-top: 64px}` | `header.scrolled` is `position: fixed`, so a flush landing would put the header over the section's top padding |

`scroll-behavior: smooth` was already set globally, so the scroll animates
without any JavaScript. No script added.

**Follow-on fix to `build-trustpilot.js`.** Its sync regex only matched
`<span data-tp-score>`. The hero uses `<b>`, so the new element would have been
skipped and drifted from the footer - the exact bug the script exists to prevent.
Made tag-agnostic with a backreference so the closing tag has to match. Proved it
by setting SCORE to 4.8 and watching the hero update.

Both pages carry their own inline CSS and do not load `shared/styles.css`, so the
rules went inline and **no cache-buster bump was needed** this round.

**One wrong turn worth recording:** the first run failed on
`keepsake-standalone.html` because I matched the `.reviews` rule as an exact
string. `our-kit` minifies its CSS to one line; `keepsake-standalone` keeps it
expanded. Same rule, different whitespace. Switched to a regex. our-kit had
already been written by then, but the script writes per page only after all its
edits succeed, so nothing was left half-applied.

Verified in jsdom on both pages: link present, `href="#reviews"`, target resolves
to the section whose heading is "Rated Excellent on Trustpilot", exactly one
element with that id.

### SEO: canonicals, Product schema, Organization schema, llms.txt, consent gate (06/08/2026)

Points 2-6 of the Trustpilot plan, done. New `scripts/build-seo.js` in the
netlify chain.

**Product schema, deliberately WITHOUT aggregateRating.** Ryan's call. Google's
guidance is not to aggregate ratings from other websites, and the 4.9/72
originates on Trustpilot rather than being collected here. The Product entity,
offers and brand are entirely clean and carry real weight with answer engines on
their own. **The build now fails if aggregateRating reappears anywhere on a
managed page**, with a pointer to the reasoning.

**Canonicals: 25 missing -> 27 written, all derived from `_redirects`.** Nine
pages still have none, all deliberately: `404`, `component-library`,
`snag-tool`, `franchise-region`, the map embed, `sitemap`, and three form
fragments. Giving those a canonical would invite indexing. The build also fails
if a canonical points at something `_redirects` 301s away, which is how the
original schema ended up on a page canonicalised elsewhere.

**Organization schema on home with `sameAs`** -> Trustpilot, Instagram, Facebook.
No rating claimed, no stars requested. It tells search and answer engines that
this site and those profiles are one entity, so a 4.9 found on Trustpilot is
understood to be about this company. The build fails if the Trustpilot URL is
ever dropped from `sameAs`, since that is the entire point of the block.

**llms.txt** now carries a rating line, read from `shared/trustpilot.js` so it
cannot contradict the pages.

**TrustBox is consent-gated.** Rewritten from a bare async `<script src>` to a
loader that checks the same `bfc-consent` key `analytics.js` manages. Gating
costs nothing here because the widget's fallback is a real badge: without
consent you see the static stars and score, with it you see the verified widget.
Nobody sees an empty box.

**Three bugs found by testing, all worth recording:**

1. **The script added schema without removing the old block.** The affiliate page
   ended up with TWO Product schemas - the new clean one plus the original,
   still carrying aggregateRating and a `url` pointing at the `/our-kit`
   redirect. My verification only inspected the block it had written and passed
   happily. Now strips any unmanaged `ld+json` on managed pages (leaving
   `{{...}}` template placeholders alone) and checks the **whole page**.
2. **I invented the consent event name.** Wrote `bfc-consent-change` on `window`
   plus a click-delegation fallback. The real event is `bfc:consent` on
   `document`, dispatched by `analytics.js`. It would have silently never fired.
   Checked the source instead of assuming.
3. **The listener re-read storage instead of trusting the event**, so accepting
   the banner after page load did not bring the widget in. jsdom caught it: four
   consent states tested, and "denied then accepted" was the one that failed.

A fourth, smaller one: a backtick inside a comment terminated the template
literal the bootstrap is built from.

**Verified:** build idempotent across three runs; four consent states behave
correctly; canonical pointing at a 301 self-heals; reintroducing aggregateRating
fails the build with exit 1.

### Migration link audit + real company details in Organization schema (07/08/2026)

Ryan: the old site has a lot of internal linking - how do we make sure it pulls
through without checking by hand?

**`check-internal-links.js` cannot answer this.** It proves every link on the NEW
site resolves. It has no idea what the OLD site had. A migration can pass it
cleanly while having dropped half the internal link graph and 404'd every
backlink to a renamed page. Two different questions, and only one of them was
being asked.

**New `scripts/migration-link-audit.js`.** Crawls the live old site from its
sitemap, reads REAL hrefs, and diffs the link graph against the new site read off
disk plus `_redirects`. Four sections:

1. **Old URLs with no route or redirect.** The expensive one - they 404 the
   moment DNS moves and every backlink is thrown away, permanently. Exits
   non-zero on these alone; the rest are judgement calls, not deploy blockers.
2. Internal link targets the new site cannot serve.
3. Pages that lost inbound internal links, old count vs new.
4. Anchor text that did not carry over.

Outputs `MIGRATION-LINK-AUDIT.md` with a paste-ready `_redirects` block.

**Why it cannot run here:** the sandbox network is allowlisted to package
registries, so the live domain is unreachable. Local half tested in isolation:
43 live routes and 42 redirects parsed from `_redirects`, wildcard matching works
(`/franchises/wigan` resolves via `/franchises/*`), 42 links with anchor text
extracted from `home.html`.

**Why guessing does not work, demonstrated.** I inferred old slugs from the live
footer's link TEXT and six looked missing. But the new site deliberately renamed
pages - `/faq` not `/faqs`, `/blog` not `/stories-inspiration`, `/franchise` not
`/memory-catcher-franchise`. Link text cannot tell you the old slug. Only the
href can, which is exactly why this has to be crawled rather than eyeballed.

**Free win from fetching the old homepage.** Its footer carries the registered
details, which were on my list of things to ask Ryan for. Now in the Organization
schema, taken from source rather than guessed:

- Company No. 12941845, VAT GB419408687
- 2nd Floor, Pier House, Wallgate, Wigan, WN3 4AL
- +44 7506 998934, hello@thebespokefoilcompany.co.uk

A company number, VAT ID and real postal address are what separate a verifiable
business entity from a name in a JSON blob. That matters more to answer engines
than to Google.

Also confirmed from the old homepage: it server-renders, so the crawl will work.

### Payment chips porcelain + Klarna pink, YouTube in the footer (07/08/2026)

**There were THREE chip components, not one.** Ryan's screenshot showed the block
under the buy button; the obvious first move would have been to fix the footer
chips and ship it looking like nothing had changed.

| Component | Where | Structure |
|---|---|---|
| `.foot-pay .pay-chip` | footer | wrapper span, background on the wrapper |
| `.f-pay-chip` | second footer variant, 7x on keepsake-standalone | wrapper span |
| `.paymethods img` | **under the buy button - the screenshot** | bare imgs, NO wrapper |

All three now porcelain. `.paymethods img` also needed a radius, since with no
wrapper a square background would have shown corners outside the SVG's rounded
stroke: the corner is r=4 in a 64x42 viewBox rendered at 31px, so 4 x (31/42) =
2.95 -> 3px.

**Amex needed no special case, and that is not luck.** Every logo except Amex
draws a #D9D9D9 rounded-rect stroke around a TRANSPARENT interior, so whatever
sits behind shows through the box. Amex paints a full-bleed #006FCF card over its
whole viewBox, so nothing behind it is ever visible. "Leave Amex as it is" falls
straight out of the geometry.

**Klarna Pink is #FFA8CD.** I was about to use #FFB3C7 from memory, which is the
old value still listed widely. Checked against Klarna's brand guidelines first.
Their preferred badge is exactly what this produces: the black wordmark on
Klarna Pink.

Set on the img via `[src*="klarna"]` rather than a modifier class - one rule
covers all three components, no `:has()`, and no markup change across 30 pages.

**YouTube** added to `.foot-social` on 30 pages, and to the Organization schema's
`sameAs`. The icon uses `fill-rule="evenodd"` so the play triangle is a hole
rather than a filled shape, matching how the other two render as flat paths.

**Stylesheet `?v=14` -> `?v=15`.**

**A formatting trap, for the second time today.** My first detection pass used
`.f-pay-chip{` and `.paymethods img{` with no space and concluded
keepsake-standalone had neither rule. It has both - it keeps its CSS expanded
while our-kit minifies. Same mistake as the `.reviews` rule yesterday. Switched
to tolerant regex, which then also turned up `franchise.html` carrying
`.paymethods` - a fourth page nobody had mentioned.

**Worth Ryan's eye:** Klarna's own guidance prefers the badge with no border. The
#D9D9D9 stroke is inside the SVG and stays, so Klarna now reads as pink-inside-a-
grey-box. That is what was asked for and it keeps the row consistent, but the
stroke could be dropped for Klarna alone if it looks off.

### Chips corrected to white, and a real bug the preview's self-check found (07/08/2026)

Ryan, on seeing the preview: the chips look transparent and Klarna is not pink.
He was right on both counts, and revised the spec to **white everywhere, Klarna
pink, Amex blue as it is**. Done - all four files, all three components.

**MY PREVIEW WAS BROKEN, AND I SHIPPED IT AS IF IT WERE THE SITE.** Two separate
faults, both mine:

1. **The CSS extractor matched almost nothing.** `grab()` was passed selectors
   that already ended in `{`, then appended `\s*\{[^}]*\}` - a pattern needing
   TWO opening braces. Four of the five rules came back empty. The preview
   rendered unstyled chips, which is why they looked transparent on black. The
   site CSS was fine.
2. **Base64 images made the Klarna rule untestable.** The real rule is
   `img[src*="klarna"]`, and a base64 blob contains no such string. Klarna could
   never have rendered pink in that preview whatever the CSS said.

Rebuilt so neither can recur: selectors passed without the brace, every rule
asserted present before the file is written, and images embedded as URL-encoded
data URIs with the brand name planted in an XML comment so the src genuinely
contains it and the REAL selector is what gets exercised.

**And that self-check immediately found a genuine site bug.** The shared sheet's
Klarna rule was scoped to `.foot-pay .pay-chip img[src*="klarna"]` - footer only.
`our-kit.html` had the same narrow rule. So **the chips under the buy button were
never going to be pink on the product page**, which is the exact block Ryan
screenshotted.

Cause: the first script wrote the narrow rule; the second was meant to write the
broad one but guarded on `if PINK not in new`, and the pink was already there
from the first. A guard that skips when the value is present, not when the rule
is right.

Both broadened to cover `.pay-chip`, `.f-pay-chip` and `.paymethods`. Verified
across all four files that carry the rule.

Also removed a duplicate Klarna rule on `franchise.html` - it has two `<style>`
blocks, and the script appended to every block once any block matched.

**Net:** three chip components, four files, all white; Klarna #FFA8CD; Amex
untouched because it paints its own full-bleed card. Preview self-check passes:
four rules present, Klarna rule covers `.paymethods`, three img srcs contain
"klarna".

### Migration link audit tested end to end, and it did not work first time (07/08/2026)

Ryan wants the report run today. Before handing him a command, I tested the half
of the script that had never been exercised - the crawl.

**It failed.** And the failure message was useless: "No sitemap found", because
every fetch error was swallowed by a bare `catch (e) { /* try the next */ }`.
A proxy block, a TLS failure, an HTTP 403 and a genuinely absent sitemap all
produced the same line. That is the least useful thing an error can do, and Ryan
would have hit it as his first experience of the tool.

Now reports every attempt and its actual reason, and names the three likely
causes with what each means.

**Testing it properly took three goes**, which is itself worth recording. A
background HTTP server started with `&` or `nohup` did not survive between bash
invocations - the child was reaped, so the crawler got ECONNREFUSED against a
server that looked like it was running. Solved by running the server in a thread
inside the same Python process as the subprocess call, so both live and die
together.

**Mock built to match what Wix actually serves:** `/sitemap.xml` as a sitemap
INDEX pointing at `pages-sitemap.xml` and `blog-posts-sitemap.xml`, not a flat
urlset. The script merged both correctly.

**Result:** 5 old pages crawled, 37 new pages read from disk, and it correctly
flagged `/faqs`, `/memory-catcher-franchise` and `/stories-inspiration` as having
nowhere to land - exactly the renamed slugs I had guessed at from footer link
text days ago and could not confirm. Exit code 1, as designed.

Test report deleted afterwards so it does not ship as if it were real data.

Instructions written up as `HOW-TO-RUN-THE-LINK-AUDIT.md`, including the Node 18
requirement (native fetch, no dependencies) and what each failure mode means.

### GO-LIVE-RUNBOOK.md created, consolidated for a single handover (07/08/2026)

Ryan: remember all this for the final handover, and do not spin plates with Dixit
at this stage.

So the runbook is built around **owner**, not around task type. Every blocker is
tagged CLAUDE / RYAN / DIXIT, which means Ryan can work through his own dashboard
and account items without handing Dixit anything at all until the whole package
goes over in one piece. That was the actual ask - consolidate rather than
drip-feed - and it changed how the document is structured, not just what is in
it.

**Contents:** seven blockers ordered by cost of getting them wrong rather than
effort; the silent-failure analysis of the Stripe webhook; all 24 env vars
grouped by system with the note that Netlify env changes need a fresh deploy; the
eight-step cutover sequence; a first-48-hours watch table; five open decisions
that are Ryan's to make; and a list of what is already verified so nothing gets
re-litigated later.

**The one-line summary at the top** is deliberate: the site is functionally
complete and the build chain is green, but it would currently ship a 39-URL
sitemap, 404 every franchise region and blog post, drop enquiries from three
forms, and break every order confirmation email the day the Wix account closes.
None of it is hard. All of it is invisible until it is live.

Memory updated too, but the durable copy is the file - it travels inside the zip,
so the context can never be separated from the code. Same reasoning as the
standing ZIP README rule.

### Footer TrustBox alignment, horizontal and vertical (07/08/2026)

Ryan's diagram: the Trustpilot block should share a left edge with the contact
links above it, and its base should sit level with the last franchise link.
Alignment problems on mobile too.

**The horizontal offset was not our markup.** `.foot-right` is already
`align-items: flex-start`. TrustBox iframes **centre their content within
whatever width they are given**, so at `max-width: 320px` the ~200px of widget
content floated to the middle of the column. Widely hit - Trustpilot's own
community threads and every agency write-up cover it.

Fixed with `max-width: fit-content` plus an explicit `align-self: flex-start`,
so the box shrinks to its content and has nowhere to drift. **Deliberately not**
the `position: relative; left: -32px` nudge that comes up first in every search
result - documented as behaving unpredictably on resize, and it would have needed
a different offset at every breakpoint, which is most likely what Ryan is seeing
on mobile.

**The vertical is now self-correcting rather than tuned.** `.foot-col` becomes a
flex column and `.foot-right` gets `margin-top: auto`, pinning the block to the
bottom of the grid row. Grid items already stretch to the tallest column, so the
bases line up on their own **and stay lined up if a footer link is ever added or
removed** - which a hand-tuned height would not.

For that to work column 4 has to stop being the tallest, so the widget height
comes down **180px -> 150px**. 180 was Trustpilot's generated value, not a
measured one. The true minimum is on the Preview page of the TrustBox in Ryan's
account; if 150 clips anything it is one number in
`scripts/build-trustpilot.js`.

**Stylesheet `?v=15` -> `?v=16`.**

**A guard bug worth recording.** My "already applied?" check looked for the
string `fit-content` anywhere in `shared/styles.css`. It appears at line 1406 in
an unrelated rule, so the shared block was skipped while every inline copy was
rewritten - a half-applied change that the verification then correctly failed.
Scoped the guard to `max-width: fit-content`. Third time this week a check has
matched something that merely looked like the target.

**Still needs Ryan's eye:** this is a third-party iframe I cannot render here.
`fit-content` on a container holding a percentage-width iframe is the documented
fix, but if it collapses oddly the fallback is a fixed px width on
`data-style-width`. Preview shipped with dashed guides showing both target edges.

### Blog: FAQs and Final Thoughts lost in migration, related cards unstyled (07/08/2026)

Ryan spotted two things on the deployed blog. Both turned out to be the same
shape of bug: a template expecting data or markup that nothing supplies.

**1. CONTENT LOSS - the serious one.**

Fetched both versions of the same post and compared. On Wix, "FAQs" and "Final
Thoughts" are `<h2>` headings **inside the body**, with `<h3>` questions beneath
- not structured fields. The new template has proper structured fields for both
(`faqs[]` feeding an accordion AND FAQPage schema, plus `final_thoughts`), which
is the better design.

The migration cut those sections OUT of the body, correctly, and then **never
populated the structured fields**. So the body stops at "A Sustainable,
Thoughtful Gift", the FAQ accordion is empty, and Final Thoughts is gone.

On `why-every-parent-needs-a-baby-footprint-keepsake` that is four Q&As and
three closing paragraphs missing. Every post on the blog follows the same shape,
so assume all 15. It also costs FAQPage rich results, one of the few still
available.

New `scripts/recover-blog-faqs.js` fetches each live post, extracts both
sections, and writes `blog-faq-recovery.json` ready for the Supabase rows. It
**does not write to Supabase** - deliberately, since this is a content restore
on live rows and a human should read it first.

Tested end to end against a mock carrying the real Wix shape: div soup, HTML
entities, `<span>` inside `<h3>`, a bullet list, and a trailing `<h2>Tags:</h2>`
that the section parser has to stop before. Result: 4 Q&As with clean decoded
text, 3 paragraphs of final thoughts, and a post with no FAQs handled without
error. Added to the runbook as **B1b** - time-critical, since it dies with the
Wix account.

**2. The template even said so.** `post-template.html` carried the comment
"Omit whole block if no FAQs" above a section that was unconditional. Nothing
implemented it, so a post with no FAQ data shipped a bare "FAQs" heading over
empty space - exactly what Ryan screenshotted. Both `faqs_html` and
`final_thoughts` now arrive from the edge function fully wrapped, section and
heading included, so empty data renders nothing.

**3. Related cards - CSS for markup that was never emitted.** The stylesheet
defines `.pr-card-body { padding: 18px 18px 22px }` and `.pr-card-body h3
{ font-family: var(--serif); font-weight: 340 }`. The edge function emitted a
bare `<h3>` with no wrapper, so titles got no padding and missed the serif rule
entirely, falling back to default bold sans. That is precisely what the
screenshot shows. One-line fix: wrap the title in `.pr-card-body`.

`.pr-meta` is also defined and never emitted - the design intended a date line
above each title. Left alone for now; worth a decision.

### TrustBox: un-gated, resized, and the alignment properly diagnosed (07/08/2026)

Ryan, seeing the fallback: "you have gone back to the old version?" No - that WAS
the fallback, showing because consent had not been granted in that browser. He
then accepted the banner, the widget rendered, and confirmed the diagnosis.

**But his reaction was the useful part.** He looked at the footer and saw no
Trustpilot widget. Every visitor who has not answered the banner sees the same,
which is most first-time traffic - so the widget was not doing the verification
job it was added for. Three options put to him; he chose to un-gate it.

**Consent gate removed**, on his instruction, recorded in the runbook as a
knowing decision rather than an oversight. The plumbing stays, so re-gating is
small. Same class of exposure as the Meta Pixel, and the runbook now suggests
deciding both together rather than separately.

**The alignment fix on 07/08 could not have worked, and I should have seen why.**
I used `max-width: fit-content` on the container. But the iframe's own width was
`data-style-width="100%"` - a percentage resolving against the very container
that `fit-content` was trying to size from its contents. Circular. The browser
falls back to a default width, leaving slack, and the widget centres itself in
that slack. The offset was never about position; it was about the box being
wider than its content.

Fixed by giving the iframe a **definite pixel width** (200px), which removes the
slack outright. `align-self: flex-start` stays - that pins the box to the column
edge; the width controls where the content sits inside the box.

**Both dimensions hoisted to named constants** at the top of
`scripts/build-trustpilot.js` with a comment explaining which lever does what.
These have now been nudged three times across four rounds while buried in a
template string, which is a sign they should never have been buried.

  WIDTH 200px  - lower it to move the content left
  HEIGHT 110px - lower it to shrink the block

`?v=16` -> `?v=17`.

### TrustBox: disclaimer removed, height tightened to fit (07/08/2026)

Ryan: the "Trustpilot checks reviews" line is clipping, and he wants it gone
entirely rather than given room.

**Checked before removing it.** No definitive statement either way on whether
Trustpilot requires it, but `data-review-disclaimer` is a toggle in their own
TrustBox designer - Ryan's generated snippet simply had it ticked - so switching
it off is a supported option rather than a workaround. Flagged that if he wants
certainty it is a question for Trustpilot support, not for me to assume.

**Height 110px -> 100px, and this time it is measured rather than guessed.**
Used the payment chips as a scale anchor: they are a known 26px in CSS and
rendered at ~55px in the screenshot, so that image was ~2.1x. The widget content
ran logo-top to score-baseline over ~180 screenshot pixels, which is ~86px real.
100px fits that plus the iframe's own padding without leaving dead space.

That technique is worth reusing - a known CSS dimension in the same screenshot
turns "looks about right" into arithmetic.

**Guarded.** The build now fails if `data-review-disclaimer="true"` reappears,
with the reason in the error. Same treatment as `data-theme="dark"` and the
locale. Negative-tested: flipping it back on in the template fails the build with
exit 1 across all 30 pages.

Three settings on this widget are now guarded rather than remembered - theme,
locale, disclaimer - plus the size constants are hoisted and commented. That is
about right for a third-party embed nobody can render locally.

### Mobile menu: single-row header, two new links, tighter type (07/08/2026)

Ryan: add Memory Catcher Hub and Memory Catcher Franchise as text links, move
Order Your Kit to the top left with a small logo between it and the close button,
and shrink the type so it all fits. The bottom was already clipping.

**Sized by arithmetic rather than feel**, since the screenshot's scale was
ambiguous and guessing has cost us three rounds elsewhere this week:

| | Type | Padding | Row | Items | Total |
|---|---|---|---|---|---|
| Before | clamp(24px, 5.5vw, 30px) | 15px | ~59px | 9 | ~527px |
| After | clamp(20px, 4.8vw, 25px) | 12px | ~48px | 11 | ~528px |

Eleven rows now cost what nine used to. The header merge saves ~50px on top, so
the menu gains two items and comes out **~49px shorter**.

**Why the header could not simply be reordered in CSS.** The logo was a direct
child of `.nav-menu-top` while the CTA sat nested inside `.nav-menu-top-right`,
so no amount of `order` would put the logo between the CTA and the close button -
they were at different depths. All three are now direct children of the existing
`justify-content: space-between` row, which places them correctly **with no new
CSS at all**. The wrapper is gone.

Logo down to 16px per Ryan - in an open menu it is a wayfinding cue, not
branding.

Links inserted after Bespoke Baby Gallery, keeping FAQ and Contact as the utility
tail. Hrefs taken from the footer rather than invented: `/memory-catcher-hub` and
`/franchise`, both confirmed as live 200 routes in `_redirects`.

`?v=17` -> `?v=18`. Internal link count 1457 -> 1517, all resolving.

**Verification false positive, again.** My check counted
`<a href="/memory-catcher-hub">` page-wide and flagged all 30 files as
duplicates - the footer links to the same page. Scoped it to the
`.nav-menu-links` block. That is the fourth time this week a check has matched
something outside the region it was meant to inspect; the pattern is always
"searched the document when I meant to search a block".

### Announce bar: three crossfading statements (07/08/2026)

Ryan asked whether the top ticker should carry the Etsy review volume, and
suggested a crossfade with a Foil Fusion Technology line as a third slide. Yes to
all of it - with one implementation rule that decides whether it helps or hurts.

**ALL THREE STATEMENTS ARE IN THE HTML AT ONCE.** A ticker that swaps
`textContent` in JavaScript shows a crawler exactly one statement, and no major
AI crawler runs JS - so the JS version would have made AI visibility *worse*,
which is the opposite of the reason for doing it. Rotated in CSS instead: all
three in the raw markup, one visible at a time, **no JavaScript at all**. Also
works with JS off and needs no consent.

Absolute positioning inside a fixed `min-height` so a longer statement cannot
shift the page as it fades in. `prefers-reduced-motion` shows the first statement
only; the other two stay in the markup, so nothing is lost for crawlers.

**The three, and what each is for:**

| Statement | Job |
|---|---|
| Rated Excellent on Trustpilot | verified third-party rating |
| Over 2,000 five-star reviews on Etsy | volume and longevity - a far bigger number than 72 |
| Our exclusive Foil Fusion Technology™ | the differentiator nobody else can claim, repeated across all 31 pages as an entity signal |

**Copy decisions, both defensive.** "Over 2,000" not "2,224" - stays true as the
number grows, so it cannot quietly become an unsubstantiated claim that nobody
remembered to update. And "on Etsy" is not optional: a review count with no
platform named reads as a site-wide claim the site cannot support. The build
**fails** if a review count appears in the bar without a platform after it.

**Deliberately not linked.** Making the Etsy claim clickable on every page would
route traffic off the site, where the margin is whole, to a marketplace that
takes a cut and owns the customer. The claim earns trust here; the link would
spend it.

`scripts/build-announce.js` added to the netlify chain. `?v=18` -> `?v=19`.

**Not done, and deliberately:** repeating the Etsy line under the footer
Trustpilot badge. The bar already carries it on all 31 pages. What is actually
missing for "indexed and connected" is the Etsy shop URL in the Organization
schema's `sameAs` - that is the structural link between the brand entity and
that reputation, and it is still waiting on Ryan for the URL.

### Reel heading: accent drops to its own line (08/08/2026)

Ryan: "forever keepsakes" is too wide, especially on mobile - put it on a new
line, everywhere.

**Done in CSS, not in the copy.** `.ugc h2 .ugc-accent` goes from
`inline-block` to `block`, so the accent takes its own line at every breakpoint
and on every page carrying the component. No `<br>` in the heading string, which
means the copy in `data/ugc-reel.json` stays clean prose and the `{braces}`
convention keeps working. The markup is byte-identical to before.

`transform: translateY(.04em)` removed with it. That nudge existed to sit a
script baseline next to a serif one **on the same line**; on its own line it just
lifts the word off centre.

`line-height` raised .9 -> 1.05 and a `.12em` top margin added, since a script
face on its own line needs breathing room the tight leading was denying it.

`?v=19` -> `?v=20`.

**Verification comedy worth recording.** My check asserted "no inline-block" and
"no translateY" against the rule body - and failed on all three files, which were
already correct. The comment I had just written to explain the change reads
*"Block, not inline-block"* and *"translateY is gone with it"*. The check was
matching my own explanation of the removal.

That is the **fifth** time this week a check has matched something that merely
resembled its target: a string literal in generated JS, image alt text, a
selector list, a page-wide search where a block was meant, and now a CSS comment.
Every one of them was a check reading a wider region than it should. Fixed by
stripping comments before testing, but the pattern is the lesson: scope the
region first, then match.

### Etsy in sameAs, and two things the shop page turned up (08/08/2026)

Ryan supplied the Etsy URL. Fetched it to confirm it resolves before wiring it in
- a `sameAs` pointing at a dead or wrong shop is worse than none - and the page
paid for itself twice over.

**Added to Organization `sameAs`.** Confirmed live: 4.9 from **2,224** reviews,
**13,054 sales**, on Etsy since 2018. That is the single biggest piece of
off-site reputation BFC has, and `sameAs` is what makes it count towards the
brand entity rather than floating unattached.

**1. MY OWN COPY WAS WRONG.** Yesterday's announce bar said "Over 2,000
five-star reviews on Etsy". The shop page shows **4.9 from 2,224** - an average,
and the visible sample includes four-star reviews. "Five-star" claimed something
the source page contradicts on the very screen a visitor would check it on, and
it was written off a dashboard screenshot rather than the public page. Corrected
to **"Rated 4.9 from over 2,000 reviews on Etsy"**.

Exactly the CAP Code trap the build guard was meant to catch - and it did not,
because the guard only checked that a platform was named, not that the claim
matched reality. Reality is not something a build script can check; reading the
source is.

**2. TRADEMARK SYMBOL MISMATCH.** The Etsy About text says "Foil Fusion
Technology**®**", twice. The site says "Foil Fusion Technology**™**" 122 times
and never ®. Memory Catcher™ likewise, 171 times.

® asserts a *registered* mark, and under s.95 Trade Marks Act 1994 falsely
representing a mark as registered is a criminal offence in the UK. Either the
mark is registered and the site is understating it, or it is not and the Etsy
copy needs changing. Added to the runbook as a pre-go-live check against the IPO
register.

**A verification bug, and a better fix than usual.** Changing the copy broke the
build - the check held its OWN hardcoded copy of the three statements, so editing
one made the script report correct output as a failure on all 31 pages. Now
derived from `ITEMS` itself, comparing tag-stripped text. The check can no longer
disagree with the thing it is checking.

### The reel heading preview was lying, and the type was already correct (08/08/2026)

Ryan: reduce the heading font, it is too close to the edges at 390px, the other
two sizes are fine.

**Did not reduce it. The preview was wrong, not the page.**

`.ugc h2` is `clamp(26px, 3.6vw, 38px)`, and `vw` is **viewport**-relative. My
preview used 390px-wide `<div>` frames inside a full desktop browser window, so
`3.6vw` resolved against Ryan's ~1200px browser and returned the 38px desktop
maximum. The panel labelled "390px - phone" was rendering desktop type.

| Viewport | Real h2 | Real accent |
|---|---|---|
| 390px | 26.0px | **31.7px** |
| 768px | 27.6px | 33.7px |
| 1100px | 38.0px | 46.4px |

He was looking at 46.4px in a box labelled phone. A real phone gets 31.7px, a
third smaller. Measured off his screenshot, the phrase renders 8.17x its font
size, so at 31.7px it is ~259px - about 65px clear of each edge at 390px, and
still 30px clear at 320px. Shrinking it would have made an already-correct
heading small for no reason.

**What WAS wrong, and worth fixing:** `.ugc h2` had **no horizontal padding at
all**, while `.ugc .lede` has had `padding: 0 24px` since the beginning. Nothing
stopped the heading touching the edge on a narrow device; it just happened not
to. Given the same gutter as the lede - insurance, not a resize.

**Preview rebuilt with iframes**, which create real viewports, so `vw` resolves
correctly. Each frame now measures itself and reports its viewport width,
computed h2 size, accent width and clearance from each edge, with the frame edges
marked. Five widths from 320 to 1100.

That is the second preview this week that misled rather than informed. The first
silently dropped four of five CSS rules; this one rendered the wrong type size
under a label that said otherwise. **Both were believed because they looked
plausible.** The fix in both cases is the same: make the preview report its own
measurements rather than inviting an eyeball judgement.

`?v=20` -> `?v=21`.

### Mobile menu: four fixes, and two bugs of my own found on the way (08/08/2026)

Ryan: logo sitting over the close button, double line above the Memory Catcher
block, move the Franchise link under Our Story, cards flush to the bottom edge.

**1. The logo was not mispositioned. It did not fit.**

The wordmark's viewBox is 184.5 x 18.65, so it is **9.89:1**. At the 16px height
set yesterday it is 158px wide:

```
CTA 205 + logo 158 + close 44 + two 20px gaps = 447px
                          against 354px available at a 390px viewport
```

93px of overflow, which is why the close button landed on top of it. Shrinking
does not rescue it: at 12px the row is still 54px too wide, and even at an
illegible 8px it is 14px over. **Hidden below 600px.** It costs nothing - "Home"
is the very next row, doing the same job - and above 600px there is room so it
stays. Layout mechanics fixed at all widths regardless: CTA and logo together on
the left, close pushed right with `margin-left: auto`.

Worth noting for later: a square "BF" monogram at ~24px would fit comfortably and
let the mark stay on mobile. No such asset exists in `/assets` today.

**2. Double line** - two separate 1px rules stacking: the last link's
`border-bottom` and `.nav-menu-cta`'s `border-top`. Dropped the link's; the
divider belongs to the section.

**3. Franchise moved under Our Story. 4. Cards given
`padding-bottom: calc(28px + env(safe-area-inset-bottom))`** so they clear the
iOS home indicator rather than sitting on the screen edge.

---

**MY FIRST ATTEMPT DELETED CONTENT.** The reorder cut the franchise link out with
one regex and reinserted it with another. On `our-story.html` the anchor carries
`class="current"`, so the reinsert pattern did not match - and because the
removal had already run, **that page simply lost the link**. A destructive step
executed ahead of its own precondition.

Replaced with a rebuild: derive the list from the existing anchors plus a
canonical order, restore anything missing from a template, and **refuse to write
unless all eleven are present**. It cannot half-apply. Formatting, minified or
expanded, and the current-page marker all survive because each anchor is carried
whole.

**That refusal immediately earned itself** by catching a second, older problem:
`sitemap.html` was missing the Memory Catcher Hub link too.

**And the reason was better than "the regex missed".** `sitemap.html` is
**generated** by `generate-sitemaps.js` from `scripts/sitemap-template.html`.
Every edit made to the output file has been silently overwritten on the next
build - which is why it kept reverting to nine links while the other 29 pages had
eleven. Yesterday's header restructure had never reached it either. Fixed at the
template, then verified by running the full chain twice: 30 pages, 11 links each,
no drift.

**A guard false-positive, the sixth this week.** The CSS insertion was skipped
because `'.nav-menu-top .mlogo' not in css` matched the pre-existing
`.nav-menu-top .mlogo-img`. Now guarded on a full declaration string that cannot
be a prefix of anything else.

`?v=21` -> `?v=22`. Internal links 1517 -> 1519.

### Announce bar: flexbox was adding the double spaces, plus a fourth statement (08/08/2026)

Ryan spotted awkward double spaces around every bold word and remembered hitting
this early in the build. Same cause, and he was right that bold was involved -
but the bold does not have to go.

**Flexbox turns every run of text between tags into its own anonymous flex
item.** `.announce-item` is `display: flex; gap: 8px`, so

    Rated <b>Excellent</b> on Trustpilot

became THREE flex items - "Rated", "Excellent", "on Trustpilot" - each separated
by an 8px gap **on top of** the ordinary word space already in the text. That is
the double space, and it appeared only around `<b>` because that is where the
text got split.

The gap existed for one reason: the space between the stars image and the text.

**Fix: wrap the text in a single `<span class="announce-text">`.** Now each
statement is one flex item, the gap can only ever fall between image and text,
and `<b>` behaves as ordinary inline markup again. **The bold stays** - no need
to flatten the weights as Ryan offered.

`ITEMS` restructured to `[imageSrc | null, text]` so the wrapper cannot be
forgotten when copy is added. The build **fails** if any statement is unwrapped,
naming the consequence. Negative-tested: removing the wrapper exits 1.

**Fourth statement added**, and checked against the code rather than taken at
face value. `our-kit.html` already runs `SHIP_CUTOFF_HOUR = 12` with Mon-Fri and
weekend rollover, driving the "Ships today" line in the sticky bar - so a noon
cutoff claim is genuinely substantiated.

Two wording changes from Ryan's draft:

- **"on a weekday"** is not padding. The bar shows on every page every day; the
  claim is simply untrue on Saturdays and Sundays, and the shipping logic already
  knows that.
- **"same-day dispatch"** rather than "same day shipping", so nobody reads it as
  same-day *delivery*.

Cycle timing 21s -> 28s for four statements, each holding ~5s.

**A test that lied about itself.** My first negative test piped the build through
`head -3` and reported `exit: 0` - that was `head`'s status, not node's. The guard
had actually fired correctly. Re-ran without the pipe: exit 1. Worth noting
because it is the same failure as all the others this week - measuring the wrong
thing and believing the answer.

### Mobile menu header: the overlap was stale CSS, not spacing (08/08/2026)

Ryan: on mobile the logo overlaps the close button, move it closer to the Order
Your Kit button.

**Nudging the logo would not have fixed it.** The `max-width:520px` block still
described the OLD two-row header:

    .nav-menu-close   { position: absolute; top: 0; right: 0; order: 1 }
    .nav-menu-top-right { width: 100%; order: 2; margin-top: 20px }
    .nav-menu-top     { flex-wrap: wrap; position: relative }

`position: absolute` takes the close **out of flow**, so nothing reserves its
space. That was right when it sat alone in a corner and the CTA dropped to a row
beneath. In the single-row header it means the logo lays out as though the close
were not there and runs straight under it. `.nav-menu-top-right` was a dead rule
- that wrapper was deleted when the header became one row.

Close is back in flow with `margin-left: auto`, so the CTA and logo group on the
left and the close is pushed to the far right. Exactly what was asked, and it
falls out of the layout rather than being positioned by hand.

**The logo also had to shrink, and that is arithmetic.** The wordmark viewBox is
184.5 x 18.65, so at 16px tall it is **158px wide**:

    available at 390px = 390 - 56 (the .nav-menu 28px gutters) = 334px
    logo 158 + CTA ~145 + close 24 + two 20px gaps             = 367px

33px over before anything else, so the row could not fit even with the close back
in flow. At 12px the logo is 119px and the row needs 312px - 22px spare. It was
also `display: none` below 600px, so it is now shown.

**A cascade bug I introduced and nearly shipped.** I put the 12px override where
the old `display: none` rule sat - but the base `height: 16px` rule appears
*later* in the file, and **media queries add no specificity**. Source order alone
decides it, so the 12px would never have applied. Moved to its own media block
after the base rule.

Worse, `our-kit.html` carries that base rule **twice**, in two separate `<style>`
blocks, so inserting after the first still lost to the second. Now placed after
the LAST occurrence, and the check compares source POSITIONS rather than merely
confirming both rules exist - which is what let the first attempt pass.

**Unexplained, same as the menu reorder:** a second base rule
`.nav-menu-top { justify-content: flex-start; gap: 14px }` has appeared that I
did not write. It is correct for the new layout, so left alone, but it is the
second thing this session that changed outside this thread.

`?v=22` -> `?v=23`.

### Three mobile menu tweaks - two were already true (08/08/2026)

Ryan resent three tweaks from the lost phone message. Checked each against the
repo rather than against his screenshot, and only one needed doing.

**1. "Move Memory Catcher Franchise under Our Story" - already there.** It sits
at position 3, directly after Our Story. I did not put it there; I inserted both
new links after Bespoke Baby Gallery and verified that at the time. Something
moved it, same as the `.nav-menu-top { justify-content: flex-start }` rule that
appeared earlier today.

**2. "Remove duplicate hairline near the images" - only one exists.**
`.nav-menu-links a:last-child { border-bottom: 0 }` is present in both the shared
sheet and the inline copy, so the last link draws no line. The single remaining
rule is `.nav-menu-cta { border-top }`, which is the intended divider. Checked
both files specifically in case of drift - they agree. Added a build-time count
so a second hairline cannot creep back unnoticed.

**3. "More padding at the bottom" - done.** This one is a preference rather than
a bug, so no reproduction needed. `.nav-menu-cards` padding-bottom 28px -> 48px,
which with the `.nav-menu` 40px bottom padding gives **88px plus the safe-area
inset**.

**The pattern behind all three: Ryan's deploy is behind the repo.** His 07:30
screenshot shows NINE menu links - the pre-change build. Every tweak in that
message was written against a version that no longer exists, which is why two of
them describe things already fixed.

Combined with the two edits that have appeared in the repo from outside this
thread, the sensible next step is for him to deploy the current zip and re-test
before sending more, rather than both of us chasing ghosts in an old build.

`?v=23` -> `?v=24`.

### Etsy: scale added, and the footer line Ryan asked for (08/08/2026)

**"4.9" with no scale - fixed with words, not stars.** Ryan asked whether to add
five-star symbols. No, and for a specific reason: the only star assets on the
site are `tp-stars-5.svg` and `tp-brandmark.svg`, which are **Trustpilot's**
branded green stars. Putting those beside an Etsy figure would imply Trustpilot
verified an Etsy rating. "**4.9 out of 5**" says the same thing in text, is
readable by crawlers in a way an image is not, needs no new asset, and raises no
question about whose marks are being used.

**Etsy line added to the footer, under the TrustBox. I argued against this
yesterday and was wrong.** My objection was that it adds nothing for crawlers -
true, and beside the point. Ryan's framing was "so they work together", which is
a conversion argument, not an SEO one. In a footer trust cluster, a verified
rating from one platform sitting above volume from another is stronger than
either alone, and 2,224 is a far bigger number than 72. The cost of the
duplication is close to zero. Unlinked, for the same reason as the announce bar.

**Both figures moved into `shared/trustpilot.js`.** They were about to be typed
into two build scripts - `build-announce.js` for the ticker and
`build-trustpilot.js` for the footer. Two copies of the same claim in two
scripts is precisely how a number ends up right in one place and stale in the
other. Now one source, read by both, and filled at runtime through
`[data-etsy-score]` / `[data-etsy-count]` like the Trustpilot pair. Confirmed:
**zero hardcoded figure literals** in either script.

**The build now fails if the Etsy figure appears without its scale.**

**And a self-inflicted idempotency break, caught by the negative test.** Adding
the `<p class="foot-etsy">` changed the block's shape from ending `</div></div>`
to ending `</p></div>` - which broke `NEW_BADGE`, the regex the script uses to
FIND ITS OWN OUTPUT. The build could no longer locate the block, so a re-run left
the previous markup untouched and then failed verification against it. The
symptom looked like the guard misfiring; the cause was the matcher.

Fixed by checking which shape is present and matching that one. **Not** by
alternating `</p>|</div>` in a single regex - on a page still in the old shape
that would scan past the block hunting for a `</p>` and swallow half the footer.

`?v=24` -> `?v=25`.

### Etsy logo: cannot use it, and the copy change (08/08/2026)

Ryan sent the Etsy wordmark SVG, asked for it in white, and asked whether it
should go in the header ticker.

**Copy change done:** "out of 5" -> "**/ 5**" in both the announce bar and the
footer. Guard updated to accept either form - the point it enforces is that a
bare "4.9" states no scale, not which wording is used.

**The logo cannot be used, and the request happened to breach two separate rules
at once.** Etsy's Trademark Policy is explicit:

  - "DON'T use the official Etsy logo without our permission."
  - "DON'T alter, distort, or modify the Etsy Marks."

Recolouring their orange wordmark to white does both. Their Teams guidance is
blunter still: official Etsy logos may only appear inside an Etsy-designed
badge, and "you can't include the standalone Etsy logo on your website".

The examples page also asks sellers to make it clear "both visually and in text"
that the site is not run by Etsy - which a white Etsy wordmark sitting in the
header of every page works directly against.

What IS permitted is the word "Etsy" in plain text, spelled and capitalised
properly, which is exactly what the current treatment does. So the answer to
"should it go in the header" is moot: not in the header, not in the footer, not
anywhere, without written permission from Etsy.

**The SVG was deliberately not added to `assets/`,** and the build now fails if
any file references an Etsy logo asset, with the reason in the error. That way a
future round cannot quietly reintroduce it.

This is the second trademark issue in two days, after the ® on the Etsy listings.
Worth Ryan knowing the exposure runs both directions: overclaiming his own mark,
and using someone else's.

**A broken negative test, for the third time this week.** The first attempt
injected the logo before `</footer>` - a tag that does not exist in
`our-kit.html`, so nothing was injected and the guard "failed" against an
unmodified file. The second attempt put it inside the `.foot-tp` block, which
the build regenerates, so it was overwritten before verification ran. Only the
third - injecting before `</body>`, outside any regenerated region - actually
tested anything. Exit 1, correct message.

### £1 test SKU instead of a 98% discount code (08/08/2026)

Ryan asked for a 98% off code to test checkout without putting £50 through his
own card each time. Right instinct, wrong instrument, and the investigation
turned up something worth knowing.

**The main kit checkout does not support coupons at all.**
`create-payment-intent.js` accepts `{ sku, qty, personalisation, affiliate, fbp,
fbc, page }` - no coupon field, no discount path. `validate-coupon.js` exists and
its own comment claims "the authoritative application happens in
create-payment-intent.js", but that is only true of the ADD-ONS flow, which does
re-validate against Stripe Promotion Codes properly. The kit flow never reads a
coupon.

So a 98% code would have meant **adding a discount path to the live payment
function days before go-live** - the single riskiest file on the site, and the
one the runbook already flags for silent failure.

**And a percentage code is the wrong shape regardless.** It attaches to the REAL
products, so if it leaks, real kits sell for a pound. A test SKU is a separate
product nobody is browsing: a leak sells a thing that does not exist, and the
order is obvious in ShipStation.

**`BFC-KIT-TEST` at £1**, reached with `?testsku=1`. Four independent controls,
any one of which shuts it off:

| Control | Why |
|---|---|
| `TEST_SKU_ENABLED=true` in Netlify env | Off by default. **Disabling needs no deploy** - the moment you need it off is the moment you cannot wait for a build |
| Hard expiry 30/09/2026 | Backstop for when someone forgets the env var |
| Quantity forced to 1 | Caps the damage |
| Logged on every use | A stray charge is visible in the function log |

Named "TEST ORDER - do not fulfil" so it is unmistakable in ShipStation. Rejects
with the same `Unknown SKU` error as any bad SKU, so it gives nothing away.

**The browser cannot authorise it.** `?testsku=1` only asks; the server decides.
Verified that `checkout.js` contains no reference to the env gate.

**Tested all six states**: env unset, env "false", env "true" in date, env "true"
past expiry, qty 5 forced to 1, and a real SKU unaffected. The expiry path logs
its refusal and still returns the generic error.

**Sixth comment-matching false positive this week.** My check asserted the
browser file never mentions `TEST_SKU_ENABLED` - and failed on the comment I had
just written explaining that the SERVER holds the gate. Checks now strip comments
before matching. Last time I wrote "scope the region, then match"; the region
here is "code, not prose".

### Memory Catcher affiliate codes wired end to end (08/08/2026)

Ryan: the affiliate code needs to work on the real site anyway, and it should add
the free extra copy. Checked the July thread rather than rebuilding from memory -
the agreed spec was **slug into Stripe metadata for commission** and **FREE extra
copy** as the customer offer, the 10% having been dropped earlier.

**A live dead end, found in the process.** The affiliate box on
`/memory-catcher/<slug>` shows a code with a "Copy Code" button - and the kit
checkout had **no code field at all**. The customer copied a code and had nowhere
to paste it. The slug travelled to Stripe and credited commission; the code did
nothing, anywhere. The July changelog even says the code "must exist as a real
discount in Shopify/Wix" - which was true when it was written, and stopped being
true when the site took over its own Stripe checkout.

The real use case is offline: Ashley hands a card to a parent at a baby class,
and that parent later lands on the ORDINARY product page. The code is the only
thing carrying attribution, so it has to work from anywhere on the site.

**THE OFFER DOES NOT CHANGE THE PRICE, AND THAT IS THE WHOLE SAFETY ARGUMENT.**
"Free extra copy" is a fulfilment instruction, not a discount. So no code path
touches `total`. A leaked, guessed or forged code **cannot under-charge an
order** - the worst it can do is credit the wrong franchisee, which is visible in
Stripe and recoverable. This is why yesterday's 98% discount code was the wrong
instrument and this is the right one: same business need, no exposure.

Tested against forged codes, SQL injection, a 200-character code, lowercase
input, and slug-plus-code together. **Price unchanged in all eight cases.**

**Four pieces:**

| Piece | What it does |
|---|---|
| `functions/validate-affiliate-code.js` | Looks the code up in the `franchisees` table. Display only |
| `create-payment-intent.js` | **Re-validates server-side**, sets `affiliate_slug` + `free_extra_copy`. Never trusts the browser |
| `stripe-webhook.js` | Prepends the instruction to `customerNotes` - what the studio actually reads when picking - plus `customField2` |
| `shared/checkout.js` | The field, collapsed behind a link |

**Two UI decisions worth recording.** The field sits BELOW email and ABOVE the
card block, never in the wallet area: wallet payers skip everything under the
wallet buttons, and they are exactly the customers likely to be holding a card
from a class. And it is collapsed behind a text link, because an always-visible
discount box sends people off hunting for a code they do not have.

**An unrecognised code is ignored, not rejected.** Failing someone's order at the
last step over a mistyped code costs far more than the offer is worth. The UI
tells them whether it applied before they pay. A network failure in the validator
clears the code and lets the order through at full price rather than trapping the
customer behind a validator that happens to be down.

**No cache-buster bump** - the drawer CSS lives in the two checkout pages, not
the shared sheet. I bumped it reflexively and reverted; `shared/styles.css` was
never touched.

**Needs Ryan:** confirm the free extra copy applies to ALL kits. The site copy
says so, but the franchise booklet restricts it to framed orders. Those two
should not disagree.

### Free extra copy: the two offers differ on purpose (08/08/2026)

Ryan resolved the open question. Website + code = free extra copy on **all
kits**. In person = **framed only**, to push Memory Catchers toward the
higher-value sale, because in-person is where their margin is.

Implementation already matched: `free_extra_copy` is set purely on code validity,
with no SKU condition anywhere in the payment path. Verified.

Recorded in the runbook as **deliberate**, because it reads like an
inconsistency and the next person to notice it - Mark on the SEO audit, Dixit, or
me in a fresh thread - would otherwise "fix" it and break the commercial logic.

**A tension worth flagging that fell out of it.** The `franchise.html`
recruitment table says the website offers "No free extra print". That is still
true of a plain website order, so the table is not wrong. But it is now
incomplete: with a Memory Catcher's code, the website gives a free extra copy on
**any** kit, including the £34.95 print-only.

So a parent handed a code at a class gets a better deal ordering print-only
ONLINE than buying print-only in person - and the franchisee earns 20%
commission online versus full margin in person. The more generous offer points
customers at the channel that pays the franchisee less.

Minor in absolute terms, but it cuts against the "in person is better in every
way" pitch the recruitment booklet is built on. Ryan's call: restrict the online
free copy to framed, or accept it as a customer-acquisition trade.

### Region map: Register Interest 404, and the same bug on three other pages (10/08/2026)

Ryan snagging the region map: Register Interest 404s, and More about region goes
to the live Wix site.

**One root cause behind both.** The map was originally built to be **iframed into
Wix**, and an embed has to break out to reach the parent site - so its links were
absolute to `https://www.thebespokefoilcompany.co.uk` with `target="_blank"`.
Correct then. As a native page on the new site it means:

- **Register Interest** points at `<live wix>/memory-catcher-enquiry`, a route
  that only exists on the NEW site. Hence the 404.
- **More about region** built its href as `'https://www.thebespokefoilcompany.co.uk' + rawLink`,
  walking every visitor off the new site onto the old one. All 112 region links in
  `regions.json` are relative (`/franchises/<slug>`) and those routes exist here
  via the `/franchises/*` rewrite, so the prefix was pure harm.

Both now relative and same-tab. The `-embed` variant never had this - it uses
relative links and has no card buttons at all, so the standalone page was the
only one carrying the legacy wiring.

**The audit that followed found the same 404 elsewhere.**
`memory-catcher-earnings-calculator.html` had **two** "Register your interest"
CTAs pointing at the same non-existent Wix route. Ryan would have hit those next.
Also fixed: `kit-walkthrough-video.html`, `tommys-charity.html` and
`post-template.html` all linked to the product page absolutely - those work, but
they hand a browsing visitor over to the old site mid-journey.

Left absolute deliberately: canonicals, schema, og: tags, social share URLs, and
the domain quoted as prose in the privacy policy.

**Why nothing caught this.** `check-internal-links.js` only inspects RELATIVE
hrefs. An absolute link to our own domain looks external to it, so 1,525 links
could pass while a button 404'd. Added a guard: the build now fails on any
`href="https://www.thebespokefoilcompany.co.uk..."` outside the allowed cases,
with the reason spelled out. Negative-tested - reintroducing one exits 1 and
names the file.

That gap is worth noting on its own. A link checker that only sees relative paths
will always miss the links most likely to be wrong during a domain migration.

### Memory Catcher hub login added to the sitemap (10/08/2026)

`/franchisee-login` was `# exclude`d. Now
**`# Utilities | Memory Catcher hub login | Where Memory Catcher franchisees
sign in to their hub`**, exactly as asked.

Added `Utilities` to `CATEGORY_ORDER` rather than letting it fall through as an
unknown category. Unknown ones get appended anyway, so it would have landed last
either way - but naming it makes the position a decision rather than a side
effect, and lets it carry its own `<priority>`. Set to **0.3**: a sign-in page is
a destination for people who already know it exists, not something to compete
for.

Sitemap 150 -> 151 URLs. `build-seo` also picked it up and wrote its canonical,
since it is no longer excluded - those two systems agreeing is the point of both
reading `_redirects`.

**Flagged for Ryan's pre-go-live decision, since he said he will want more
utility pages customer-facing.** The mechanism is currently ALL OR NOTHING: a
route either carries a category and appears in `sitemap.xml`, `sitemap.html` AND
`llms.txt`, or it is excluded from all three. Those files have different
audiences - a login belongs on the human sitemap, has almost no value in the XML,
and is noise in `llms.txt`.

Runbook now lists every still-excluded route so the decision can be made in one
pass, and notes the fix if granularity is wanted: a fourth comment field
(`| html-only`) so a route can appear for humans without entering the crawler
files. Not built - it is speculative until Ryan decides what he actually wants
listed.

### Sitemap underlines removed (10/08/2026)

Ryan: get rid of all the underlines on the sitemap.

**Fixed in `scripts/sitemap-template.html`, not `sitemap.html`.** That file is
regenerated by `generate-sitemaps.js` on every build, so editing it directly
would have looked right until the next deploy quietly reverted it.

**Why only some links were underlined.** The rule was scoped to
`.sm-group li a` alone. Three other containers had **no link rule at all** and
fell straight through to the browser default:

  .sm-long li a     Franchise Regions (112) and Stories (15) - what Ryan saw
  .sm-intro a       the "still can't find it" line
  .sm-util-tag a    the 8 utility tags

So the short category lists looked right while the long sections did not, which
is exactly what the screenshot shows. Widened the selector to cover all four.

**Kept the affordance on interaction.** On a page where literally everything is
a link, underlines are noise - the context is the affordance. But removing them
outright leaves keyboard users with nothing, so hover now covers all four
containers and a `:focus-visible` outline was added, which the page did not have
before at all.

Verified by regenerating and diffing: byte-identical across two runs, so the
template edit is the source of truth rather than a patch that survives until the
next build.

### Slot form: not a Stripe gap, a data leak (10/08/2026)

Ryan: the £10 deposit button wipes the fields and does nothing - is it just not
hooked up to Stripe?

**Not hooked up, yes. But that is the third-worst thing about it.**

`<form class="slot-form" id="slotForm" novalidate>` - no `action`, no `method`,
a `type="submit"` button, and no handler anywhere. The only script on the page is
`analytics.js`. So submitting performed a **native GET to the page's own URL**:

1. **Personal data into the URL.** Name, email and phone appended as a query
   string - and therefore into browser history, Netlify access logs, the Referer
   of every subsequent outbound request, and **GA4**, because `page_location`
   captures the full URL and `analytics.js` is on that page. Personal data
   reaching a third-party analytics product with no consent and no intent.
2. **Nothing captured.** The reload wiped the fields - Ryan's symptom - and every
   enquiry submitted so far went nowhere.
3. **No payment**, and `novalidate` meant it submitted while empty.

Fixed: `method="post"` with a real action as a fallback if the handler never
attaches, a handler that `preventDefault()`s and posts JSON to the existing
tested `submit-lead`, validation, and a visible success state. Tested in jsdom -
empty submit blocks and posts nothing; valid submit posts the right payload and
never navigates.

**`memory-catcher-enquiry.html` had the identical defect.** Checked because the
cause was structural rather than particular to one page. Worse exposure: 16
fields including mobile, email and free-text notes, on the £3,445 franchise
application form. Fixed the same way.

**The £10 is deliberately still not taken.** The button said "Pay £10 booking
deposit" while taking no payment - a claim the page could not honour - so it now
says "Reserve my slot" and the copy says the deposit is taken on confirmation.
Wiring a second payment flow days before go-live is exactly the risk the runbook
warns about, and the model needs Ryan's decision. Three options recorded there;
the cheapest real one is a `BFC-SLOT-DEPOSIT` SKU reusing the existing drawer
rather than building a second path.

**A bug in my own handler, caught before shipping.** I named a variable
`location` for the town field, which shadows `window.location` - so
`sourceUrl: location.href` would have been `undefined` on every submission.
Renamed to `town`; the jsdom test now shows the real URL coming through.

### Footer: three unclosed divs, and four pages with no footer tail at all (10/08/2026)

Ryan: the wordmark is missing on the home page, and on some inner pages it sits
in the bottom right instead of stretching full width. Cookie settings is touching
the base of the page.

**Two separate defects, one of them invisible for weeks.**

**1. THREE UNCLOSED DIVS ON EVERY PAGE.** `.foot-top`, `.foot-col` and
`.foot-right` never closed. Browsers recover from that silently by auto-closing
at `</footer>`, so nothing looked broken - but it meant `.foot-legal` and
`.foot-watermark` were parsed as **children of `.foot-right`**, inside
`.foot-col`, inside `.foot-top`, which is a four-column grid.

So the legal block and the full-bleed wordmark became items in the fourth
column. The wordmark's `width: calc(100% + 80px)` was measuring against a narrow
column instead of the footer - which is exactly why it rendered small and jammed
into the bottom-right corner. Not a styling problem at all; a parsing one.

**2. FOUR PAGES HAD NO FOOTER TAIL.** `home.html`, `blog.html`,
`franchise.html` and `our-kit.html` ended after the Trustpilot block: no
`.foot-legal`, no `.foot-watermark`, no `</footer>`. On home the next tag was
`</dialog>`.

That means **the homepage was serving with no company number and no VAT ID**,
which UK companies are required to display. A legal exposure, found while
chasing a missing logo.

It also explains Ryan's second symptom: with no legal block and no wordmark, the
cookie link injected at the end of body had nothing beneath it, so it sat against
the base of the page.

Fixed both. Verified structurally rather than by eye: on all 30 footers,
`.foot-legal` now has nesting depth 0, the wordmark comes after it, and every
`<div>` balances.

**Two things that went wrong while fixing it, both worth recording.** My first
div-balance check reported `contact.html` as broken - and it was right, I had
assumed a known-good page was the reference. And my "already done?" guard was a
string match on a comment, so it missed `sitemap.html`, which was generated from
a template that was ALREADY correct, and I closed its divs a second time. Fixed
by making the guard structural: measure the nesting depth, do not look for a
marker.

**`scripts/check-footer.js` added to the deploy chain.** Checks that the footer
closes exactly once, that `.foot-legal` and `.foot-watermark` are direct children
of `<footer>`, that the wordmark comes last, that the company number is present,
and that every div balances. Negative-tested against both failure modes.

`keepsake-standalone.html` and `upload-portal-form.html` are exempt - both have
deliberately compact footers.

**Why nothing caught this before:** every existing check looks at CONTENT - do
the links resolve, is the analytics tag present, is the canonical right. None
looked at STRUCTURE. A page can be perfectly valid by all four of those checks
and still be shipping malformed HTML that a browser silently repairs into the
wrong layout.

### Etsy note added to the reviews section (10/08/2026)

Ryan: 72 Trustpilot reviews looks thin, put the Etsy figure alongside it so
people understand we are new to the platform rather than new to the business.

**The read is right, and the strongest version says it out loud.** A visitor who
sees 72 wonders how long BFC has been going. One who sees "2,000 reviews on Etsy
since 2018" stops wondering. Naming the gap yourself, rather than hoping nobody
notices, turns the weakest number on the page into candour - and it only works if
you get there before the visitor does.

Shipped wording:

> New to Trustpilot, but not to this: rated **4.9** / 5 from **over 2,000**
> reviews on Etsy since **2018**.

**The year does more work than the count.** 2,000 reviews is impressive; "since
2018" is what actually explains the 72. `ETSY_SINCE` added to
`shared/trustpilot.js` alongside the other figures, so all four numbers on the
site come from one place.

**Placed on its own line, not to the right of the Trustpilot lockup as Ryan
suggested.** Three reasons: side by side wraps badly on a phone; one claim is
linked and verified while the other is not, so they should not look like equals;
and text pressed against the Trustpilot brandmark risks reading as though
Trustpilot vouches for the Etsy figure. Styled deliberately subordinate.

Unlinked, consistent with the footer and the announce bar.

On all four pages carrying `.reviews-head` - home, our-kit, keepsake-standalone,
foil-fusion-technology - written by `build-trustpilot.js`, which already owns
every other Trustpilot figure. The build now fails if a page has a reviews
section without the Etsy line.

Preview shipped with **four wordings** so Ryan can choose: his original tightened,
the shipped one, a version that implies the gap without admitting it, and one
leading with 13,000+ orders. Styling pulled live from `shared/styles.css`, so the
preview cannot drift from the real thing.

`?v=25` -> `?v=26`.

**And the new footer check immediately earned its place.** It failed on
`sitemap.html` in the delivered zip - a regression introduced by
`build-trustpilot.js` itself.

`sitemap.html` is regenerated from `scripts/sitemap-template.html`, whose footer
still carries the OLD static badge rather than the TrustBox. So on every build,
`build-trustpilot` took its old-shape branch:

    /<div class="foot-tp">[\s\S]*?<\/div>\s*<\/div>/

That was written when `.foot-tp` was followed by a single closing div. Once the
footer gained its proper `</div></div></div>` earlier today, the pattern started
matching `.foot-tp`'s close **plus `.foot-right`'s** - and the replacement only
put one back. It ate a closing div on every single run.

Tightened to `(?:(?!<div\b)[\s\S])*?<\/div>`, which matches `.foot-tp` and its
own close by refusing to cross a nested `<div>`. Confirmed by running the full
chain twice and `build-trustpilot` three times in a row.

Worth sitting with: **this morning's footer fix created a bug that this
afternoon's footer check caught within the hour.** Both halves were written
today. Without the check it would have shipped, and the symptom - a wordmark
drifting into the corner of one page - is exactly the sort of thing that gets
noticed weeks later and blamed on CSS.

### The last two forms, and a check that found itself (10/08/2026)

**`contact.html` (B4) was a stub, but not a leak.** Its whole handler was two
`alert()` calls, one reading "Design preview: your enquiry would be sent here".
It DID call `preventDefault()`, so unlike the other two it never put anything in
the URL - it just discarded every enquiry silently. Now posts to `submit-lead`
with inline status messages rather than native dialogs, which on a phone get
dismissed reflexively and cannot say which field is wrong.

**`upload-portal-form.html` was already correct**, and is already wired to
Zendesk end to end: `upload-portal-submit` writes the row and issues signed
upload tokens, files go straight to Supabase Storage (Netlify caps function
payloads at 6MB; a phone video is 60-100MB), then `upload-portal-complete`
raises the ticket carrying signed download links.

It only needed the `method="post"` fallback for the case where the handler never
attaches - and there the payload is the worst on the site: name, email, phone,
order number, personalisation AND full postal address. Deliberately **no action
attribute**: pointing a native POST at `/upload-portal-submit` would send
form-encoded data to a JSON endpoint half way through a two-phase upload, which
fails in a way that looks to the customer like their files vanished. Posting to
self discards it harmlessly, which is all the fallback needs to do.

**`scripts/check-forms.js` added**, and it immediately found two more:
`franchise.html` - the one form that always worked - was still GET by default,
and the sitemap template carried a dead copy of the contact stub for a page that
has no form at all.

**Then it found itself, twice.**

First it flagged `contact.html` for the phrase "Design preview" - matching the
comment I had just written to explain that the stub was REMOVED. Fixed by
stripping JS comments as well as HTML ones.

Then it flagged `sitemap.html` for having an unwired form. There is no form on
that page. The comment I had written said *"this page has no `<form>` at all"* -
and the scan ran on raw HTML, so **my note about the absence of a form was
detected as a form.**

Both fixed properly: the scan now runs on comment-stripped source, and the
comment no longer contains markup. Negative-tested on both failure modes.

That is the eighth comment-matching false positive this week, and the clearest
one yet. The rule has been the same every time and I keep half-applying it:
**strip the prose before you match the code.** A check that reads documentation
as data will always find whatever the documentation is about.

### Etsy now accompanies every Trustpilot statement (10/08/2026)

Ryan: put it next to the hero Trustpilot line on the product page and the
affiliate page too, and alongside all the Trustpilot statements.

**Audited rather than patched the one he screenshotted.** Five surfaces carry a
Trustpilot claim:

| Surface | Pages | State |
|---|---|---|
| `.tp-jump` hero proof | 2 | **added** |
| `.kb-tp` mid-page line | 3 | **added** |
| `.reviews-head` | 4 | done earlier today |
| `.foot-tp` footer | 30 | done |
| announce bar | 30 | rotating Etsy statement |

`home.html` also has a `.hero-proof`, but it reads "Over 10,000 kits sold since
2017" - a different claim, not a Trustpilot one - so it was left alone.

**The hero version is deliberately short:** `4.9 on Trustpilot · 4.9 from over
2,000 on Etsy`. A hero proof line is read at a glance, and the full "new to
Trustpilot, but not to this" argument belongs where someone is actually weighing
reviews up. Here the work is done by the **repetition**: 4.9 on one platform,
4.9 on another. Two independent sources agreeing says more in five words than a
sentence would.

The mid-page version gets its own line beneath rather than extending the
sentence - `.kb-tp` is a centred single line and a second clause would double its
length.

`flex-wrap` added to `.tp-line` so the hero drops to a second line on a narrow
phone rather than squeezing the headline. Preview at 390 / 768 / 1200 in real
iframes so the wrap can be judged rather than guessed.

Unlinked throughout, per Ryan; the Trustpilot half stays linked. Both new
surfaces are guarded - the build fails if a `.tp-jump` or `.kb-tp` ships without
its Etsy figure.

`?v=26` -> `?v=27`.

### Steps carousel alignment: a number copied between pages (10/08/2026)

Ryan: the first step card does not line up with the text above it on the product
page. Check the affiliate page and home too, and mobile on all three.

**The cause was a hardcoded figure copied to a page it did not fit.**

`.steps-head` is a centred container - `max-width: M; margin: 0 auto; padding: 0
P` - so its text begins at `max(P, (100% - M)/2 + P)`. `.steps-track` is a
full-bleed scroller, so it has to reproduce that offset with padding-left. It was
doing so with `calc(50% - 566px)`.

**566 is correct for a 1180px container with 24px padding. That is the AFFILIATE
page** (1180/2 - 24 = 566). The same rule had been copied to the product page,
whose head is 1280 with 40px padding and needs **600**.

Measured, not eyeballed:

| Page | 390px | 900px | 1600px |
|---|---|---|---|
| our-kit | 6px out | 16px out | **34px out** |
| home (shared) | 6px out | 16px out | correct |
| keepsake-standalone | correct | correct | correct |

So the 34px Ryan spotted was the visible one, but **two of three pages were also
out on mobile and in the middle band** - unnoticed because the carousel scrolls,
and once it moves the eye has nothing to compare against.

**Fixed by derivation rather than by correcting the number.** Both rules now come
from the same two custom properties:

    .steps       { --steps-max: 1280px; --steps-pad: 40px }
    .steps-head  { max-width: var(--steps-max); padding: 0 var(--steps-pad) }
    .steps-track { padding-left: max(var(--steps-pad),
                     calc(50% - var(--steps-max) / 2 + var(--steps-pad))) }

One expression covers every width: below the container's max-width the `max()`
falls back to plain padding, above it the calc reproduces the centred offset
exactly. The per-breakpoint track overrides are deleted - they were the thing
that drifted. Correcting 566 to 600 would have fixed today's symptom and left the
next copy-paste free to do it again.

Verified as arithmetic across ten widths per page, 320 to 2560: head offset and
track offset identical everywhere. Preview measures itself in real iframes and
draws a red rule on the heading's left edge, so the claim is checkable rather
than asserted.

`?v=27` -> `?v=28`.

### Snag round: 9 items (10/08/2026)

Two were the same request, and three turned out to be already done by work since
the snags were captured on 05/08.

| # | Page | Outcome |
|---|---|---|
| 1 + 7 | franchise-region | **Done** - link to the regional map added under "Can't find your region" |
| 2 | find-a-memory-catcher | **Already correct** - `.mc-find-cta` is `var(--r-btn)` (10px), same as every other button. Fixed on 05/08, same day the snag was raised |
| 3 | home | **Already done** - the UGC reel is on the home page, portrait 9/16, horizontal scroll, sitting ABOVE the reviews section exactly as asked. Built 06-07/08, after the snag |
| 4 | upload-portal-thank-you | **Done** - image swapped to the Memory Catcher franchise hero shot for visual continuity |
| 5 + 6 | upload-portal | **Done** - both headings given breaks |
| 7 | blog | **Already fixed** - by this morning's footer work |
| 8 | privacy-policy | **Done** - heart removed |

**The two line breaks are responsive, not hard.** `<br class="brk">` with
`display:none` below 600px. A widow is a desktop problem: on a phone those
headings already wrap on their own, and forcing a break there just makes a short
line shorter.

**Snag 3 was raised on 05/08 and the reel shipped 06-07/08**, so it reads as
outstanding but is not. Worth Ryan re-checking against the current build rather
than the deploy he snagged - two of the nine were like this.

**One thing found while checking, not in the snag list.** `franchise.html` had
**89 relative asset paths** (`src="assets/..."`) and `our-story.html` two. They
work today because both sit at single-segment routes, so `assets/x.webp`
resolves to `/assets/x.webp`.

**But that is exactly how the UGC reel videos broke.** The product page is served
at `/product-page/<slug>` - two segments - where the same path resolves to
`/product-page/assets/x.webp` and 404s. Back then the images used absolute paths
and loaded while the videos used relative ones and did not, and the difference
was invisible until someone opened the page.

All 91 made absolute, and `check-internal-links.js` now fails on any relative
asset path with the reason spelled out. Negative-tested.

### Order numbers: KS-xxxxxxxx confirmed, and made single-source (10/08/2026)

Ryan: going with `KS-xxxxxxxx`, starting fresh rather than continuing the Wix
10xxx sequence.

**No behaviour change - that is already what ships.** But locking the format was
the right moment to notice it was written out by hand in THREE places:

    stripe-webhook.js:247               orderNumber
    affiliate-commission-webhook.js:151 order_number  // "matches ShipStation"
    affiliate-commission-webhook.js:187 order_name

while `order-number.js` - which exists precisely to be the single source - said
in its own header **"never build this string anywhere else"**, and only owned the
`ADDON-` format.

Nothing was broken: all three expressions happened to agree. But **one of the
three is the commission ledger.** If the format ever changed and a single
occurrence were missed, franchisees would be paid against order numbers that do
not exist in ShipStation, and it would surface at reconciliation rather than at
deploy - the worst place to find it.

`buildKitOrderNumber()` added to `order-number.js`; all three call sites now use
it. **Verified byte-identical** to the old inline expression across five
PaymentIntent ID shapes before shipping, because this is the payment path and an
assertion is not proof.

**Two misleading comments corrected while in there.** `order-number.js` claimed
`stripe-webhook.js` used it - it never did; `addons-stripe-webhook.js` does. And
`get-order.js` claimed it returns a number matching "the webhook", which is true
of the add-ons webhook and false of the kit one. It is only called by
`addons/index.html`, so no live mismatch - but a future round wiring the kit
confirmation page to it would have shown customers `ADDON-` numbers that do not
exist in ShipStation. That is exactly the failure the original comment was
written to prevent, and the comment itself would have led someone into it.

**Noted, not changed:** `toUpperCase()` collapses the PaymentIntent's base62
suffix to 36 characters, so ~2.8e12 possible numbers rather than 2.2e14. At
BFC's volumes a collision is vanishingly unlikely, and would not lose an order:
the PaymentIntent ID stays the key and this string is only a human-facing label.

Recorded in the runbook with two operational consequences: Trustpilot AFS
references change format, and a customer quoting 10420 is a Wix order.

### www confirmed as the primary domain (10/08/2026)

Audited rather than assumed. **Zero code changes needed** - the repo was already
consistent:

    canonicals, og:url, schema @id   www   (all 30 pages)
    robots.txt Sitemap line          www
    llms.txt                         www   (151 URLs)
    sitemap edge function            www   - hardcoded, not echoed from the
                                             request host, so it stays www even
                                             if a crawler reaches the apex
    bare apex URLs anywhere          0

Guard added: `check-internal-links.js` now fails on any bare apex URL.
**A canonical on the apex while the sitemap says www - or the reverse - is one
of the commonest migration mistakes there is.** Google follows the 301, finds a
canonical disagreeing with the URL it was handed, and the signals split across
two hosts for weeks. Cheap to prevent, tedious to unpick. Negative-tested.

**The consequence that matters is not in the code.** Stripe's Payment Method
Domain registration is PER HOST. Apple Pay and Google Pay only render in the
Express Checkout Element on a domain registered and verified in Stripe - and if
the wrong host is registered, the wallets just do not appear. No error, no
console warning. **That exact failure already hit the keepsake page in July.**
Registering `www.thebespokefoilcompany.co.uk` is now in the runbook as the
highest-value ten minutes on the go-live list.

Also recorded: use a **Domain** property in Search Console rather than a
URL-prefix one, so coverage and the change-of-address tool cover www and apex
together.

### B3 closed - the stale sitemap.xml that shipped in every zip (10/08/2026)

Found while answering Ryan's question about how much the runbook overlaps the
Top Ten checks - which is the best possible argument for keeping the runbook.

`generate-sitemaps.js` stopped writing a static `sitemap.xml` on **04/08**, with
a comment explaining exactly why: an edge function already claims that path, and
a real file risks winning. But the file left over from BEFORE that change was
never deleted. It has shipped in every zip since - **39 URLs against the edge
function's 151.**

The Top Ten catches this, but only as a symptom on launch day ("open
/sitemap.xml, confirm 151 not 39"). The runbook named the cause, the owner and
the fix, and it was still sitting there unactioned with my name on it.

Deleted. `generate-sitemaps.js` now exits 1 if one reappears, with the reason.

**The guard took two goes.** Inserted at the first `console.log(` it landed
partway down the file, running AFTER generation - so the negative test passed
when it should have failed. Moved to immediately after `ROOT` is defined, which
is the only place a precondition belongs. Retested: exit 1, correct message.

### Dixit's questions - one right, one wrong, one much bigger than reported (10/08/2026)

**"Join community" was right, and it was 23 pages not one.** The block sits on
**25 pages**; only two had any handler at all. `franchise.html` had a complete
one (Meta CAPI event ID, fbp/fbc cookies, `subscribeOnly`); `home.html` had an
`alert()` stub. On the other **23 the Join button did nothing whatsoever** - no
request, no message, no error. Worse than a stub, because a stub at least
acknowledges the click.

Consolidated into `shared/community-signup.js`, built from the franchise.html
implementation rather than the stub. Tested in jsdom on a page that previously
had no handler: posts correctly with `subscribeOnly`, event ID and source URL.

**My own check-forms.js missed all 23**, because it only inspects `<form>`
elements and this is a bare `<input>` beside a `<button>`. Widened to catch
form-less email captures. That is the second time this week a guard has been
looking for the wrong shape rather than the wrong behaviour.

**"submit-lead.js is not routed" - it is.** `netlify.toml` declares
`[functions] directory = "functions"`.

**Three of the four forms were already fixed** earlier the same day. Dixit is
reviewing a build older than the current zip.

**Pushed back on four Supabase tables.** He is right that email-only storage is
fragile. But one `leads` table with `source` and a `jsonb` payload beats four
near-identical ones: single query for "all leads", a new form is a row value
rather than a migration, and one set of RLS policies instead of four to keep in
step.

**And a find of my own, from the widened check.** `/franchisee-login` is a
placeholder - its copy says authentication is not wired and the button reads
"Login coming soon". **I added that page to the sitemap this morning**, so it is
now publicly discoverable: a franchisee searching for the hub login would find a
page that cannot log them in. Recommended pulling it from the sitemap until auth
exists; left in for now because Ryan asked for it explicitly.

Exempted it from the sign-up rules in `check-forms.js` with the reason stated -
the real problem is tracked in the runbook rather than buried behind a build
exemption.

### Slot deposit - Dixit raises the open decision, and a silent no-op of mine (10/08/2026)

Dixit: the slot form has no Stripe integration for the £10 deposit. Correct, and
it is the decision flagged this morning that has not been answered - so he is
about to build something, and without a steer it will be a third payment path.

Three options recorded in the runbook: a **Stripe Payment Link** (zero code,
today), a **`BFC-SLOT-DEPOSIT` SKU through the existing drawer** (post-launch,
reuses tested plumbing), or a separate flow (no). Recommended the first now and
the second once checkout is proven live.

**And a mistake of my own, found while checking.** This morning I said I had made
the page copy honest. Two of the three edits landed; the third did not. The intro
still read "Secure your place with a £10 deposit and receive a free additional
copy" - because the real markup has `<b>&pound;10 deposit</b>` with bold tags
inside, and my search string was the plain text.

I used a bare `.replace()` with **no assert**, so it silently did nothing and my
verification did not cover that string. The page has been claiming a deposit is
taken at submit all day.

Now: "Secure your place with a £10 deposit, **taken when we confirm your slot**".
Verified with four assertions covering the intro, the checkbox, the button and
the absence of the old wording, so the page tells one consistent story.

That is the same failure as the widened forms check and the comment-matching
run: **a substitution with no assertion is a guess, not a change.** Every
`.replace()` in this codebase that matters now needs one.

### Dixit's dynamic bio system reviewed and carried over intact + link audit redirects (11/08/2026)

Dixit's 11/08 zip diffed clean against the 10/08 build: nine changes, all his,
none of the 10/08 fixes reverted. All nine are IN this build untouched:

- `netlify/edge-functions/franchise-bio.js` - serves `/franchises-bio/<slug>`
  from Supabase, coming-soon panel for incomplete profiles, proper escaping
- `franchise-bio-template.html` + the `/franchises-bio/*` template rewrite in
  `_redirects` (replaces Ashley's static route)
- `functions/find-memory-catcher.js` - public read of active franchisees
- `find-a-memory-catcher.html` - hardcoded cards removed (including the
  Salamata-temporarily-links-to-Ashley hack), now fetched with error fallback
- sitemap edge function extended with a bios query (graceful [] on failure)
- `[[edge_functions]]` block in netlify.toml
- `MIGRATION-LINK-AUDIT.md` - the B1 audit, run 11/08

**Gap found in review: the `franchisees` table has none of the columns his code
reads** (`commissions.sql` created it with six columns; the bio system reads
~19 more). Without them, the finder page errors for everyone, every bio shows
"coming soon" - including Ashley's, whose static page is now unrouted - and
bios never reach the sitemap. Wrote `supabase/franchise-bios.sql`: idempotent
column adds, `updated_at` trigger, Ashley's full bio seeded verbatim from her
static page, Salamata's card details preserved from the deleted hardcoded
block. Runbook item B2b. Her static HTML stays until the dynamic page is
verified live, then deletes.

**Pattern rule: code that reads a table is only half a change - the migration
that shapes the table ships in the same zip, or the feature is a 400 waiting
for launch day.** The repo's SQL must always be able to build the schema the
repo's code reads.

**B1 closed.** All 8 Section-1 URLs plus Section-2 targets now 301 in
`_redirects`, including a `/product-page/*` catch-all placed after the
canonical 200 rule (first match wins - no loop, verified by the link checker).
Judgement calls flagged in the runbook: `/vacancies` -> `/franchise`,
Wix junk pages -> `/`. Sections 3-4 handed to Mark as SEO recovery input.

### Dixit's three missing pages, and a gap in the audit's own coverage (11/08/2026)

Dixit listed three old URLs with no new equivalent: `/linktree`, `/vacancies`,
`/vacancy/studio-assistant`. Ryan's call: vacancies not rebuilt, linktree
rebuilt as a priority. Both now carry explicit comments in `_redirects` saying
which is which, so the next person does not have to guess whether a missing
page is an oversight or a decision.

**Then checked the audit against reality, and found a coverage gap.** The
crawler seeds from the OLD site's `sitemap.xml` and does not follow links, so
its 160 pages are "what Wix declared", not "what Google indexed". Searched the
old domain by hand and found two indexed pages absent from the audit AND from
`_redirects`: `/personalised-foil-print-gifts` and `/members`. Both would have
404'd on day one. Now 301'd.

A third, `/product-page/family-tree-print-personalised`, was also missing from
the audit but already covered - the `/product-page/*` catch-all added earlier
caught it. Good argument for the catch-all over enumerating the 13 known URLs.

**Pattern rule: an audit's coverage is its seed, not its output.** A
sitemap-seeded crawl cannot report what the sitemap omits, and the report will
still read as complete. Verify against an independent source before trusting a
clean result - here, Search Console's indexed-pages export on the old property,
which is the definitive list and is what the script's own error path already
recommends.

Zip deliberately NOT repackaged this round. These changes are staged in the
repo and go to Dixit in one package with the linktree page, per the standing
"consolidate rather than drip-feed at this stage" instruction.

### /linktree rebuilt (11/08/2026)

Built from the PDF of the old Wix page, structured like the Upload Portal's
welcome step at Ryan's direction: centred lockup header with no nav, hero image,
headline, lede, stacked full-width CTAs, compact footer.

Ryan's copy kept verbatim, split into an h1 and a lede so the page has a real
heading rather than starting on body text. Buttons reuse the shared `.cta`
component - only `width:100%` and `justify-content:space-between` are local, so
hover, focus and the arrow square stay identical to every other button on the
site. Fourth link uses a new `.cta.stone` variant (bone fill, stone square) so
"Book a call" reads as the softer option, matching the old page's hierarchy.
`Memory Catcher™ Franchise` carries the TM per the standing rule; the old page
had it bare.

**noindex, follow.** The page's whole content duplicates the site nav and its
traffic is the Instagram bio link, so indexing it would put a thin link list in
competition with the pages it points at for brand queries. Registered in three
places so nothing contradicts: `# exclude` in `_redirects` (out of sitemap.xml,
sitemap.html and llms.txt), `linktree.html` added to `NOINDEX` in
`build-seo.js` so no canonical is injected, and the meta tag itself. Reversing
it is a one-line change in each, noted in the page comment.

Added to `check-footer.js` EXEMPT with the reason stated - a 25-link site footer
would bury the four buttons the page exists for.

GA4 `linktree_click` events on each button. Without them the page is a black
box: every route off it is a new page or an app handoff, so GA4 would record a
pageview and nothing else.

OG image generated as a real 1200x630 centre crop of the page hero per the
standing rule (`assets/og-linktree-1200x630.webp`), not the raw 16:9 asset.

**And a preview bug of my own, caught by its own assertion.** The preview
builder asserted `'href="/' not in html` after disabling internal links - which
fails every time, because `data-real-href="/..."` contains that substring.
The code was right; the check was wrong. Now uses a lookbehind so an attribute
whose name merely ends in "href" cannot satisfy it.

Same family as the comment-matching false positives: **match on a boundary, not
a substring.** A check that cannot distinguish `href` from `data-real-href` will
either block good work or wave through bad.

### Linktree header overlapped the hero - a cascade bug, not a stacking one (11/08/2026)

Ryan spotted the lockup header sitting on top of the hero image in the preview.

**Cause.** `shared/styles.css` styles the BARE `header` element for the main site
nav: `position:absolute; top:44px; left:0; right:0; z-index:20`. That is correct
for the site - the nav is meant to float transparently over a full-bleed hero,
and every main page uses `<header>` with no class to get exactly that.

An element selector applies regardless of class, so `.lt-head` inherited it,
came out of normal flow, and landed on the image with an opaque background.
`.upf-head` on the upload portal escapes the same rule only because it declares
`position:sticky` - **I copied that component's look and dropped its
positioning, not realising the positioning WAS the override, not decoration.**

Fixed with an explicit `position:static; top:auto; padding:0` and a comment
saying why it must not be removed.

**Guard added to `check-footer.js`** - it now also fails the build if a
`<header>` carrying a class has no `position` declared in the page's own CSS.
Comments are stripped before matching, so the comment explaining the rule cannot
satisfy it. Scoped narrowly: bare `<header>` is untouched, since inheriting is
the correct behaviour there.

**The guard immediately found a second live instance:** `component-library.html`
had `<header class="lib-mast">` with only background and padding. Same latent
bug, never noticed because nobody scrolls an internal reference page. Also reset.

Lockup enlarged 30px -> 44px (38px mobile) at Ryan's request; `width`/`height`
attributes updated to 209x44 to match the SVG's 184.5:38.9 viewBox so the box is
reserved correctly and nothing shifts on load.

**Pattern rule: a component copied out of its page brings the rules it was
overriding, not the ones it declared.** Before reusing a block, check what bare
ELEMENT selectors in the shared sheet target the same tag - a class-based
restyle does not displace them.

**And the preview now has to prove the fix, not just show it.** The rebuilt
preview asserts that the offending `header { position:absolute }` rule is
actually present in the inlined CSS and that the page's override appears after
it. A preview that quietly dropped the bad rule would have looked perfect while
proving nothing.

### Linktree footer: brief legal formalities (11/08/2026)

Ryan asked for company and VAT numbers in the footer. The legal line is now
copied verbatim from the main site footer's `.foot-legal`, and the build asserts
the two match after whitespace normalisation - so if one is ever edited without
the other, it is caught rather than quietly drifting.

Note the wording says "The Bespoke Foil Company." with **no trademark symbol**.
That is deliberate and matches every other page: it is the registered company
name in a statutory statement, and given the open ™/® question in the runbook,
a legal formality is the last place to add an unverified symbol.

Added a Privacy Policy link beside it. The consent banner already links there,
but the banner disappears once dismissed and this page sets analytics, so the
route should stay reachable. Dropped the redundant home link - the lockup above
already goes there.

Left OUT deliberately: the "Website by Twine Growth" credit that appears in the
main footer. Ryan asked for brief. One line to add if he wants it.

`check-footer.js` exemption comment updated to say the page skips the nav and
the wordmark, not the legal statement - so nobody later reads the exemption as
"this page has no legal details" and adds a second copy.

### Same cascade trap, one tag along - the footer (11/08/2026)

Ryan: footer text needs to be white and vertically centred. The black band was
never mine - I set no background. `shared/styles.css` styles the bare `footer`
element for the main site chrome:

    footer { background:var(--ink); color:rgba(255,255,255,.7); padding:64px 40px 0 }

`.lt-foot` set a dark text colour but no background, so dark text landed on an
inherited black block. `.upf-foot` on the upload portal escapes it only by
declaring `background:transparent` - **the second time in one session that I
copied a component and dropped the very declaration that was holding it up.**

Kept the black band, since it anchors the page, but declared it explicitly and
set the text light using the same values as `.foot-legal` on the main footer
(`rgba(255,255,255,.55)`, links at `.7`). Padding is now symmetric `30px 20px`,
so the two lines sit centred in the band instead of riding the top edge.

**Guard generalised.** `check-footer.js` now covers a table of chrome elements
rather than just headers: a classed `header` must declare `position`, a classed
`footer` must declare `background`. Adding a third tag is one row. Comments are
stripped before matching so the comment explaining a rule cannot satisfy it.

**Verified by breaking it on purpose** - removed the background, confirmed the
build failed with the right message, restored it, confirmed green. A guard that
has never been seen to fail is an assumption, not a check.

**And the preview assertion was wrong again, on correct code.** It anchored the
inherited rule search on a preceding `}`; the footer rule is preceded by a
section comment, so it reported PREVIEW BROKEN on a page that was fine. Now
anchored on start-of-line. Same lesson as `data-real-href` an hour earlier:
**when a check fails, establish whether the code or the check is wrong before
touching either.** Two of the three failures today were the check.

### Checkout drawer copy + the homepage Apple Pay button (11/08/2026)

Three changes from Ryan, one of which was a real problem.

**1. Code field no longer names the scheme.** Toggle and label both now read
"Have a code?". The toggle hides itself on click, so the label becomes the
visible heading - the two reading the same is continuous rather than repetitive.

**2. The placeholder was showing a real code.** It read `e.g. ASHLEY-WIG` -
a live franchisee code on display to every visitor. Now blank. Low blast radius
(the runbook is right that a code cannot under-charge; the worst case is
crediting the wrong Memory Catcher) but there is no reason to hand it out.

**3. The homepage "Apple Pay" button was not an Apple Pay button.** It was
`<button class="pay-btn apple" id="expressPay">` with the Apple glyph, listed in
the SAME trigger array as "Buy now" - so tapping the Apple mark opened the
checkout drawer, not the Apple Pay sheet. Two problems, not one: it misleads the
customer, and Apple's Marketing Guidelines allow the Apple Pay button only to
initiate an Apple Pay transaction, so the mark was being misused. Same class of
issue as the Etsy logo already flagged in the runbook.

Removed. Real Apple Pay is unaffected - it comes from Stripe's Express Checkout
Element inside the drawer. **The product page and keepsake page were already
built correctly**, with one "Buy now" button and a note reading "Checkout in
seconds. Apple Pay, Google Pay & card." The home page note now matches them word
for word, so removing the button does not remove the signal that wallets exist.
The payment-chip row stays: a list of accepted methods is a different thing and
is allowed.

**Guard added** to `check-analytics.js`, same shape as the Etsy logo guard:
the build fails on any hand-drawn Apple Pay button. Comments stripped first.
**Verified by reintroducing the button and watching it fail**, then restoring.

### Affiliate codes disagree with the database - flagged, not fixed (11/08/2026)

Found while removing the placeholder. `validate-affiliate-code.js` queries
`franchisees.discount_code`. `commissions.sql` seeds Ashley as **ASHLEY10**;
`our-kit.html` and `keepsake-standalone.html` hardcode a map that shows the
customer **ASHLEY-WIG**. If the live row still says ASHLEY10, everyone arriving
on Ashley's affiliate link gets "not recognised" and she is credited nothing.

Not fixed here, deliberately: the seed is `on conflict do nothing`, so the live
table may well have been corrected by hand and I would be "fixing" it to the
wrong value. Runbook now carries the query to settle it. Root cause is that the
codes are client-side constants at all - they belong in the same Supabase table
Dixit just wired.

### Four checks wrong, zero code wrong (11/08/2026)

Worth recording plainly. Today's assertion failures: `data-real-href` matched as
`href`; a preview anchor that assumed `}` before a rule that had a comment
before it; a scope that swept in a JS comment as customer copy; a runbook anchor
typed with a hyphen where the file had an em dash; and a count assertion I
simply got wrong.

Every one was the check, not the work - and every one was caught before shipping
precisely because the assertion existed. **That is the trade working as
intended: a check that is wrong costs a minute, a substitution with no check
costs a day.** But it is also a signal to write anchors from the file's actual
bytes rather than from memory of what the file says.

### Inline wallet button - scoped, deliberately not built today (11/08/2026)

Ryan wants the Apple/Google Pay quick-pay button back on the home page, working
properly. Agreed it is the right end state. Scoped it into the runbook rather
than building it, for one reason that is a hard dependency rather than caution:

**the Payment Method Domain is not registered in Stripe yet**, so an inline
Express Checkout Element renders nothing at all today - no button, no error.
Building it now means shipping something that cannot be seen or tested until
after the very step that is blocking it, onto the highest-value surface on the
site, on go-live day.

The technical shape is also bigger than it looks. The drawer builds Elements
from a `clientSecret`, which requires a PaymentIntent, which requires a click.
An inline button needs Stripe's deferred-intent mode, which means the total is
computed in the browser before the server has priced anything - and
`create-payment-intent` is deliberately the single price authority, including
`KIT_POSTAGE` and the free-postage rules. Plus free postage at 2+ kits needs a
`shippingaddresschange` handler, which this codebase already documents as the
thing that silently kills every wallet button when wrong.

Recommendation on file: build it straight after the £1 SKU test proves the
webhook. That test already needs the domain registration, so the wallet button
becomes testable the moment it exists. Half a day, same class of work as the
slot-deposit SKU.

**What is true today, and is not a fudge:** the drawer shows the genuine Express
Checkout Element as its first block, revealed only on devices with a wallet. The
customer gets real Apple Pay one tap later than Ryan wants, rather than a
painted mark that goes nowhere.

### "What's included" lightboxes were dead on two of three kits (11/08/2026)

Ryan: the lightboxes work on the Premium Kit but not the other two. Correct, and
the cause was blunt - `our-kit.html` and `home.html` carried triggers for all
three kits but only ONE dialog, `inc-premium`. The handler is
`getElementById('inc-' + m.dataset.inc).showModal()`, so foil and framed threw a
TypeError on null: link does nothing, no message, nothing to indicate a fault.
`keepsake-standalone.html` had all three all along.

Lifted the two missing dialogs from the keepsake page verbatim (its premium
dialog is byte-identical to our-kit's, so the pages are known to share this
markup) and inserted them in the same order. The `.inc` CSS already lives in
`shared/styles.css`, so no styling work was needed.

**Found a second, pre-existing bug while doing it.** Both pages shipped an
orphan `</dialog>` immediately after `</footer>` - 1 opening tag against 2
closing. Browsers silently discard it, which is why it survived. Removed.

**Guard added** to `check-forms.js`: every `data-inc="x"` must have a matching
`<dialog id="inc-x">`, and `<dialog>` tags must balance. Verified by renaming a
dialog id and watching the build fail.

This is the shape of bug that survives testing: one of three works, whoever
checks clicks that one and moves on. **When a control is repeated N times, test
all N - a passing sample of one proves only that the code path exists.**

### Hero proof line: divider was invisible on one of the two pages (11/08/2026)

The `.tp-sep` divider added earlier was `background: rgba(0,0,0,.2)`. That reads
correctly on `our-kit.html`, whose hero is light. `keepsake-standalone.html` has
a DARK hero and inherits white text from `shared/styles.css` - so the divider
was a black line on a dark background, i.e. gone. And gone in the worst way: it
just looks like the spacing is off, not like anything is broken.

Now `background: currentColor; opacity: .32`, which takes the hero's own text
colour and adapts to both. Guard added to `build-trustpilot.js` so a fixed
colour cannot come back; verified by reintroducing one and watching it fail.

**Pattern rule: a component used on both a light and a dark surface cannot carry
a fixed colour.** `currentColor` is not a shortcut here, it is the correctness
condition.

### Etsy proof copy tweaked (11/08/2026)

Ryan: "New to Trustpilot, but not to this:" becomes "We're new to Trustpilot,
but not here:". Changed in `ETSY_NOTE` inside `build-trustpilot.js`, not in the
pages - the script strips and reinserts that paragraph on every build, so a
direct HTML edit would have been silently reverted on the next deploy.
Regenerated across all four pages carrying it.

### Dixit's testing round: forms, CAPI, video (11/08/2026)

**Item 4 - Our Story video restarted on pause. FIXED.** The click listener sat
on the frame, and mount() puts the `<video>` INSIDE that frame. Every click on
the video's own native controls bubbled back up, ran mount() again, and built a
fresh autoplaying element. Pause looked like a restart because it was a
different video starting at 0. Fixed with arm()/disarm() so the listener comes
off the moment the video exists; the error path re-arms. role and tabindex come
off too, since a wrapper announcing "Play our story video, button" around a real
video with native controls is wrong to a screen reader.

**Items 1 and 2 - the form problem was much worse than the brief said.**
`submit-lead.js` was written for one form. Five now post to it and only the
community sign-up identified itself. Consequences, all confirmed in the code:

- every submission emailed as "New Memory Catcher franchise enquiry"
- the body rendered a FIXED franchise field list
- **`notes` was rendered nowhere at all.** The contact form puts the customer's
  entire message in `notes`. The slot form puts the baby's name there. The
  Memory Catcher enquiry puts the whole enquiry detail there. Three forms were
  writing to a field nothing read. Every contact message received through this
  site has been silently discarded.
- forms smuggled identity into prose prefixes ("CONTACT FORM. ") and stuffed
  placeholders into required fields, so Ashley got franchise enquiries from
  people in the town of "contact form"
- CAPI fired for everything at `value: 3445`, the franchise Founders Pricing,
  telling Meta a contact message was worth GBP 3,445

Rewritten around a FORMS registry: each form owns its label, subject, CAPI
config and target table. **The email now renders every submitted field**, known
ones in ask-order and anything else after, so a field nobody thought about
still arrives. Validation is per form, so no form needs to invent placeholder
values to pass. Supabase write happens BEFORE the email; only a failure of both
returns an error to the customer.

CAPI per Ryan (11/08): all forms except community fire Lead. Franchise and
mc-enquiry carry 3445; contact and slot fire with **no `value` key at all**
rather than 0 - a zero is a real datapoint worth nothing and still enters
value-based bidding, an absent one does not.

`supabase/leads.sql` adds `leads` and `community_signups`. Community is its own
table per Dixit, with `email` unique and `merge-duplicates` on insert - so a
repeat sign-up updates rather than firing the welcome automation twice. RLS on
both, no anon policy: service role only.

**Guard added** to `check-forms.js`: anything posting to submit-lead must send a
valid `formType`. Verified by removing one and watching it fail. The runtime
fallback still catches a missing formType, which is exactly why it needs a build
check - a silent misroute that still returns 200 is never noticed.

**Pattern rule: a shared endpoint needs the caller to say what it is.** Every
failure here came from one handler inferring intent from prose written by five
different forms.

### Dixit's blog hub carried over, plus two dead links (11/08/2026, afternoon)

Diffed Dixit's latest zip against the build sent this morning. **Four
differences, two of them macOS `.DS_Store` junk.** Nothing of either side's
work was lost in the round trip.

His two real changes, both NEW work, both preserved byte-identical:
- `blog.html` gains ~46 lines: the sticky-header behaviour and the blog hub
  list that renders posts from Supabase. Traced it through every prior zip -
  the block appears in none of them, so this is new, not something dropped.
- `functions/blog-posts.js` adds `featured` to the column select.

**`featured` does not exist on `blog_posts`.** Same shape as the bio columns
this morning: PostgREST rejects the WHOLE select on an unknown column, so the
blog would return 400 and render no posts at all, not merely lose the featured
flag. Appended an idempotent migration to `franchise-and-blog.sql` plus a
partial unique index so only one post can be flagged. If Dixit already added
the column by hand it is a no-op - which is the point.

Checked the live test deploy rather than guessing, and was careful about what
that proves: `web_fetch` does not run JavaScript, so an empty blog list there
is expected either way and settles nothing. It DID confirm the morning's work
is live and correct - the Trustpilot copy, all three "What's included"
lightboxes, and the removed Apple Pay button.

**Two dead links found, one of them prominent.** `home.html` shipped
`<a class="cta on-dark" href="#">Learn about our work with Tommy's</a>` - the
charity section's call to action, going nowhere. `check-internal-links`
resolves every href but `#` is a legal same-page anchor, so it sailed through.
Now points at `/tommys-charity`. Also pointed the login page's dead "Forgot
password?" at `/contact`, which is honest while no auth exists.

**Guard added** to `check-internal-links.js`, and it had to be careful:
`memory-catcher-region-map.html` legitimately ships `href="#"` on `#cardMore`
because JS assigns the real target per region. The guard excuses any anchor
whose id is assigned a href in the same file. Verified both ways - fails on the
Tommy's link, passes the region map.

**Pattern rule: "every link resolves" is not "every link goes somewhere."**
A checker that only validates paths will pass `#` forever.

### Refund policy: I had it backwards (11/08/2026)

Ryan pulled me up on the commissions brief. **Head office absorbs refunds. A
franchisee's commission is never clawed back.** Searched back through the July
2026 conversations and it was settled then, alongside the other money rules:
40% in-person, 20% affiliate, on the VAT-inclusive amount actually paid after
discount, free shipping, payment within 14 days of month end.

**What I got wrong.** I read `transactions` not being updated on refund as a
bug, and recommended the Hub read `commissions` instead precisely BECAUSE it
reverses commission on refunds. That is the opposite of the agreed policy. Had
it been built that way it would have introduced clawback and quietly under-paid
franchisees - the exact failure I claimed to be preventing.

The behaviour is correct as built. `commissions` records reversals for head
office monitoring; `transactions` is the franchisee-facing ledger and stays
untouched. They are two deliberate views, not two ledgers in conflict.

**A second thing the search turned up:** the Hub is not a from-scratch build.
`commissions.html`, the `EARNINGS_DATA` contract, the `/api/earnings` function,
Ashley's 483-order backfill, the verified Shopify in-person webhook and the
Supabase auth frontend all exist from July. The brief now says to reuse them,
and flags that July's Wix affiliate webhook is superseded by this repo's Stripe
one, and that two versions of the `franchisees` table exist across the two packs
- this repo's has no `auth_user_id` at all.

**Pattern rule: when someone says "we've been through this", search before
answering.** Every fact I needed was in the history. Reasoning from the code
alone told me what the system DOES, and I mistook that for what it SHOULD do -
a policy question the code cannot answer.

### Linktree into Utilities, and the Etsy proof line reworded (11/08/2026)

**Linktree listed under Utilities** at Ryan's request, matching the pattern
`/franchisee-login` already uses. That puts it in `sitemap-static.json`,
`sitemap.html` and `llms.txt`.

**The noindex had to come off with it.** A URL submitted in a sitemap while
carrying `noindex` is a contradiction Search Console reports as an error, so all
three signals were changed together: the `_redirects` comment, the meta tag, and
the NOINDEX list in `build-seo.js`. The page now carries a canonical. The code
comment spells out all three places to touch if the decision reverses, because
changing one of them alone produces a page that disagrees with itself.

Worth noting `generate-sitemaps.js` already had a `util` tag for exactly the
middle case - listed on the human sitemap page, kept out of sitemap.xml and
llms.txt. If Ryan only wanted it findable rather than indexed, that is the tag,
and it is a one-word change.

**Etsy proof line** is now "Rated 4.9/5 over 2,000+ Etsy reviews", Trustpilot
half unchanged per Ryan. Changed in `HERO_ETSY` in `build-trustpilot.js`, not in
the pages - the script strips and reinserts that span on every build, so an HTML
edit would have looked right and reverted on the next deploy. Incidentally the
hero now carries a scale ("/5") where before it just said "4.9".

**Found a latent layout bug while doing it.** `.hero-proof .tp-jump` declares
`gap: 6px 14px` - a 6px ROW gap - but never set `flex-wrap`, so the row gap was
dead and the line could never wrap. At 13px the Trustpilot lockup is ~225px and
the Etsy half ~230px, so the pair already overflowed a 390px phone before this
change and the longer copy makes it worse. Below 520px the line now wraps, and
`.tp-sep` is hidden when it does, because a vertical divider stranded at the end
of the first line reads as a rendering fault. The bar stays in the DOM so the
build-trustpilot guard requiring it still passes.

**Pattern rule: a declared row-gap on a container that cannot wrap is a bug
signal.** Someone intended wrapping; the property that enables it was missing.

### Homepage order block aligned with the product page (12/08/2026)

Ryan: match the product page - black button, quantity stepper - but keep the
personalisation choices OFF the home page so it stays an impulse buy.

**The button was my regression.** `shared/styles.css` styles `.card-btn`
transparent, which was correct while it sat BENEATH the wallet button as the
secondary choice. On 11/08 the fake Apple Pay button was removed from home (it
was a painted Apple mark wired to the ordinary drawer trigger), which promoted
the card button to being the only CTA - and the styling should have been
promoted with it. It was not, so the sole buy button on the site's most
important page has been receding into the porcelain background since.
`our-kit.html` and `keepsake-standalone.html` both already carried the black
override, and keepsake's carries a comment explaining this exact reasoning.
I removed the button without reading the comment that predicted the consequence.

Fixed with a local override rather than changing the shared rule, deliberately:
if the inline wallet button scoped in the runbook is ever built, the card button
goes back to being secondary and transparent is right again. The comment says
so, so the next person does not have to rediscover it.

**Quantity stepper and postage nudge ported from our-kit.** The CSS is extracted
verbatim by script rather than retyped, so the two blocks cannot drift.

The wiring detail that matters: `shared/checkout.js` documents `setQty` as
"keeps the page in sync", because the DRAWER has its own +/- and calls back.
Home's stub was `setQty: n => { qty = n; }` with no re-render, which was
harmless when the page had no stepper and would have left a stale number behind
the drawer the moment it did. Now `setQty: n => { qty = n; renderQty(); }`.
`selectKit` also no longer sets the price directly - `renderQty` owns it, since
it is unit x quantity, and the old line would have flashed the unit price
whenever the kit changed with 2+ in the basket.

Verified by running the extracted block against a DOM stub: quantity, price
multiplication, both nudge states, the fill bar, the min/max disabled states,
and the drawer calling `setQty` back.

**Personalisation note, home-specific copy.** The product page's note points
"above" at the colour and wording pickers. Those do not exist on home, so
pointing at them would be nonsense. The home version says the decision is not
needed yet and names the upload portal, matching the gift note already on
our-kit so both pages tell the same story.

**Note on scoping.** home.html previously carried NO local CSS at all. `.note`
is a generic class already defined locally, and differently, by
keepsake-standalone and memory-catcher-earnings-calculator, so putting these
rules in the shared sheet would have reached pages that never asked for them.
Local block, blast radius of one page.

**Two of my assertions were wrong again, both over-broad.** An em-dash check
scanned the whole file and caught two inside a quoted customer review that
predate the edit; a JS parse check treated the JSON-LD block as JavaScript.
Both were fixed by scoping to what actually changed. Same lesson as yesterday:
when a check fails, establish whether the code or the check is wrong first.

**Left alone, flagged to Ryan:** those two em dashes are in a customer's own
quoted words. House style says hyphens, but silently editing a review's
punctuation is Ryan's call, not mine.

### Homepage burger did nothing - one page of 31 (12/08/2026)

Ryan reported the hamburger menu not working on home. First check was whether
the style block added minutes earlier had broken it. It had not: the same fault
is present in Dixit's zip, so it predates today entirely.

**The cause: home.html carried the burger markup and the `<nav id="navMenu">`,
but no click handler.** The other 30 pages all wire it. Nothing flagged it
because both halves of the markup were present and correct - only the wiring was
missing, and a button that does nothing throws no error, logs nothing, and looks
identical to one that works.

The nav toggle is **copy-pasted into 31 separate pages** rather than living in a
shared file. That is precisely how one page comes to be missed, and the page it
was missed on was the most important one on the site.

Fixed by copying the canonical block verbatim from `contact.html` (24 pages
carry a byte-identical copy; the rest differ only in whitespace and a comment).

**Guard added** to `check-forms.js`, checking both directions: burger markup
with no handler, and a handler with no `navMenu` to open. Verified by stripping
the handler and watching the build fail.

**Post-launch, not now:** this belongs in `shared/nav.js`, loaded once. That
would remove the duplication that caused the bug and make the guard redundant.
Touching 31 pages days before launch is not the moment; the guard holds the line
until then.

**Worth noting how it was found.** No automated check caught this, and none of
the guards written today would have. Ryan clicked the button. The build chain
verifies structure - that links resolve, that tags balance, that pages carry the
right tags - and none of that can tell whether a control does anything when
pressed. Structural checks and someone actually using the site are not
substitutes for each other.

### Upload portal: thank-you email + WhatsApp welcome (12/08/2026)

Dixit's brief, built into `functions/upload-portal-complete.js`. Order as
specified: ticket, then Mandrill, then WhatsApp. Both skipped entirely when
there is no ticket id (Ryan, 12/08 - strict reading of the brief), with a
warning logged so the silence is explained rather than mysterious.

**The trap worth recording: this is the first Mandrill TEMPLATE send in the
repo.** The three existing calls use `messages/send.json` with raw HTML. A
stored template with a merge variable needs `send-template.json`, and its
`template_name` takes the template SLUG, not the display name in the dashboard.
Passing "Upload Portal - Thank you" would return `Unknown_Template` - and since
the call is caught and logged, the visible result is simply no email. Env-
overridable via `MANDRILL_UPLOAD_TEMPLATE`, defaulting to
`upload-portal-thank-you`, so a wrong guess is a dashboard fix rather than a
redeploy.

**Second Mandrill trap: `res.ok` is not enough.** A rejected recipient - hard
bounce, denylist - comes back as HTTP 200 with a per-recipient
`status: "rejected"` inside a JSON array. Checking only the HTTP status would
log a success while nothing was sent. Both shapes are inspected.

`merge_language` is deliberately NOT set, so Mandrill uses the template's own
setting and this works whether the template was built with `*|FNAME|*` or
`{{FNAME}}`. Forcing either would break the other.

**Placed after the PATCH, not before.** The row is marked complete with its
ticket id first, so if either call hangs or the function is cut short, the
submission stays correctly recorded and the customer is never told to upload
again. Before the PATCH, a hung automation would leave a finished submission at
"pending", inviting a resubmit and a duplicate ticket. The existing idempotency
guard means a retry returns early, so neither call can fire twice.

**Both calls capped at 4s via AbortController.** Netlify allows a synchronous
function 10 seconds and this handler has already spent some of it verifying
objects and signing links. Without a cap, a third party that hangs turns a
successful upload into a 500 the customer sees.

**Auth code: env-first with a literal fallback** (`WHATSAPP_AUTH_CODE`), after
Dixit revised the earlier decision. The fallback means a missing env var cannot
silently stop customers being messaged, and the code can be rotated in the
Netlify dashboard without a redeploy.

Worth being precise about what that buys: **rotation, not secrecy.** The literal
is still in source, so the secret is still in the repo and in every zip that
crosses WhatsApp. Deleting the fallback is the step that actually removes it,
and that should only happen once the variable is confirmed set in Netlify -
otherwise the automation stops dead. The function logs a warning whenever the
fallback is in use, so which code is live is never a guess.

Verified against a stubbed transport across every path: happy, Zendesk down,
unknown template, rejected recipient, WhatsApp 502, and a hanging endpoint.
Every one returns 200 to the customer; every failure logs with the reference.

### Serverless functions were never syntax-checked (12/08/2026)

Noticed while working on the above: nothing in the build chain has ever looked
at `functions/` or `netlify/edge-functions/`. **18 function files, zero
coverage.** A typo in a handler was invisible until deployed - and these are the
files that take payments, raise tickets and record leads, so "found in
production" means a lost order rather than a broken layout.

`check-forms.js` now parses every one. `functions/` are CommonJS and edge
functions are ESM, so each is checked with the right parser - checking an ESM
file as a script reports a false failure on its first import. The file's own
syntax wins over the folder convention. Verified by breaking one of each.

A syntax check is not a test. It proves the file parses, not that it works.
Worth having anyway at this price.

### Add-ons receipt subject, and a correction I had to make first (12/08/2026)

Changed to "Your add-ons are confirmed (#...)" at Ryan's request.

**Worth recording how this came up, because I got there via a false alarm.** I
told Ryan both Stripe receipts carried "identical subject lines" and would read
as a duplicate charge. Ryan reasonably heard that as duplicate emails being sent
and asked what needed rectifying. Neither part was true:

- Two purchases produce two receipts. Nothing fires twice.
- The subjects were never identical. `order-number.js` gives the kit
  `KS-xxxxxxxx` and the add-ons `ADDON-<ref>-xxxxxxxx`, so the references
  differ and the add-ons one is prefixed clearly enough to survive truncation
  in a mobile inbox.

I had seen the same template string in both files and reported that as
identical output without checking what it rendered to. **Same failure as the
refund policy earlier today: reading the code and reporting it as the
behaviour.** A template string is not a subject line until something
interpolates it.

What remained was real but minor: both opened with the same four words. Naming
it at the first word rather than the twenty-seventh character is a clarity gain,
not a fix, and the comment in the file says so, so nobody later reads it as
having repaired a bug.

### Coupon field unstyled outside our-kit (12/08/2026)

Dixit: the code box design is broken and the field is too small.

**Cause.** `shared/checkout.js` injects its own `DRAWER_CSS`, so the drawer is
styled on any page that mounts it - except that six rules were never added to
it: `.cd-codetoggle`, `.cd-codewrap`, `.cd-coderow`, `.cd-code`,
`.cd-codeapply`, `.cd-codemsg`. Those exist only page-local in `our-kit.html`
and `keepsake-standalone.html`. So on any other page mounting the drawer -
home.html does - the code row falls back to a raw browser input and a default
grey button, which is exactly the screenshot.

Ported all six into `DRAWER_CSS` using our-kit's own values so the two cannot
diverge, plus two fixes: `min-width` on the input goes from 0 to 9rem so the
Apply button can no longer squeeze it flat, and `align-items: stretch` keeps
the two the same height.

**A false alarm on the way, worth recording.** Mid-investigation I found
`shared/styles.css` has no `.cd-*` rules at all and was about to report that the
homepage drawer is entirely unstyled - a severe claim. Checking first showed
`checkout.js` injects the CSS itself. **Reporting that without looking would
have sent Dixit chasing a bug that does not exist.**

And a fourth wrong assertion today: the check confirming the rules had landed
used an over-escaped regex through the shell, so it reported MISSING on
correctly inserted CSS. Verified with substring checks instead. **Escaping
through two layers of quoting is where these keep going wrong; prefer
`includes()` over a regex when the pattern is a literal.**

### Comparison-band CTA: cannot reproduce from the code (12/08/2026)

Dixit reports the Choose Your Kit button under the comparison table rendering
broken on `/memory-catcher/salamata-bah`. Checked all three layers:

- markup is the standard `.cta` pattern, identical to buttons that render fine
  elsewhere on the same page
- `shared/styles.css` gives `.cta{display:inline-flex}` and
  `.cta .sq svg{fill:none;stroke:var(--ink)}`, both correct
- the edge function only replaces `'__MC_DATA__'` and the robots meta, and
  returns the right content-type - it does not touch that markup

So on this build it should render correctly, and a preview of the real markup
against the real CSS is the evidence. Most likely the deploy under test predates
a fix. Not changing code on a fault that cannot be reproduced - a speculative
"make it robust" patch would obscure the real cause if it is still there.

### Consent banner was covering buy buttons - and the payment form (12/08/2026)

Carried over from the add-ons thread, where the same collision had stopped
orders since relaunch. Verified against this repo rather than assumed, and it is
worse here than the brief described.

**Confirmed:** the banner is `position:fixed; left:16px; bottom:16px;
z-index:2147483000`. `our-kit.html`, `keepsake-standalone.html` and
`franchise.html` each pin a `.sticky` buy bar at `bottom:0; z-index:50`. At
390px the banner spans x16 to x356 and the bar's Buy now button is
right-aligned around x280 to x374, so the button is substantially covered on all
three. The bar is mobile-only (`display:none` above 920px) and slides in on
scroll, so this is a phone problem exclusively - which is most of the traffic.

**The brief missed a worse collision.** A z-index audit of every fixed layer
found: header 20, sticky bar 50, **checkout drawer 200, nav menu 200**, banner
2147483000. So the banner also sat on top of the payment drawer. On mobile the
drawer panel is bottom-anchored, meaning the banner could take taps meant for
the pay button inside the checkout itself.

**Fix, two parts.** z-index drops to 150 - clear of the header and the sticky
bar, below anything modal, so an open drawer covers it with its own scrim
instead of fighting it. And the vertical offset is now measured rather than
hardcoded: `place()` reads any `.sticky` bar and sits above it.

**One detail the suggested snippet got wrong:** it added
`env(safe-area-inset-bottom)` on top of the measured bar height. The bar's own
padding is already `calc(12px + env(safe-area-inset-bottom))`, so its measured
height includes the inset and adding it again lifts the banner by that inset
twice. Safe area is now applied only when there is no bar. The card's own
`padding-bottom` lost its inset for the same reason.

Repositions on resize, since crossing the 920px breakpoint changes the answer.
Tested against a DOM stub at bar heights 0, 70 and 104.

**Guard added** to `check-analytics.js`: the banner's z-index must sit strictly
between the sticky bar and the modal layer, and it must not hardcode a bottom
offset. Verified by restoring the old value and watching the build fail.

**NOT fixed, deliberately: the Pixel is not consent-gated.** All three pages
load it with zero `bfc:consent` listeners, so `_fbp` and `_fbc` are set before
any choice while the banner says "Nothing is stored until you choose". That is a
real gap, but gating the Pixel would cut measured conversions on a page taking
paid Meta traffic. That is a commercial decision for Ryan, not a bug fix.

### Banner copy made accurate; Pixel left firing (12/08/2026)

Ryan's call: keep tracking, change the wording. Done.

Before: "We use cookies to see how the site is used. Nothing is stored until you
choose."
After: "We use cookies to see how the site is used and to measure our
advertising. Choose below, or read our Privacy Policy."

The old sentence was false - the Pixel writes `_fbp` on load with no gate. The
new one stops asserting something untrue without advertising the gap.

**What the check turned up, and it reframes the trade.** Every conversion
already fires server-side through Meta CAPI: Purchase from `stripe-webhook.js`,
Purchase from `addons-stripe-webhook.js`, Lead from `submit-lead.js`. **The
browser Pixel fires nothing but PageView.** So gating it would cost zero
conversions - only the retargeting audience pool, which builds from PageViews,
and some CAPI match quality from losing `_fbp`. That is a genuine cost for a
business buying Meta traffic, but far smaller than "we lose tracking", and worth
knowing when the decision is revisited.

**Honest note for whoever reads this later: accurate copy is not the same as
lawful.** PECR requires consent before non-essential cookies are set, whatever
the banner says. This is a commercial risk decision Ryan has taken with the
facts in front of him, not a compliance fix, and it should not be recorded as
one. The privacy policy says only that visitors "can choose to accept or
decline", which does not repeat the false claim, so nothing further needs
changing there.

### Why the coupon fix "did not work": shared JS is cached for 7 days (12/08/2026)

Ryan reported the coupon field still broken after the fix. It was not the fix.

`netlify.toml` sets `/shared/* -> Cache-Control: public, max-age=604800`. Seven
days, **no revalidation**. `styles.css` was hand-versioned with `?v=N` so CSS
changes land; the JavaScript was not versioned at all:

    shared/analytics.js          no version, 40 pages
    shared/trustpilot.js         no version, 31 pages
    shared/community-signup.js   no version, 25 pages
    shared/checkout.js           no version, 2 pages

So a fix inside a shared script simply does not reach anyone who has visited in
the last week. **Both of today's fixes were behind that wall** - the coupon
styling in `checkout.js`, and the consent banner that was covering buy buttons
in `analytics.js`. The second is the serious one: a checkout-blocking bug fixed
in a file nobody would receive.

`styles.css` also showed the same rot in miniature: `?v=28` on 34 pages, `?v=25`
on 3, so those three served a stale stylesheet.

**Hand-maintained versions failed twice** - once by versioning the CSS and
forgetting the JS, once by bumping 34 pages and missing 3. So
`scripts/stamp-assets.js` now derives the version from an 8-character content
hash of each shared file and rewrites every reference on every build. Change a
file and its URL changes; change nothing and the URL is stable, so caching still
does its job. Runs after the build-* scripts, before the check-* ones, because
the earlier scripts rewrite HTML and would drop the stamps. Verified idempotent:
135 references, second run rewrites nothing.

**Guard added** to `check-analytics.js`: no `/shared/*` reference may ship
without `?v=`. Verified by stripping one and watching the build fail.

**On the three surfaces Ryan asked about**, all now carry the same fix from the
one change to `DRAWER_CSS`: home mounts the drawer with no local rules, the
product page mounts it with local duplicates that the injected CSS overrides
(it is appended to head at runtime, so it wins ties), and the affiliate page is
the product page served through the edge function, which only swaps the MC data
and the robots meta.

**Pattern rule: a long cache lifetime on a shared asset is a deploy switch that
is off by default.** The header and the versioning strategy are one decision,
not two, and splitting them across files is how a fix ships without shipping.

### The affiliate button: I had been checking the wrong file (13/08/2026)

Ryan reported the Choose Your Kit button still broken on
`/memory-catcher/salamata-bah`. On 12/08 I checked `our-kit.html`, found the
markup and shared CSS both correct, and said I could not reproduce it.

**That page is not our-kit.html.** Fetching the live URL gave it away: the
`og:url` reads `keepsake.thebespokefoilcompany.co.uk`, so the edge function
serves **`keepsake-standalone.html`**. Its own line 2684 says why it is
different: *"this page does NOT load shared/styles.css"*. It is genuinely
standalone, all CSS inline, because it is also served on its own subdomain.

Its only `.cta` rule was `.cta{margin-top: 32px}`. No `display: inline-flex`, so
the label stacked above the arrow square. No `.cta .sq svg { fill: none }`, so
the path rendered as a solid black triangle at the SVG's default size, inside an
unstyled browser button. That is the screenshot exactly.

Inlined the component verbatim from `shared/styles.css`.

**The lesson is the expensive one.** I verified the markup, the shared CSS and
the edge function, and every one of those checks passed - on a file that was
never being served. Confirming which file a URL actually returns should come
before inspecting any of its contents. The live fetch answered in one request
what a day of reading the repo did not.

**Guard added** to `check-footer.js`: a page that does not link
`shared/styles.css` but uses `.cta` must define the layout rules locally.
Verified by stripping the rule and watching it fail.

**And a self-inflicted detour worth recording.** The first attempt at that guard
printed "guard added" and did not check it had landed - it had not. A print
statement is not a verification. The second attempt reads the file back and
asserts the text is present. Two other assertions today were wrong rather than
the code: one counted CSS mentions of `kc-compare-row` as markup rows, one used
a window too small to reach the second cell of a table row.

### Three comparison rows on ink versus foil (13/08/2026)

Ryan's brief, added to both `our-kit.html` and `keepsake-standalone.html` and
asserted byte-identical between them:

- **The finished keepsake** - real foil never fades, against ink on paper that
  does. Kept separate from the existing Foil process row, which is about the
  bonding method rather than the outcome
- **If a print is not perfect** - smudges tidied before foiling, against one
  chance and buying another kit
- **A backup, forever** - prints digitised, so more can be ordered, applied
  across the range, and the PDF proof kept, against a single physical copy where
  fading or water damage loses the moment for good

The third is the strongest argument on the page: every other row compares a
feature, that one compares what happens when something goes wrong.

### Add-ons app merged from the standalone zip (13/08/2026)

Ryan sent the current app to replace the stale copy in this repo. It is a
**merge, not a replace** - checking file by file found three places where the
repo was the newer side, and one where a wholesale copy would have broken the
kit checkout.

**Taken from the zip:**
- `addons/index.html` - 117KB to 182KB. Brings the 09/08 follow-up-mode
  redesign (`POST-STD` forced postage) and the cookie banner fix
- 44 new assets, plus `404.html`, `robots.txt`, `shared/analytics-addons.js`
- `functions/addons-create-payment-intent.js` - adds NAME_POSITION and NAME_FONT
- `functions/addons-stripe-webhook.js` - adds test-order marking and the new
  field labels

**Kept from the repo, deliberately:**
- **`functions/order-number.js`. The zip's version has no
  `buildKitOrderNumber`**, and `stripe-webhook.js`,
  `affiliate-commission-webhook.js` and `get-order.js` all call it. Overwriting
  it would have broken kit order numbering and the affiliate commission
  webhook. The repo's version is a superset serving both formats
- `functions/get-order.js` - the diff is comments only, and the repo's are fuller
- The webhook's **"Your add-ons are confirmed"** subject from 12/08, which the
  zip predates. Re-applied on top of the zip's newer body

**Not copied:** the zip's `netlify.toml`, `_redirects`, `package.json` and
`preview.js`. They configure the standalone subdomain deployment. In this repo
they would be inert, because the main build reads the root `functions/`
directory - and an inert config file that looks authoritative is worse than no
file at all.

Verified after merging: every function parses, every endpoint the app calls
exists in the root functions directory, every referenced asset is present,
`buildKitOrderNumber` still reaches all three callers, and the full chain is
green.

**Pattern rule: "replace with the newer version" assumes one side is newer.**
Here neither was, in whole. Four of six shared functions had the repo ahead or
level, and one of them was load-bearing for a different part of the site
entirely.

**Left alone at Ryan's instruction:** the locked variant stays until the
WhatsApp templates are updated later today, at which point browse-only becomes
purchase-enabled.

### Mark's live technical audit: 12 errors, all fixed (13/08/2026)

**Ten broken images and a dead script on /add-ons-exclusive-discount-938476.**
The add-ons app uses RELATIVE paths - `assets/hero-091-1200.webp`,
`shared/analytics-addons.js` - because on its subdomain deployment it sits at
the site root, where those resolve. Served here at
`/add-ons-exclusive-discount-938476`, the browser resolves them against the
VISIBLE url, so they land on the main site's `/assets/` and `/shared/`, which
have no such files.

Fixed with two fallback rules. Netlify serves an existing static file before
applying a rule without `!`, so these only fire for paths with nothing behind
them: the main site's own assets are untouched. Verified by simulating Netlify's
resolution for all eleven reported URLs plus four main-site assets.

Of 38 add-ons assets the only filename shared with the main site is
`hero-196-1200.webp`, and the two are the same photograph at a marginally
different crop - so the one case where the main site wins is invisible.

The tidier fix is to 301 those three routes to the subdomain and delete the
duplicate app. Not done: the subdomain could not be reached from here to confirm
it serves those exact paths, and this is now a live site.

**Noindex page in sitemap: /franchisee-login.** It carried
`<meta robots="noindex">` while a full category comment in `_redirects` put it
in sitemap.xml - so the sitemap asked Google to index a page that forbids it.
Switched to the `util` tag: still on the human sitemap page where a franchisee
can find it, out of sitemap.xml, robots and llms.txt.

**My own fix broke something, and the existing guard caught it.** The two
fallback rules had no comment, and `generate-sitemaps.js` files an untagged 200
rule under "Other" with a label derived from the URL. So the public sitemap
briefly listed a page called "Analytics Addons.Js". `check-internal-links`
flagged it as a missing asset within one run. Both rules now carry `# exclude`.

**Guard added** to `check-internal-links.js`: any page in `sitemap-static.json`
whose HTML carries a noindex meta fails the build. Verified by restoring the old
comment and watching it fail.

**And a verification of mine that verified nothing.** After yesterday's add-ons
merge I checked "every asset it references exists" and it reported
`total referenced: 0`. It looked for absolute `/assets/` paths; the app uses
relative ones. A check that finds nothing to check passes trivially - had it
counted zero matches as a failure, these ten broken images would have been
caught before they reached the live site rather than by Mark afterwards.

### Upload portal: BCC and the missing ShipStation order (13/08/2026)

**No BCC on the upload thank-you, and the same gap on add-ons.** Ryan asked me
to check the other forms too, and there was a second: `addons-stripe-webhook.js`
sent the order confirmation to the customer only. `stripe-webhook.js` and
`submit-lead.js` already BCC'd. Both fixed, using the existing pattern including
the guard against BCCing a customer whose address happens to match.

**ShipStation production order was never ported from Zapier.** The old Wix flow
was: catch hook, Zendesk find user, Zendesk create ticket, **ShipStation create
order**, Mailchimp, GET. That ShipStation step never made it into
`upload-portal-complete.js`, so an upload raised a ticket and stopped - nothing
reached the studio queue.

It matters well beyond the studio. This is the "manual order" whose despatch
fires Email 5 and, seven days later, the Trustpilot invitation. **With no order
there is no despatch event, so the whole back half of the lifecycle never
runs** - the customer never hears their print is coming, and never gets asked
for a review.

Built to mirror the kit order in `stripe-webhook.js`. Decisions worth recording:

- **orderNumber is the upload reference (UP-XXXXXXXX), not the customer's
  original order number.** The kit order already occupies that number, and two
  ShipStation orders sharing one number is how a studio ships the wrong thing.
  The original is in `customField1` and at the top of the notes
- **orderKey is the row id**, so a retry updates the same order rather than
  creating a duplicate
- **unitPrice is 0** - the customer paid when they bought the kit, and a price
  here would double-count in ShipStation's reporting
- Personalisation, proof channel and social consent go in `customerNotes`,
  because that is what the studio actually reads when picking

Runs after the PATCH and before the email, matching the old Zapier order, and
caught separately so a ShipStation outage cannot stop the customer's
confirmation. Verified both ways against a stubbed transport.

**Needs confirming:** what the old Zapier step used as the order number. If the
studio is used to searching on something else, this should match it.

### Coupon codes: two systems, not one bug (13/08/2026)

"Codes work on the add-ons app but not the main website." Not a fault - they are
different mechanisms:

- **Add-ons app** validates **Stripe promotion codes** via
  `stripe.promotionCodes.list`, giving a percentage or amount off
- **Main website** validates **Memory Catcher affiliate codes** against
  Supabase `franchisees.discount_code`, granting a **free extra copy** and
  crediting commission. It has no price-discount path at all

So a Stripe promo code typed into the main site correctly reports "not
recognised". So does an affiliate code that is not in the table - which is where
the unresolved **ASHLEY10 vs ASHLEY-WIG** mismatch may be biting.

Every failure path returns the same message, so a missing env var, a Supabase
error, an unknown code and the wrong KIND of code are indistinguishable to
whoever is testing. Awaiting Ryan on which code he tried before changing
anything.

### Stripe promotion codes on the main site (13/08/2026)

Ryan had typed a Stripe discount code into the main checkout. It was rejected
because the main site only ever validated Memory Catcher affiliate codes against
Supabase, while the add-ons app validated Stripe promotion codes. Two systems
behind one input, and nothing on screen said which kind the field wanted.

Now one field accepts both. `validate-affiliate-code.js` tries the franchisees
table first, then falls through to `stripe.promotionCodes.list`, returning
`kind: 'affiliate'` or `kind: 'coupon'` so the drawer can word the confirmation
correctly.

**The discount is applied in `create-payment-intent.js`, never from the
browser.** Same rule the affiliate code already followed - a discount the client
can name is a discount the client can invent. An invalid code at payment time
returns a 400 rather than silently charging full price: a customer who typed a
code and then sees the full amount taken is worse off than one told it expired.

Applied to the product subtotal, not postage - postage is already free at 2+
kits or GBP 75, and discounting it too would stack two offers never designed to
combine. The Stripe 30p floor is handled the same way as the add-ons app.

Verified against a stubbed Stripe across seven cases: no code, percent off,
amount off, an oversized discount, a discount with free postage already applied,
an invalid code, and a non-GBP coupon. The drawer summary was rendered in three
states to confirm the discount row appears only when there is one.

**Three self-inflicted detours, all the same root cause.** Anchors were written
from a mental model of the file rather than its bytes: `\"` was used where the
file has a plain `"`, twice, and a `json()` helper was called that this file
does not have. That last one is the instructive one - **`node --check` passed on
it**, because an undefined function is a runtime error, not a syntax error, and
this was in the payment path. Reading the actual characters with `ord()` settled
in one command what three guesses had not.

### OG images: agreed months ago, never actually implemented (13/08/2026)

Ryan shared a live link on WhatsApp and no image appeared. Three faults, none
visible in a browser:

- **35 of 40 pages had no `og:image` at all**
- The four that did pointed at `keepsake.thebespokefoilcompany.co.uk` and
  `franchise.thebespokefoilcompany.co.uk` - subdomains left behind by the
  migration. **A 404 behind an og:image is indistinguishable from no og:image**
- The remaining one was `.webp`, which WhatsApp's link preview does not reliably
  render

A social preview only fails where you cannot see it: in somebody else's chat.
Nothing in the build was checking, and nothing on the page looks wrong.

**Now implemented as agreed:** each page gets a 1200x630 crop of its own hero,
JPEG, at `assets/og/<page>.jpg`, referenced by absolute www URL. Heroes are
resolved by skipping the shared nav overlay first - every page's literal first
image is `mc-what-1100.webp` from the nav menu card, which is not the hero. Eight
pages with no hero of their own fall back to the home hero.

**Crops are generated ahead of time and committed, not built on Netlify.**
Resizing needs an image library, and adding one to the build for something that
changes only when the photography changes would be a dependency earning nothing.
The regeneration snippet is in `scripts/README.md`. `build-og.js` writes only
tags, so it stays dependency-free, and fails the build if a crop is missing.

Also writes `og:image:width` and `height` - without them the first share of a
link often renders with no picture while the crawler fetches the file - and
places the block straight after `</title>`, because crawlers read a limited
prefix and a tag below a large inline stylesheet can be missed.

**Guard added** to `check-analytics.js`: a shareable page must have exactly one
og:image, absolute and on www, pointing at a file that exists on disk. Templates
carrying a `{{placeholder}}` filled per request by an edge function are skipped.
Verified by restoring an old subdomain URL and watching it fail.

**And a fix that erased itself.** I added `noindex, follow` to `sitemap.html`
directly. `generate-sitemaps.js` rebuilds that file from
`scripts/sitemap-template.html` on every build, so the edit was gone on the next
run - and it took build-og's tags with it, which is how the ordering bug
surfaced. The meta now lives in the template, and `build-og` runs AFTER
`generate-sitemaps` rather than before.

**Pattern rule: before editing a file, check whether anything generates it.**
An edit to a generated file survives exactly until the next build, and the
symptom appears somewhere unrelated.

### Coupon accepted but not applied, and the iOS zoom (13/08/2026)

**The discount never reached the server.** `create-payment-intent` runs ONCE,
inside `openCheckout()`, when the drawer opens. A code entered afterwards was
never sent - `window.__couponCode` was still null at the moment of the call. So
the customer saw "98% off your order" in green and would have been charged the
full amount.

The worst shape of bug: the validation was right, the server arithmetic was
right (tested across seven cases yesterday), and the two were never introduced.
Testing the validator and testing the pricing both passed while the journey
between them was broken.

Applying a code now calls `refreshForCode()`, which re-runs `openCheckout()`.
That function was already written to be safe to re-run - it unmounts the
Elements and starts again, which is exactly what a changed amount requires,
since Stripe Elements bind to one PaymentIntent. The code field keeps its value
because the drawer markup is injected only on first open.

**Affiliate codes had the identical bug** and it was invisible, because they do
not change the price. They carry the attribution that credits a Memory Catcher,
and any code applied after the drawer opened was silently dropped - the sale
went through at the right price with nobody credited. Both branches now refresh.

**iOS zoom on focus.** `.cd-code` and `.cd-email` were both `font-size: 15px`.
iOS Safari zooms the whole page when a focused input computes below 16px, and on
a bottom-anchored drawer that pushes the panel off screen and exposes the page
behind it. Raised to 16px, with a comment saying why so nobody trims it back.
The add-ons app had already solved this the same way - the fix existed in the
codebase and had not been carried across.

**Pattern rule: a value read at call time is not a value sent at click time.**
`openCheckout` reads `window.__couponCode` when it runs. Setting that variable
later changes nothing unless something re-runs.

### The iOS zoom was site-wide, not one field (13/08/2026)

Ryan asked whether the email field was fixed too. It was - both drawer inputs
went to 16px in the same change. But checking properly rather than answering for
the one field found **twelve rules across the site** setting focusable controls
below 16px:

- `.community-form input` in shared/styles.css - the newsletter sign-up, on 25 pages
- the contact form, the franchise enquiry form, the blog search
- the Memory Catcher enquiry, the slot reservation form
- **the entire upload portal form**, which is the worst of them: a long form,
  used on a phone, by someone holding a baby

All raised to 16px. Labels, help text and buttons left alone - only focusable
text controls get the zoom.

**Guard added** to `check-forms.js`. Verified by dropping the contact form back
to 15px and watching it fail.

**Two process notes.** The first attempt at the guard used an anchor that now
appears five times in that file, so nothing was inserted - and the test that
followed "passed" against a guard that did not exist. Appending a self-contained
block is the reliable shape when a file has accumulated several. And the fix
already existed in the add-ons app, which uses 16px throughout for exactly this
reason: **the answer was in the codebase and had not been carried across**, same
as the .cta component on keepsake-standalone last week.

### Card checkout: three faults, one of them bricking (13/08/2026)

Ryan pushed the card path deliberately looking for failures and found all three.

**1. Pressing Pay with a field incomplete killed the checkout permanently.**

    cdPayBtn.innerHTML = '<span class="spin"></span>';   // destroys #cdPayLabel
    ...
    document.getElementById('cdPayLabel').textContent = orig;   // reads the node it just removed

That throws on null, so the two lines after it - re-enabling the button and
restoring its label - never ran. The button sat disabled with a spinner until
the page was reloaded. There was no try/finally either, so any throw from
`confirmPayment` (a dropped connection is enough) did the same.

Replaced with `setPayBusy()`, which keeps `#cdPayLabel` in the DOM in both
states, plus try/catch/finally so the button always comes back. **A pay button
that cannot recover is worse than one that never worked, because the customer
has already committed.**

**2. Error messages outlived the problem.** `cdError` was cleared only at the
start of the next `confirm()`, so "Please enter an email for your order
confirmation." sat there after the email was typed. Now cleared on input, and on
`change` from the Stripe payment and address Elements - their fields are in an
iframe, so an input listener cannot see them.

**3. The phantom "Loading secure payment..." button.** `openCardPath` swaps the
start button's label while it mounts. `openCheckout` reset that button's
`hidden` and `disabled` but not its **text**, so reopening the drawer brought it
back still wearing the loading label - reading as a permanently loading,
unclickable button. Worse, `openCardPath`'s catch captures the current text as
"original" and restores it, so once wrong it stayed wrong. The label is now
captured once at init and reset alongside the other two properties.

**A wrong turn worth recording.** The first attempt at fix 2 wrapped
`openCardPath` to attach the listeners afterwards. It would never have run:
line 457 does `addEventListener('click', openCardPath)`, which captures the
original function reference, so reassigning the binding later changes nothing.
Caught by checking how the function was bound rather than assuming.
**Reassigning a function that something already holds a reference to is a no-op
that looks like a fix.**

### Add-ons app merged again: header trim (13/08/2026)

Second merge of the standalone app. Diffed file by file as before, and this time
the split was cleaner: **only the front end had moved.**

**Taken from the zip:** `index.html` (+6,287 bytes, the header trim) and
`README.md`.

**Kept from the repo:**
- `addons-stripe-webhook.js` - the entire diff was my own two changes reverting:
  the "Your add-ons are confirmed" subject (12/08) and the `EMAIL_BCC` to head
  office (13/08). The zip carried nothing new, so it was left alone completely
- `order-number.js` - the zip's still has no `buildKitOrderNumber`, which
  `stripe-webhook.js`, `affiliate-commission-webhook.js` and `get-order.js` all
  call. Same trap as the first merge, caught the same way
- `get-order.js` - comments only, and the repo's are fuller

Byte-identical either way: `addons-create-payment-intent.js`,
`validate-coupon.js`, `_shared/render-order-email.js`, `404.html`, `robots.txt`,
`shared/analytics-addons.js`, and all 44 assets.

Verified after: the 09/08 follow-up mode and `POST-STD` survive, all 30
referenced assets exist, every endpoint the app calls is present in the root
functions directory, every function parses, and the chain is green.

**Two checks of mine were wrong again, both of the same kind.** The asset check
parsed a whole `srcset` as one path and reported twelve files missing that were
all present. And a font-size sweep flagged a 14px rule as a zoom risk when it
was the announcement bar, not an input. **Both reported a problem where there
was none, which is the safer direction to be wrong in, but it is still noise
that costs a round of investigation.**

Worth noting for later: `check-forms.js` only scans HTML at the repo root, so
the add-ons app is outside every guard written this week. It is a separate
deployment, so that is defensible - but it means the 16px input rule, the
Apple Pay rule and the rest are enforced on the main site only.

### Deep merge of Dixit's 13/08 tree, plus guards and OG for the add-ons app

Full tree diff: 46 files differed, nothing added or removed on either side.
Classified every one rather than eyeballing:

- **28** differed only by my OG tags and cache stamps
- **9** differed only by my 16px input fix
- **2** were generated (`sitemap.html`, `sitemap-static.json`)
- **1** was the changelog
- **6** were files where mine is verifiably newer, confirmed by checking what
  Dixit ADDS in each: `check-forms.js` and `shared/checkout.js` returned **zero**
  added lines, so his copies are simply mine from an earlier point. His
  `checkout.js` still carried the pay-button bug and 15px inputs

**Dixit's actual new work was one thing, and it would not have worked.**

He added a `personalisationRows` block to `addons-stripe-webhook.js` so add-ons
confirmations show the customer's choices. Two things stopped it:

1. It passed `personalisation_rows`, but the template reads
   `data.personalisation`. Wrong key, so the rows were built and discarded
2. The add-ons webhook requires `_shared/render-order-email.js`, which **has no
   personalisation block at all** - zero references

That second point explains his other change. He repointed `stripe-webhook.js`
from `./render-order-email` to `./_shared/render-order-email`, which reads as
consolidating on one template - sound intent, since a helper in the functions
root gets bundled as if it were an endpoint. But `_shared` was the SMALLER of
the two copies, so as written it would have **stripped personalisation from
every kit confirmation email** while still not adding it to add-ons.

Resolved by finishing what he started: the root copy is a strict superset
(`_shared` has nothing it lacks), so it was promoted into `_shared`, the root
copy deleted, and both webhooks now point at the one template. Dixit's rows are
merged under the key the template actually reads, and his `-` label separator
was an em dash reaching a customer's inbox, so it is now a hyphen.

Verified by rendering both emails: kit orders keep their personalisation block,
add-ons orders gain one, and it is omitted when there is nothing to show.

### The add-ons app is no longer unguarded

Flagged this morning: every guard written this week reads the repo root only, so
the app taking the upsell revenue had no automated checks at all.

`check-forms.js` now covers it - deliberately in the same script rather than a
new one, so it cannot be skipped. Five checks, each proved by breaking it:

- inputs below 16px (the iOS zoom, on a checkout page)
- exactly one `og:image`, absolute, on www, JPEG, and present on disk
- no hand-drawn Apple Pay button
- every relative asset actually exists inside `addons/`
- every `/.netlify/functions/` endpoint it calls exists in the root functions dir

**The absolute-URL rule is deliberately NOT applied to its asset paths.** The app
is served both at its own subdomain root and under a main-site URL, so relative
paths are correct there and enforcing the main-site rule would break it.

It also had **no og:image at all**, so every shared add-ons link previewed
blank. Generated from its own hero, JPEG, absolute on www so one image serves
both deployments.

### Studio notification on upload portal submit (14/08/2026)

The old Wix site emailed hello@ a full table of every submitted field the moment
someone used the upload portal. It was never ported, so the only signal an upload
had happened was the Zendesk ticket.

**This is not the BCC added on 13/08**, and the distinction matters. That BCC
copies head office on the CUSTOMER's thank-you, which says "we have received
your prints" and carries no detail at all - no order number, no personalisation,
no file links. Proof the customer was written to; useless for doing the work.

Field order follows the old Wix email exactly, so anyone used to it finds things
in the same place: name, email, phone, order number, purchased from, receiving
proof, the two personalisation lines, font, layout, card and foil, frame,
the file uploads, photo and video, address. Plus social consent, the upload
reference and the Zendesk ticket id.

File links are the same Supabase signed URLs, 90 day expiry, so they still open
weeks later and die at roughly the point the retention sweep removes the files.
Reply-To is set to the customer, so the studio can just hit reply.

**Sent whether or not Zendesk raised a ticket.** If the ticket failed, this email
is the only record an upload happened, which is exactly when it matters most.
The customer thank-you stays gated on the ticket, per Ryan's 12/08 decision.

**A bug caught only by executing it.** The first version used `escapeHtml`,
which this file does not define - it had never needed one, because everything it
built previously was plain text for Zendesk or a Mandrill template. `node
--check` passed, because an undefined function is a runtime error, not a syntax
error. It would have thrown on every single upload. Third time this week that
distinction has mattered: **parsing is not running.**

Now defined and genuinely needed - the table interpolates customer-supplied
values into raw HTML, so a name with an apostrophe would otherwise break it.
Verified with "Beth O'Ball", which escapes correctly.

### BCC removed from the upload thank-you (14/08/2026)

Ryan's call, and the right one. The BCC was added on 13/08 because nothing told
the studio an upload had landed. `sendStudioNotification()` now does that
properly, so copying head office on the customer's message as well would put two
emails in hello@ per upload - the useful one buried under a copy of a customer
message carrying no detail.

Verified: exactly one email reaches hello@ per upload, and it is the
notification. The customer still gets their thank-you.

**Left in place elsewhere, deliberately.** `stripe-webhook.js`,
`addons-stripe-webhook.js` and `submit-lead.js` all still BCC. There the BCC IS
the record - no separate internal notification exists for an order or a lead, so
removing it would leave nothing. The rule is one useful email per event, not
zero.

### Pre-deploy checkout audit: six bugs, two of them costing money (14/08/2026)

Site is live, so this pass traced the whole path and EXECUTED it rather than
reading it. Six faults.

**1. Buying from the homepage gave no confirmation at all.** The `?paid=1`
handler assumed the page provided `#successPanel`, `.buy-label` and `#kits`.
home.html has none of them, so `panel.hidden = false` threw on null and nothing
after it ran. A customer who paid from the homepage came back from Stripe to an
ordinary page with `?paid=1` still in the address bar and no acknowledgement.
**The obvious next move is to pay again.** Proved by running the block against a
DOM without the panel.

The module now injects its own confirmation - `.success-panel` is already in
DRAWER_CSS - and every page-specific tidy-up is optional. Placement is `main`,
then after `header` (home has no `main`, and its first body child is the nav
overlay), then body. Tested on all three page shapes.

**2. The Memory Catcher offer never applied.** `/memory-catcher/<slug>` serves
keepsake-standalone.html, which sent `affiliate: MEMORY_CATCHER.slug` but never
`affiliateCode`. The slug credits commission; it is the **code** that sets
`free_extra_copy`. That page's headline offer is "use the exclusive Memory
Catcher code to receive a FREE extra copy of your print", there is no code input
on it, and nothing else could ever have sent it. **Every customer arriving from
a Memory Catcher link was promised an extra print and did not get one.**

**3. Same bug, different shape, in the shared drawer.** The prefill filled the
code input from MEMORY_CATCHER but never set `window.__mcCode`, which is what is
actually sent. Nobody presses Apply on a field that already looks filled in. Now
sets the state and shows the confirmation message.

**4. A failed re-price left a live stale intent.** `openCheckout` re-runs on a
quantity change and on applying a code, but never cleared `activeClientSecret`
or `elements` before asking for a new intent. On failure it returned early with
both still set, leaving "Or Pay with Card" enabled against the PREVIOUS amount -
so a customer told "20% off your order", then shown an error, could still pay
full price. Both nulled up front.

**5. The pay button lost its amount.** `PAY_LABEL` was captured at init as a bare
"Pay", so `setPayBusy(false)` after a declined card overwrote "Pay GBP 54.90"
with "Pay" - dropping the figure at the moment the customer decides whether to
retry. Regression from my own 13/08 fix. Now captures the current label.

**6. The server's specific error was being swallowed.** An expired code returns a
400 saying exactly that; the drawer replaced it with "checkout could not start",
sending the customer to refresh a page that fails the same way. The server's
message is now preferred.

**Guard added:** the SKU maps in the four senders must match the server
CATALOGUE. They currently agree - `BFC-KIT-PREM`, not `BFC-KIT-PREMIUM` - but
drift there means one kit silently cannot be bought while the others work, which
nothing else would catch.

**Verified by execution, not reading:** all three kits price correctly, charge
always equals the displayed total across every combination of quantity, coupon
and affiliate code, both code types stack correctly, invalid input returns a
clean 400, and the confirmation renders on all three page shapes.

### Live: no customer was getting an order confirmation email (14/08/2026)

Dixit's Netlify logs, three times in seven minutes:

    ERROR  Order email failed (non-blocking): orderNumber is not defined

`orderNumber` existed only as a PROPERTY NAME inside the ShipStation order
object. The email block further down referenced a bare `orderNumber` identifier,
which was never declared. ReferenceError on every order.

**The shape of this matters.** The email is wrapped in a non-blocking catch, so
the payment succeeded, ShipStation got the order, and the log line scrolled past
in a dashboard nobody watches. From the inside everything looked fine. The only
casualty was the thing only the customer sees.

**A second one was hiding behind it.** With `orderNumber` fixed, the same block
threw `subtotal is not defined` - used twice, declared nowhere. The first
ReferenceError had been stopping execution before it could be reached. Only
found by running the webhook again after the first fix.
`addons-stripe-webhook.js` had both declared properly all along.

**And a third, this one mine.** `discount_amount` was hardcoded to `0`.
create-payment-intent started applying Stripe promotion codes on 13/08, so a
discounted receipt listed GBP 49.95 + GBP 4.95 and then a total of GBP 44.91 -
a total that does not match the lines above it, with no explanation. Now read
from `coupon_discount_pence`, with the code passed as the label. The template
already had a discount row waiting for a non-zero value.

Verified by running the real webhook end to end across six order types: each of
the three kits, quantity 2 with free postage, a discounted order, and an
affiliate order. All six now send, with correct names, references and totals
that add up.

**A guard was written for this and then removed.** A static undefined-identifier
check flagged `auth`, `ssOrder` and `orderNumber` in
`addons-stripe-webhook.js` - all three declared with `const` a few lines above
their use. Tracking every binding form in JavaScript by regex is not something
to half-do, and **a guard that cries wolf is worse than none: it teaches
everyone to ignore a red build.** The reliable tool is ESLint's no-undef, which
needs a build dependency and should not be added mid-incident. The reasoning is
recorded in check-forms.js so the next person does not repeat the attempt.

**Pattern rule, third time this week: parsing is not running.** `node --check`
passed on all three of these. Every one was found by executing the function
against a stubbed transport.

### Meta CAPI is not firing at all (14/08/2026) - Ryan to action

Same logs: `WARN CAPI skipped: META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set`.

On 13/08 I told Ryan that gating the browser Pixel behind consent would cost no
conversions "because every conversion already fires server-side". **That was
wrong in practice.** The code is there, but without those two environment
variables it does nothing, so Meta is currently receiving no Purchase or Lead
events from the server AND only PageView from the browser.

Two variables in Netlify, then redeploy. Until then, ad attribution is blind.

### Mobile performance: what is safe today and what is not (14/08/2026)

Could not read the PageSpeed report - the scores load client-side, so fetching
the URL returns only the shell. Audited the source instead.

**Already good, no action:** the LCP hero is eager, has width and height, and
carries `fetchpriority`; later slides are lazy. Preconnects to the font hosts
exist, `display=swap` is set, Trustpilot loads async. 51KB hero.

**Applied (safe):**
- **Fraunces weight 560 dropped** - requested on 36 pages, used zero times
  anywhere. Verified across every HTML file and the stylesheet before touching it
- **Preconnect to js.stripe.com** on the 3 pages that load it. Stripe.js is a
  render-blocking third-party request, so opening the connection early is a
  straight win with no behaviour change

**NOT applied, deliberately.** The real cost is three render-blocking scripts in
`<head>`: analytics.js, js.stripe.com and checkout.js (44KB). The obvious move is
`defer`, and it would break the site: **`BFCCheckout.init(...)` is called from an
inline script in the BODY**, so a deferred checkout.js would load after that call
and throw "BFCCheckout is not defined". Checkout would stop working entirely.

Doing it properly means moving the init call into the module or wrapping it in a
ready queue - a real change to the payment path, on a live store, the same day
six checkout bugs were fixed. Not today. Worth doing deliberately when there is
room to test it.

**Italics kept.** Dropping them looked like a clean win until a safety assertion
caught that three pages use `font-style: italic` - the region map, its embed, and
the blog post template. Trimming them site-wide would have broken those, and
maintaining two font URLs is a worse trap than the saving is worth: same-URL
fonts are cached across the whole session anyway.

**The assertion is the point.** It was written to fail if the variant was in use,
and it did. The change was reverted before it was written rather than found later
in italics that silently rendered upright.

### PageSpeed 61 on mobile, LCP 13.4s - what was fixed (14/08/2026)

Scores: Performance **61**, Accessibility 92, Best Practices 100, SEO 100.
FCP 4.5s, **LCP 13.4s**, TBT 130ms, **CLS 0**, Speed Index 5.1s.

CLS 0 and TBT 130ms are excellent and must not be traded away for anything.
LCP is the emergency: nearly three times the "poor" threshold.

**Diagnosis.** Not image weight - the hero already has srcset, sizes, explicit
dimensions and `fetchpriority`, so mobile pulls a 28KB variant, and the other
seven slides are lazy. The problem was queueing: PageSpeed measured **1,190ms of
render-blocking** and **242 KiB of unused JavaScript**. Stripe and the 44KB
checkout module sat in `<head>` on three pages, delaying first paint AND
competing with the hero for bandwidth on throttled 4G.

**Fix: moved, not deferred.** `defer` would have broken checkout outright -
`BFCCheckout.init(...)` runs from an inline block in the body, and a deferred
module loads after it and throws "not defined". Instead both tags now sit
immediately above the block that uses them, so **execution order is
byte-identical** and no shim is needed. Verified first that nothing above that
point references `Stripe()` or `BFCCheckout`.

    home.html               3 blocking scripts -> 1
    our-kit.html            3 -> 1
    keepsake-standalone     2 -> 1

Only `analytics.js` still blocks, and that is deliberate: Consent Mode wants to
initialise before anything measures.

**Also applied:** Fraunces weight 560 removed (requested on 36 pages, used zero
times), preconnect to js.stripe.com, and footer headings h4 -> h3 across 32
pages to close the `h2 -> h4` skip Lighthouse flagged. `.foot-col h4` was the
only rule targeting them, retargeted to h3, so nothing changes visually.

**Not chased:** "efficient cache lifetimes, 278 KiB" is third-party - `/assets/*`
already carries `max-age=31536000, immutable`. GA, Trustpilot and Stripe set
their own TTLs.

**Left for Ryan, deliberately not changed on a live store:** four touch targets
below 44px - `.qty-stepper button` (38px), `.foot-social a` (34px),
`.nav.cta .sq` (28px), `.reviews-head a img` (15px). The stepper is the one that
matters, since it is how someone buys two kits, but enlarging it changes checkout
layout and that is not a change to make blind on the same day six checkout bugs
were fixed.

### The heading change broke a page, and the check found it (14/08/2026)

Ryan set a standing rule: only changes that cannot break anything. Re-checking
today's work against it immediately turned up one that had.

The h4 -> h3 footer change replaced `<h4>` and `</h4>`. One heading on
`keepsake-standalone.html` carried a class - `<h4 class="f-h4-gap">` - so only
the CLOSING tag matched. That left:

    <h4 class="f-h4-gap">Opening hours</h3>

Malformed HTML on the affiliate page. Browsers recover silently, so nothing
looked wrong, and it also lost its `.foot-col h3` styling while three siblings
kept theirs. **No existing check would have caught it**: the footer structure
check passed, links resolved, the build was green.

Fixed, and `.f-col .f-h4-gap` targets the class rather than the tag so the
spacing survives. `sitemap.html` still shows h4s but is regenerated from
`scripts/sitemap-template.html` every build, so it is internally consistent -
no mismatch there.

**Guard added** to `check-footer.js`: any heading opening and closing at
different levels fails the build. Verified by breaking one and watching it fire.

**The lesson is about the shape of the edit, not the tag.** A bulk
find-and-replace on `<tag>` misses every instance carrying an attribute, and the
result is a half-converted element rather than an untouched one. When replacing
tags, match `<tag` and `</tag` with the attributes allowed for, or do not do it
in bulk at all.

### Merge, Salamata's page, and the email shell scaffolding (14/08/2026)

**Merge.** 44 files differed; 36 were explained line by line by my own changes
earlier today (og tags, cache stamps, Fraunces 560, footer h4 to h3, the 16px
inputs, the Stripe and checkout script moves) and four more were only my own
comment text matching the search. The single genuine difference was
`_shared/render-order-email.js`, where **my copy is 244 bytes larger** - Dixit's
is missing the "We have these on file" note that came across in the superset
promotion. Kept mine. He has picked up that consolidation: the root copy is gone
from his tree too.

**New from Dixit:** `assets/email/` - 45 files, 2.3MB of imagery for the shell
template. Merged as-is.

**Salamata's bio removed, without touching her commission.** Both the bio page
and the affiliate code lookup gate on `active = true` in `franchisees`, so
setting her inactive would have taken the page down AND killed her discount code
and attribution in one move. Those are separate decisions.

Instead there is now an `UNPUBLISHED_BIOS` set at the top of
`franchise-bio.js`, which returns the same `notFound(context)` an unknown slug
already gets - a path that is already live and tested, so no new behaviour. The
same set filters `sitemap.js`, because listing a URL that 404s hands Google a
dead link. To publish her later: delete one slug.

**Email shell: built, tested, wired to nothing.** Dixit's step 8 moves the four
senders onto a `bfc-shell` Mandrill template with copy in `email_content` and
branding in `email_config`.

**Neither table exists anywhere in this repo**, and nothing defines the merge
variables `bfc-shell` expects. Implementing against a guessed schema would mean
a query that 400s or a template that renders empty, on the live payment path,
the day after order confirmations were found broken for exactly that class of
reason. Against Ryan's standing rule, that is not a change to make.

So `functions/_shared/send-email.js` exists, fully tested, and **nothing imports
it**. It is off unless `EMAIL_SHELL_ENABLED=true`, and every caller will pass the
HTML it already builds as `fallbackHtml`: if the flag is off, the table is
missing, the template is unknown, or Mandrill rejects the send, it falls back to
today's exact email. Verified across all four paths - flag off, everything
present, table missing, template missing - and it sends in every one.

The assumed schema is written into the file under CONTRACT. If Dixit's differs,
one function changes and nothing else.

### Microsoft Clarity added (15/08/2026)

Added to `shared/analytics.js` rather than pasted into 40 pages - same reason
gtag lives there: one measurement id to keep in step, and the cache stamp
already handles versioning. All 40 pages carry it.

Loaded `async`, so it does not touch the render-blocking work from yesterday -
still one blocking script in head on home and our-kit, LCP path unchanged.

**Consent is left as Ryan's choice, and the code supports either.** Clarity has
its own setting under Settings -> Cookie consent:

- **Off (its default):** records from page load, exactly as the Meta Pixel does
  today. The banner copy changed on 13/08 already covers it - "we use cookies to
  see how the site is used"
- **On:** records nothing until it receives `clarity('consent')`, which the code
  sends the moment someone accepts, and on any later change

So the position can be changed in the Clarity dashboard with no redeploy.
Verified by execution across every state: the tag loads in all cases, consent is
sent on load for a returning visitor who accepted, sent immediately when someone
accepts, and **never sent when they decline**.

**Worth stating plainly for whoever reads this next.** Clarity is a step beyond
a pixel: it replays what a visitor did - movement, clicks, scrolling. It masks
text input by default, so card and address fields are not captured, but it is
still a recording of a real person using the site. If any tracking here should
require consent first, this is the one. The toggle is in the dashboard.

### Clarity: corrected to consentv2, and what a denial actually does (15/08/2026)

Ryan asked the right question - if someone declines, do we still get the
recording? Checking rather than answering from memory turned up two things.

**The API I shipped was deprecated.** Microsoft replaced `clarity('consent')`
with `clarity('consentv2', { ad_Storage, analytics_Storage })` and the old one
is on the way out. Now using v2.

**And v2 must be called on DENIAL too, not just on grant.** Under v1 you only
signalled acceptance. Under v2 a denial is a real instruction: Clarity drops to
no-consent mode, sets no cookies, and treats every page view as a new visitor.
Staying silent is not the same as saying no. The listener now sends the state
either way, and sends nothing at all before a choice has been made.

**The honest answer to the question.** "Recording" does not stop entirely in
either case - what changes is cookies and session continuity. Consent granted
means cookies and a visitor stitched across pages. Denied means no cookies and
each page view counted as a separate person, so funnels and returning-visitor
numbers become unreliable.

**And it is not optional for us.** Since 31 October 2025 Microsoft enforces
consent automatically for EEA, UK and Swiss traffic. Essentially all BFC traffic
is UK, so this applies whatever the Clarity dashboard toggle says - which makes
sending an accurate signal the difference between usable analytics and
fragmented ones, not just a compliance question.

### Memory Catcher onboarding form (15/08/2026)

Camille is signed, so onboarding needed documenting rather than improvising.
Field list derived from what the code actually reads, not invented.

**What the system already wants: 26 fields across five surfaces.** Affiliate page
(name, slug, code, photo), bio page (tagline, bio lead/about/offer, socials,
WhatsApp, meta), directory (full name, address, covering, short description,
photo), territory map (map_region_slug), Hub (email as login and as reply-to on
her customer emails). Plus things no page reads but you cannot operate without:
Shopify POS location for in-person attribution, her @bfc address, the display
name on her emails.

**A trap worth recording: onboarding is not data entry today.** The affiliate
landing page hardcodes `/assets/mc-<slug>.webp`, a file that has to be committed
and deployed, while the bio page and directory read the `photo` COLUMN with a
generic fallback. So a new franchisee needs both, and setting only one leaves her
half-published - a broken image on one page, a stranger's photo on another.
`mc-camille-ashforth.webp` does not exist yet. Worth changing the affiliate page
to read the column like the others, which would make onboarding pure data entry.

**Built:**
- `supabase/franchisee-onboarding.sql` - a STAGING table, deliberately not
  `franchisees`. That one is live on four surfaces; an intake row landing there
  would publish a half-finished profile on first save. The promotion mapping,
  including the two photo steps that are not database rows, is in the file
- `franchisee-onboarding.html` - eight steps, 29 fields, same shape as the
  upload portal. Routed at `/mc-onboarding`, noindex, `# exclude`
- `functions/franchisee-onboarding-submit.js` - writes the row, emails Ryan the
  full table with Reply-To set to her. Notification non-blocking: she has filled
  in eight steps and the row is saved, so a Mandrill outage must not tell her it
  failed

**The copy questions are human, not a bio box.** Ryan writes the page copy from
her answers (his call), so the form asks "if you met a new mum at a class, how
would you introduce yourself?" rather than presenting a field labelled "bio".
Asking a new franchisee to write her own marketing copy gets you either nothing
back or something that does not sound like the brand.

**Steps ordered by what unblocks her earliest** - identity, area and code before
profile copy and print. A half-finished form still gets her sellable. Bank
details deliberately absent; handled separately.

**Two guards caught this build**, which is the first time they have caught my own
new work rather than a regression:
- `build-og` - no OG image for the new page
- `check-forms` - the form had no `method="post"`. Without it, a JS failure makes
  the browser GET every field into the URL, **including her home address**, and
  from there into server logs and GA4. That guard was written on 11/08 for
  customer forms and it just paid for itself on a staff one.

### Taken regions: the process for onboarding a Memory Catcher (16/08/2026)

Ryan's spec: when a Memory Catcher takes a region, the area goes unavailable on
the map and the regional page, the card stays CLICKABLE, and Register Your
Interest becomes a way through to that person's profile.

**What was actually wrong.** `franchise-region-template.html` hardcoded five
per-region values, so the region page contradicted its own card in the finder:

    Status              always "This region is available"
    Sidebar CTA         always "Register Your Interest"
    Hero heading        always "Become a Memory Catcher in <region>"
    Hero CTA            always "Register Your Interest"
    Franchise Potential always "Either" - the card said Full-Time
    Founders Price      always GBP 3,445 rather than the region's own

So bolton-wigan showed "Unavailable" on the card and "This region is available"
on the page, with two buttons inviting applications to a region Ashley already
holds. All six now come from the edge function.

**And the card was a dead end.** `.fr-card.unavailable .cta { pointer-events:
none }` made a taken region unclickable while still looking like a link. Now
`opacity: .82` - still visibly different from an available region, but a real
link, and labelled "View Region & Memory Catcher".

**How the link is resolved.** From `franchisees.map_region_slug`, which already
existed - no new column, no second source of truth. Unpublished bios are
excluded using the same list as `franchise-bio.js`, because sending someone to
"view your Memory Catcher" and landing them on a 404 is worse than showing
nothing.

**Two failure modes, both fail safe.** A region marked taken with no franchisee
pointing at it, or one whose bio is unpublished, falls back to Register Your
Interest. An enquiry someone can answer beats a link to nothing. Verified across
all five states.

**THE PROCESS, for every Memory Catcher from here.** Only data changes - the code
is done and needs nothing per franchisee. `supabase/region-handover.sql`:

  1. `franchise_regions.is_available = false` for her region
  2. `franchisees.map_region_slug = '<region slug>'` on her row
  3. optionally rename `franchise_regions.region` - that column is the display
     name in 14 places on the template and on the finder card, so one update
     renames the area everywhere

Camille's region is `blackburn-burnley`, displayed as **"Blackburn and Burnley
(East Lancashire)"**. The slug does not change - it is in the URL. Her
`map_region_slug` line is in the file, commented, to run once her profile exists
tomorrow.

**Guard added** to `check-internal-links.js`: the template must carry all seven
placeholders and none of the six strings that were hardcoded. Verified by
pasting one back and watching it fail - which is also how the SECOND hardcoded
CTA in the hero was found, after the first fix looked complete.

**Also spotted, not fixed - copy bug on bolton-wigan.** The "Why Bolton and
Wigan" body ends with Norfolk content: "The Royal connection lends prestige...
Burnham Market and the north Norfolk coast", and "NCT Norfolk runs occasional
groups." That is `why_area` in the database, not code. Worth checking the other
111 regions for the same paste.

### Region copy audit: all 112 checked (16/08/2026)

Ryan asked whether the Norfolk paste on bolton-wigan had happened elsewhere.

**Method.** Parsed all 112 rows from the seed, built a vocabulary of every place
name each region declares in `coverage_areas`, `city_name` and `region`, then
looked for sentences mentioning a name owned by exactly ONE OTHER region while
mentioning none of their own. A shared name proves nothing - Maidstone sits in
two Kent territories - so only exclusively-owned names count.

A first pass at single place names gave 58 regions and was useless: it flagged
"South", "Wells" from Tunbridge Wells, and "surrounding villages" as place
names. **Sentence level is the right unit**, because the fault being looked for
is a pasted sentence, not a stray word. That cut it to 22 sentences across 13
regions, small enough to read every one.

**The finding is that the seed is CLEAN.** Every Norfolk phrase - the Royal
connection, Burnham Market, the north Norfolk coast, NCT Norfolk, Sandringham -
appears only in `norfolk-west`, and bolton-wigan's seeded copy is entirely about
Bolton and Wigan.

**So the contamination was introduced into the live database after seeding.**
That is a more useful answer than a list of bad rows: it means the generated
data is sound, the damage is editorial, and only the live database can say how
far it spread. `supabase/region-copy-audit.sql` has the queries.

**The other 21 sentences were read and are legitimate.** A territory naturally
refers to the city next door - Bristol North and Somerset mentions Bristol,
Edinburgh and Lothians mentions Edinburgh, Bolton and Wigan mentions Greater
Manchester. Those must not be "corrected".

**One genuine oddity, not a paste:** `sutton-merton` describes Wimbledon's baby
class scene, but Wimbledon belongs to `richmond-kingston-wimbledon`. Two
territories describing the same town is a boundary question for Ryan, not a
data fix.

**A trap in the obvious repair.** Re-running the seed fixes every row, because it
upserts on slug - but it also resets `is_available`, so Ashley's and Camille's
regions would silently go back to available and their pages would start inviting
applications again. `region-handover.sql` must be re-run straight after. That
ordering is written into both files.

### Email automation wired in: triggers and bfc-shell (16/08/2026)

Dixit asked for both. Done, with one part of his request deliberately not done.

**Triggers.** `functions/_shared/lifecycle.js` holds every template key and delay
in one place, so a timing change is one edit rather than four functions.

Wired into the three trigger points that live in this repo:

    stripe-webhook          welcome-1/2/3 at +1/+4/+7 days
    submit-lead             welcome-1/2/3 at +0/+3/+6 days, COMMUNITY ONLY
    upload-portal-complete  addons-teaser at +1 day, gated on a ticket

The despatch chain and the in-person welcome are n8n's triggers. Their keys are
listed in lifecycle.js so both sides use the same names.

**Three judgement calls worth recording:**

- **Transactional never goes through the queue.** A customer who has just paid
  should not wait for a poller to notice. Confirmations stay immediate and
  direct; only scheduled lifecycle mail is queued.
- **Only community sign-ups get the subscriber series.** A franchise enquiry, a
  contact message and a slot reservation all get a human reply - dropping a
  three-part welcome on someone who asked a direct question is how a brand
  starts feeling automated.
- **The add-ons teaser is +1 day, not immediate.** She has just handed over her
  baby's handprints; a sales email in the same minute as the thank-you reads
  badly.

**bfc-shell, for the three CUSTOMER emails only.** Dixit asked to "replace all
old email sending template". Of the ten send sites, seven are internal
notifications - lead alerts, the studio notification, onboarding. Putting a "new
contact form message" through a branded customer shell would make an internal
alert look like a customer email and lose the plain data table that makes it
useful. So the kit confirmation, the add-ons confirmation and the upload
thank-you route through bfc-shell; the internal seven do not.

**Integrated by delegation, not replacement.** Each file's existing send helper
now calls `sendEmail()` first, passing the HTML it already built as
`fallbackHtml`. The old path is not removed - it becomes the safety net. Flag
off, `email_content` row missing, template unknown, Mandrill rejecting: all land
on exactly the email customers get today. Verified on all three paths for both
webhooks.

**Still no schema from Dixit**, so `order-confirmation` / `addons-confirmation`
and the assumed columns stay as written in send-email.js under CONTRACT. This is
now safe to leave that way: the flag is off, and when he switches it on the log
line says `sent via shell` or `sent via inline`, so the first live send says
which path actually ran.

**Four bugs in my own work, all caught by executing rather than reading:**

1. `toEmail` in stripe-webhook is scoped inside an else branch - my queue block
   referenced it from outside, plus a `firstName()` that does not exist
2. The upload teaser landed before the FIRST `return json(200`, an early exit,
   so `ticketId` did not exist yet
3. The add-ons shell block referenced `merge`, which is not in that helper's
   scope - the catch swallowed it and fell back silently, so it would have
   looked like it worked forever
4. **Restoring a backup silently reinstated the BCC Ryan had asked me to
   remove.** `/tmp/upc3.bak` predated that change. Caught by checking the
   restored file rather than trusting the restore.

Number 3 is the one worth remembering: **a fallback that works makes a broken
primary path invisible.** That is why `send-email.js` logs which path it used.
