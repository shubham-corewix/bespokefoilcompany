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
