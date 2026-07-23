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
