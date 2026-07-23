# BFC Website - Technical Brief for Dixit

**From:** Ryan
**Re:** Getting the new static BFC site live and wiring the backend/integrations.

This is the hand-coded static site that replaces the Wix build. It's ~80% done - the front-end pages are built and deploy-ready. This brief covers the technical work that lands with you to get it fully live. Nothing here is urgent-today; it's so you've got the full picture before we go.

---

## 1. HOW THE SITE IS BUILT

- Hand-coded static **HTML / CSS / JS**. No framework, no build step except one small Node script (below).
- Deploys to **Netlify**. Routing via a `_redirects` file (clean URLs, e.g. `/our-kit` -> `/our-kit.html 200`).
- Shared styles in `/shared/styles.css` (cache-busted `?v=N`). Per-page tweaks are inline `<style>`.
- All asset paths are absolute (`/assets/...`, `/shared/...`) - needed for subpath pages to resolve. This means local `file://` preview breaks; use a local server.

### The discovery-file system (important - don't hand-edit)
`sitemap.xml`, `sitemap.html`, `robots.txt`, `llms.txt` are **auto-generated** from `_redirects` by `scripts/generate-sitemaps.js`, which Netlify runs on every deploy (see `netlify.toml` build command). `_redirects` is the single source of truth. Each route carries its sitemap metadata as an inline comment (`# Category | Label`). Full spec in `scripts/README.md`. **Never edit the four discovery files by hand - they'll be overwritten on deploy.**

---

## 2. WHAT NEEDS WIRING (your side)

### a) Forms (currently static UI only - no submission wired)
- **Memory Catcher enquiry** (`/memory-catcher-enquiry`) - "Register your interest". Submits to Ashley (email/webhook - your call on mechanism). Fields incl. name, town, situation, appeal checkboxes, contact preference, mobile, email, notes.
- **Slot reservation / pre-book** (`/slot-reservation-form`) - takes a **£10 deposit via Stripe**, then records name/email/phone/baby-class-location/baby-name. Deposit is non-refundable, comes off order total on the day.
- **Upload portal** (`/upload-portal-form`) - multi-step. Currently Welcome + Step 1 (Your details) + Step 2 (Order details) built as a JS-driven step scaffold. This is the one that connects to **Zendesk and the other tools you know about**. Remaining steps (print upload, personalisation, frame/foil colour, review) still to build - the scaffold auto-picks-up new `<section class="upf-step">` blocks. Look for the `Dixit:` comments in the code.

### b) CMS (the big one)
Several page types are built "array-first" - a JS data array in the page that's designed to become a CMS feed. These need wiring into the planned **Supabase custom CMS**:
- **Blog** - `blog.html` (`POSTS` array) + `post-template.html` (tokenised) + `scripts/BLOG-CMS-BRIEF.md` (field-mapping brief for you) + `scripts/build-blog-post.js` (reference renderer) + `scripts/blog-example-post.json`. **SEO-critical: keep `/post/<slug>` URLs identical to the Wix ones (zero redirects), preserve per-post seo_title/og_title/meta/og_description, one H1, BlogPosting + FAQPage JSON-LD per post.** Only 1 real post exists; the hub must NOT go live pointing at unbuilt posts (they'd 404) - the existing post links to 3 related posts that don't exist yet.
- **Franchise regions** - `franchise-region.html` (`FRANCHISE_REGIONS` array) + one built detail page (`/franchise-region/west-norfolk-kings-lynn`). **~111 more region detail pages** to roll out via CMS. When wired into `_redirects`, tag each `# Franchise Regions | <name>`.
- **Franchisee bios** - `find-a-memory-catcher.html` (`MEMORY_CATCHERS` array) + Ashley bio template.
- **Memory Catcher affiliate PDPs** - `memory-catcher-salamata-bah.html` driven by a single `MEMORY_CATCHER` object (name/photo/code/offer). One per catcher; CMS-ready.
- **Baby gallery** - `bespoke-baby-gallery.html` (`PHOTOS` array, 13 placeholders) - built so a future **upload-portal webhook** can auto-populate it.

### c) Other wiring
- **Kit Walkthrough Video** (`/kit-walkthrough-video`) - poster + placeholder in place; wire the real video URL.
- **`post-template.html`** sits at root with unfilled tokens - noindex it or move to an unpublished folder so it doesn't get crawled.

---

## 3. GO-LIVE HOUSEKEEPING

- **Utility pages** (`/memory-catcher/salamata-bah`, `/upload-portal-thank-you`, `/franchise-success`, `/memory-catcher-enquiry`, `/slot-reservation-form`, `/upload-portal-form`) are currently tagged `# util` in `_redirects` so they show on the human sitemap for testing but stay out of `sitemap.xml`/`robots`/`llms`. **At go-live, switch these to `# exclude`** to hide the testing section (Ryan may do this, coordinate).
- **Logo** currently shows ® in the artwork; Ryan is re-exporting with ™. One-file swap of `assets/bfc-logo.svg`.

---

## 4. THE PLANNED END STATE

After QA sign-off, the next phase is the **Supabase custom CMS** - blog, regions, bios, gallery, plus the franchisee dashboard (commissions, stock reorder, training, referral link/QR) all on one backend. The franchisee "Memory Catcher Hub" is featured on the franchise page now as a coming-soon capability. Sequencing: lock the front-end templates in QA first, then build the CMS into the finished templates.

---

## 5. WHERE THINGS ARE

- Full repo: `bfc-site-repo.zip` (this package).
- Your CMS brief: `scripts/BLOG-CMS-BRIEF.md`.
- Discovery-file spec: `scripts/README.md`.
- Look for `Dixit:` / `NOTE:` comments inline in the form and template files for the specific wiring points.

Give me a shout when you've had a look - happy to walk through any of it.
