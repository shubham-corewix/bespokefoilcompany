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
