# Discovery-file generator

Generates four files from a **single source of truth** (`_redirects`) so they
can never drift out of sync with the live site:

| File | Purpose |
|------|---------|
| `sitemap.xml` | SEO. Referenced from `robots.txt`. Submit once in Google Search Console. |
| `sitemap.html` | Customer-facing "having trouble finding something?" page at `/sitemap`. |
| `robots.txt` | Crawler policy + points crawlers at `sitemap.xml`. |
| `llms.txt` | AI/agent discovery aid (Chrome Lighthouse "Agentic Browsing" checks for it). |

## How it works

Everything - the URL *and* its label/category - lives on one line in
`_redirects`. The generator reads the `200` rewrites and the inline comment
after each one:

```
/our-kit   /our-kit.html   200   # Explore | Order Your Kit | Buy a foil handprint & footprint keepsake kit
```

- **`Category | Label`** - the label shown, filed under that category heading.
- **third `| note`** (optional) - an extra sentence, used only in `llms.txt`.
- **`# exclude`** - a live route kept OUT of all four files (e.g. `/sitemap` itself).
- **`# util | Label`** - a TEMPORARY testing link. Shown only on the human
  `sitemap.html` page (under a "Utility Pages" heading), and kept OUT of
  `sitemap.xml` / `robots.txt` / `llms.txt` so the page stays non-indexed. Use
  for thank-you pages, form pages, and other utility routes you want to click
  through during testing. At go-live, switch these back to `# exclude` to drop
  the whole Utility Pages section.
- **no comment** - label is derived from the URL, filed under "Other".

A URL can only appear in the outputs if it's a real, live `200` route, so there
are **no dead links, ever**. Netlify ignores everything from `#` onward, so the
comments never affect routing.

Netlify runs the generator automatically on every deploy (`command` in
`netlify.toml`). Uses only Node built-ins - no `npm install`, no dependencies.

## The one rule

**Never hand-edit `sitemap.xml`, `sitemap.html`, `robots.txt` or `llms.txt`.**
They are build artefacts. To add a page you now edit **one line in one file**:

```
/tommys-charity   /tommys-charity.html   200   # Explore | Tommy's Charity | £1 from every kit funds Tommy's charity
```

That's the whole change. (You were adding the `200` line for routing anyway;
the comment is the only extra.)

- **Change a page's look** -> edit `scripts/sitemap-template.html` (a normal BFC
  page; generated links inject at `__SECTIONS__`, CSS version at `__CSS_VER__`).
- **Reorder / re-prioritise categories** -> `CATEGORY_ORDER` / `CATEGORY_PRIORITY`
  at the top of `generate-sitemaps.js`.

## Run it locally

```bash
node scripts/generate-sitemaps.js
```

## Note on franchise regions

Region detail pages are individual `200` routes in `_redirects` (only
`west-norfolk-kings-lynn` exists so far). When Dixit wires the CMS and the full
~112 region routes are added to `_redirects`, they flow into all four discovery
files automatically - no change to this generator needed. Give each a
`# Franchise Regions | <Region name>` comment and they'll group correctly.

## Regenerating the OG images

`assets/og/*.jpg` are 1200x630 crops of each page's own hero, generated ahead of
time and committed. They are NOT built on Netlify: resizing needs an image
library, and adding one to the build for a job that changes only when the
photography changes would be a dependency earning nothing.

Regenerate when a hero image changes:

```
python3 - <<'PY'
import re, glob, os
from PIL import Image
SKIP = {'component-library.html','snag-tool.html','gallery-upload.html',
        'memory-catcher-region-map-embed.html','post-template.html',
        'franchise-region-template.html','franchise-bio-template.html'}
DEFAULT = 'assets/hero-slide-196-1800.webp'
def hero(f):
    h = open(f).read()
    n = h.find('nav-menu-cards')          # the shared nav overlay is not the hero
    if n > 0:
        e = h.find('</nav>', n); h = h[:n] + h[e if e > 0 else n:]
    for m in re.finditer(r'<img[^>]+src="(/assets/[^"]+\.(?:webp|jpg|jpeg|png))"', h):
        u = m.group(1)
        if any(k in u for k in ('logo','wordmark','lockup','/pay/','tp-')): continue
        if os.path.exists(u.lstrip('/')): return u.lstrip('/')
    return DEFAULT
os.makedirs('assets/og', exist_ok=True)
for f in sorted(glob.glob('*.html')):
    if f in SKIP: continue
    im = Image.open(hero(f)).convert('RGB'); w, h = im.size; tr = 1200/630
    if w/h > tr:
        nw = int(h*tr); box = ((w-nw)//2, 0, (w-nw)//2+nw, h)
    else:
        nh = int(w/tr); top = int((h-nh)*0.32); box = (0, top, w, top+nh)
    im.crop(box).resize((1200,630), Image.LANCZOS).save(
        f'assets/og/{f[:-5]}.jpg', 'JPEG', quality=82, optimize=True)
PY
```

JPEG, not WebP: WhatsApp's link preview does not reliably render WebP, and a
preview only fails where you cannot see it. The 0.32 vertical bias keeps faces
in frame when a tall image is cropped to 1.9:1.

`scripts/build-og.js` then writes the tags on every build and fails if a crop is
missing. `check-analytics.js` fails if a shareable page has no og:image, has
more than one, uses a relative or cross-subdomain URL, or points at a file that
is not on disk.
