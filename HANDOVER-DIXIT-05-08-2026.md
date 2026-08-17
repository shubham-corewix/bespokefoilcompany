# Handover to Dixit - 5 August 2026

Package: `thebespokefoilcompany.co.uk-05-08-2026.zip`

Ryan has finished his snag rounds and all image swaps are done. **This is the
final content version.** It needs merging with your latest.

Full reasoning for every change is in `BFC-WEBSITE-THREAD.md` under dated blocks.

---

## 1. Read this first - three things that will catch you out

### Copying a zip over a repo does not delete files

**This broke the last deploy.** The 16 static blog pages and the old region page
were removed from the package on 04/08 when both went dynamic, but they were still
in the repo, so `check-sitemap.js` failed the build.

Copying applies additions and edits. It never applies deletions.
`DEPLOY-FIX-05-08-2026.md` has the `git rm` list. **Keep `post-template.html` and
`franchise-region-template.html`** - those are what the edge functions render into.

### `/assets/*` is immutable-cached for a year

```
Cache-Control: public, max-age=31536000, immutable
```

An asset replaced **in place** will never reach anyone who has already loaded the
page. The repo looks correct, the browser stays stale, and no amount of checking
the files reveals it. This cost two days on "the logo is still wrong" and "the
black bars are still there" when both files were already fixed.

**Changed assets get a NEW FILENAME.** That is why you will see `-v2` and `-v3`
suffixes throughout.

### `/shared/*` is cached for a week

The stylesheet link carries `?v=`, now at **v=12**. Bump it whenever
`shared/styles.css` changes, or the change will not reach anyone who visited in
the last seven days.

Related: **`home.html` has no `<style>` block.** It takes everything from
`shared/styles.css`. A page-level CSS insert there silently does nothing - this is
what made the hero crossfade ship dead on its first build.

---

## 2. What is new since your last zip

### Dynamic pages - built, needs your Supabase

| File | Purpose |
|---|---|
| `netlify/edge-functions/franchise-region.js` | serves `/franchises/<slug>` |
| `netlify/edge-functions/blog-post.js` | serves `/post/<slug>` |
| `franchise-region-template.html` | the single region template |
| `supabase/franchise-and-blog.sql` | schema, indexes, RLS, `regions_by_outcode()` |
| `supabase/seed-franchise-regions.sql` | 112 regions + 1,482 postcodes, upsert-safe |

Both render **server-side at the edge** and return a **real 404** when the slug has
no row. Details in `DYNAMIC-PAGES-NOTES.md`.

**Confirm these column names** - three lines change if they differ:
`franchise_regions(slug, region, is_available, updated_at)` and
`blog_posts(slug, title, published, published_at, updated_at)`.

### sitemap.xml is now an edge function

`netlify/edge-functions/sitemap.js` merges `sitemap-static.json` (written by the
build) with the dynamic regions and posts from Supabase.

**The build no longer writes `sitemap.xml`.** If that is changed back, a real file
on that path wins over the edge function and the sitemap silently reverts to the
static half only. See `SITEMAP-EDGE-FUNCTION-NOTES.md`.

### New build check

`scripts/check-sitemap.js`, wired into the build. **Fails the deploy** if a route
points at a missing file, a non-excluded route is absent from `sitemap.html`, or
any region or post is missing. Orphaned `.html` files are a warning only.

Pages have gone missing from the sitemap silently twice. This makes the third
attempt break the build instead.

### generate-sitemaps.js reworked

- Reads **Supabase first, local files as a fallback** (`regions.json`,
  `data/blog-posts.json`). An empty Supabase response counts as a failure, not as
  "no pages" - that assumption produced a sitemap missing 127 URLs.
- `cssVer` was **hardcoded at `v=10`** while every other page had moved on. Now
  read from `home.html` so it cannot drift.
- Utility Pages moved to first position; Franchise Regions and Stories moved into
  their own three-column bands.

`SITEMAP-HOW-IT-UPDATES.md` explains the whole chain in one page.

### Home page

- **Hero crossfade** - 8 slides, 4s each, 1.6s dissolve. Only slide 1 is eager, so
  first paint is 52KB against 95KB for the static hero it replaced.
- **UGC reel** above the reviews section - 24 tiles, marquee, everything lazy.
  Hardcoded by hand; it does **not** read from the gallery pipeline. Ryan knows.

### Content and fixes

50 missing `Foil Fusion Technology&trade;` marks across 33 files. Real supplied
icons replacing the drawn placeholders. Five-star review blocks. `White Card | Rose
Gold Foil` added to the add-ons app - **in both the dropdown and the server-side
validation list**, which must always match or the option fails at payment.

---

## 3. New work for you

**`GALLERY-UPLOAD-SPEC.md`** - a mobile upload page for Ashley so her own footage
reaches the gallery without going through the customer portal.

`gallery-upload.html` is in the package as a **front end only**. It validates and
previews locally and sends nothing, so Ryan can approve the interface before you
wire it. Route `/gallery-upload` is already in `_redirects` as a util entry.

**The critical detail: iPhones shoot HEIC and `.mov` by default.** `sharp` throws
on HEIC without libheif and the ffmpeg recipe assumes `.mp4`. Without handling
both, a large share of Ashley's uploads fail silently and she has no way of knowing
which. The spec is explicit that failures must surface in the UI.

---

## 4. Open items

| Item | Notes |
|---|---|
| **Checkout testing** | `CHECKOUT-TEST-SCRIPT.md`. Nothing should ship before this passes |
| Region + blog **listing** pages | detail pages are dynamic, the indexes still read static arrays |
| Four forms have no backend | slot reservation, MC enquiry, contact, join community. `submit-lead.js` exists but **is not routed** |
| Franchisee login | no endpoint, no auth |
| Gallery pipeline | `GALLERY-AUTOMATION-SPEC.md` |
| Ashley's upload page | `GALLERY-UPLOAD-SPEC.md` |
| Affiliate pages 404 on test deploys | needs `SUPABASE_URL` / `SUPABASE_ANON_KEY` set |
| Slider on `/foil-fusion-technology`, hamburger on `/franchise` | cannot reproduce by inspection - **need the browser console error** |

## 5. Flagged, not actioned

- **Card/foil naming differs between systems.** Upload portal uses
  `White card / Rose gold foil`; the add-ons app uses `White Card | Rose Gold Foil`.
  Same six combinations, different strings. Harmless while separate, a problem the
  moment data moves between them or anyone reports across both.
- `parent-community.svg` was supplied but maps to none of the four Bespoke
  Difference labels. Unused in `assets/icons/`.

## 6. Build

```
node scripts/generate-sitemaps.js && node scripts/check-sitemap.js && \
node scripts/check-internal-links.js && node scripts/check-analytics.js
```

All four pass on this package: **150 sitemap URLs, 112 regions, 15 posts, all links
resolve, analytics on every page.**

The link checker also warns when a link points at a 301 source rather than its
destination. That warning has caught real problems three times this week, so it is
worth reading rather than scrolling past.
