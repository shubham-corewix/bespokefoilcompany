# BFC Website - Project Handover

**Written 6 August 2026, to carry this project into a fresh thread.**

Roughly 90% complete. What remains is snagging, a handful of backend builds owned
by Dixit, and go-live checks.

---

## 1. What this is

The Bespoke Foil Company's website, migrated off Wix onto a hand-built static
site deployed on Netlify. 38 pages, 321 assets, Supabase behind the dynamic
parts, Stripe for checkout.

**People:**
- **Ryan** - founder, runs the snagging, makes the calls
- **Ashley** - co-founder, face of the Memory Catcher™ Franchise, takes prints at
  baby events
- **Dixit** - the developer, owns everything backend

**Sites:**
- `rainbow-lily-b43c61.netlify.app` and `zesty-granita-af77c7.netlify.app` are the
  test deploys. Ryan snags against these.
- Live domain is `thebespokefoilcompany.co.uk`, still on Wix until cutover.

## 2. How the work flows

Ryan sends either a **snag JSON** (exported from his snagging tool, each entry has
a note, a CSS selector, the page and viewport) or a screenshot with a description.
Sometimes both.

**The loop:** he sends snags → I fix and verify → I ship a zip → he deploys and
snags again. Dixit sends his own zip periodically with backend work in it.

**Always establish a baseline first.** When a new zip arrives from Dixit:
1. Extract to a fresh directory, keep a read-only `_baseline` copy
2. Run a regression audit against the previous session's work - things have gone
   missing before
3. Only then start on the new request

**Deliver as a zip** named `thebespokefoilcompany.co.uk-DD-MM-YYYY.zip`, built from
the working directory root.

---

## 3. THE THINGS THAT COST US DAYS

These are not theoretical. Each one burned real time before it was understood.

### `/assets/*` is immutable-cached for a year

```
Cache-Control: public, max-age=31536000, immutable
```

**An asset replaced in place will never reach anyone who has already loaded the
page.** The repo looks correct, the browser stays stale, and checking the files
proves nothing.

This produced two days of "the logo is still wrong" and "the black bars are still
there" when both files were already fixed. **Changed assets get a NEW FILENAME** -
hence the `-v2` and `-v3` suffixes throughout.

### `/shared/*` is cached a week

The stylesheet link carries `?v=`, currently **v=12**. Bump it whenever
`shared/styles.css` changes.

### Some pages do NOT load `shared/styles.css`

`our-kit.html` and `keepsake-standalone.html` don't - 73 selectors would collide.
**Any CSS for those pages must be inlined into their own `<style>` block.**

### `home.html` has no `<style>` block at all

It takes everything from the shared sheet. A page-level CSS insert there silently
does nothing. This shipped the hero crossfade dead on its first build.

### Copying a zip over a repo does not delete files

Additions and edits apply; deletions never do. This broke a Netlify deploy when
16 superseded blog pages stayed in Dixit's repo.

### Scripts must VERIFY, not report

Three separate bugs shipped because a script printed a success line without
checking its own result - a `str.replace` that silently matched nothing. **Always
read the file back and assert.**

### Check what an element already computes to

CSS written without checking the existing computed style broke three things: a
`<label>` that was `display:inline` and fragmented across line boxes, a button
whose icon block was hidden by an existing `display:none`, and a hero that
inherited nothing because the rules never reached it. **Verify with computed
styles in jsdom, not by reading the markup.**

### This codebase has formatted HTML

Attributes wrap across lines. A single-line regex will miss things. Patterns need
to tolerate newlines mid-tag.

---

## 4. Standing conventions Ryan has set

- **No em dashes.** Hyphens only. British English throughout.
- **Never call Memory Catcher™ a "class"** - it is an in-person baby keepsake
  experience.
- **Memory Catcher™ Franchise** - singular, TM after "Franchise". Franchisees are
  "Memory Catchers".
- **Foil Fusion Technology™** always carries the trademark in prose (not in URLs
  or attributes).
- **Founders Pricing £3,445** inc. VAT, quoted as a pure cost with no VAT
  breakdown. Rises to £6,995 after the first ten franchisees.
- **Palette:** `000000`, `BEAD9D`, `DDD6CE`, `F6F6F4`, `FFFFFF`.
- **Type:** Fraunces (headings), Instrument Sans (body), Nothing You Could Do
  (handwritten accent).
- **Site grid:** `max-width: 1280px`, `padding: 0 40px`, dropping to 18px below
  600px. Pages that don't match this are the outlier and should be corrected.
- **"UGC reel"** is the agreed name for the marquee component.
- **Everything must stay optimised.** This is now enforced by the build, not
  remembered.

---

## 5. Architecture

### Routing
`_redirects` is the single source of truth. A `200` line makes a page real; the
comment after `#` sets its sitemap category. `# exclude` keeps it out;
`# util | Label` puts it on the sitemap page only.

### Dynamic pages
Franchise regions and blog posts are served **at the edge from Supabase**, one
template each, with a **real 404** when the slug has no row. Rendering is
server-side because social scrapers don't run JavaScript - client-side meta would
leave 112 regions sharing one link preview.

- `netlify/edge-functions/franchise-region.js` → `/franchises/<slug>`
- `netlify/edge-functions/blog-post.js` → `/post/<slug>`
- `netlify/edge-functions/sitemap.js` → `/sitemap.xml`
- `netlify/edge-functions/memory-catcher.js` → `/memory-catcher/<slug>`

### Checkout
`shared/checkout.js` - one implementation used by the product page and the home
page. Prices live in markup `data-price` attributes and the SKU map in code, so
two copies would mean two places for a price to drift.

**Read the comment block at the top before touching it.** There is a documented
trap where a `shippingaddresschange` handler silently blocks every wallet button
with no error.

### The build
```
build-ugc-reel → generate-sitemaps → check-sitemap → check-internal-links → check-analytics
```

Three of these **fail the deploy**: a missing sitemap page, a broken internal
link, a page without the analytics tag, an over-budget reel asset. That is
deliberate - each guards a class of failure that previously went unnoticed.

### Single sources of truth
| Thing | Lives in |
|---|---|
| Routes and sitemap categories | `_redirects` |
| UGC reel content | `data/ugc-reel.json` |
| Blog post list (sitemap fallback) | `data/blog-posts.json` |
| Franchise regions | `regions.json` + Supabase |
| Trustpilot figures | `shared/trustpilot.js` |

---

## 6. What is done

- Full static site built and migrated off Wix - **zero Wix CDN references remain**
- GA4 with Consent Mode v2 and a consent banner, enforced on every page by the build
- Product page moved onto the ranking URL
  `/product-page/foil-handprint-footprint-kit-baby-keepsake`
- Shared Stripe checkout on the product and home pages
- Branded 404
- Bespoke Baby Gallery - 73 tiles, lazy-loaded
- Hero crossfade on home - 8 slides, first paint 52KB (lighter than the static
  hero it replaced)
- UGC reel on home, product and affiliate pages, generated from one data file
- Kit comparison band on both product pages
- 56 Trustpilot reviews on all four pages carrying that component
- Sitemap: 150 URLs including 112 regions and 15 posts, in all four outputs
- Dynamic region and blog page infrastructure, schema and seed data
- Ashley's gallery upload page (front end only, awaiting Dixit's pipeline)

---

## 7. What is outstanding

### Dixit owns
| Item | Notes |
|---|---|
| **Checkout testing** | `CHECKOUT-TEST-SCRIPT.md`. **Nothing should ship before this passes.** Built and verified structurally, but no card has ever gone through it |
| Supabase env vars | `SUPABASE_URL` / `SUPABASE_ANON_KEY` on the Netlify site. This is also what 404s the affiliate pages today |
| Four forms | Slot reservation, MC enquiry, contact, join community - **none have any submit JavaScript**. `submit-lead.js` exists but is not routed |
| Franchisee login | No endpoint, no auth |
| Region + blog **listing** pages | Detail pages are dynamic; the indexes still read static arrays |
| Gallery pipeline | `GALLERY-AUTOMATION-SPEC.md` |
| Ashley's upload backend | `GALLERY-UPLOAD-SPEC.md`. **iPhones shoot HEIC and .mov** - `sharp` throws on HEIC without libheif |
| Blog rich editor | `BLOG-RICH-EDITOR-OPTIONS.md` - three options, recommendation is a small admin page |
| Two bugs I can't reproduce | Slider on `/foil-fusion-technology`, hamburger on `/franchise`. Everything checks out structurally - **need the browser console error** |

### Ryan owns
- Meta description for the product page, from Wix SEO settings, **before that
  account closes**
- Whether franchisee bio pages carry their own socials rather than the company's
- Whether `premium-frames` and `print-quality-guarantee` should get the full
  Trustpilot slider (they currently have the photo testimonial block instead)
- `parent-community.svg` was supplied but maps to none of the four Bespoke
  Difference labels - unused

### Flagged, not actioned
- **Card/foil naming differs between systems.** Upload portal uses
  `White card / Rose gold foil`; add-ons uses `White Card | Rose Gold Foil`. Same
  six combinations, different strings. Harmless while separate, a problem the
  moment data moves between them. **Worth normalising before launch.**
- **Figtree is preloaded on 33 pages** for a single rule on the announce bar.
  Removing it drops a font family from every page load.
- The UGC reel does **not** read from the gallery pipeline - it is a curated list.
  Ryan knows; revisiting later.

---

## 8. Starting the new thread

Upload:
1. **The latest zip** - `thebespokefoilcompany.co.uk-06-08-2026.zip`
2. **The image library** (`CLAUDE.zip`) and video archives, if image swaps are
   likely. The sandbox is wiped between sessions.

Then say what you want done. If Dixit has sent a newer zip, upload that instead
and ask for a regression audit first.

**`BFC-WEBSITE-THREAD.md` inside the zip is the full changelog** - 950 lines,
every decision and every mistake with its root cause. It travels with the code.
When something looks odd, the answer is usually already in there.
