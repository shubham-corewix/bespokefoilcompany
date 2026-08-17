# How the sitemap stays current

Short answer: **`sitemap.xml` updates itself. `sitemap.html` updates on the next
build.** Neither needs anyone to remember anything, once Supabase is populated.

## The two sitemaps do different jobs

| | Who reads it | How it updates |
|---|---|---|
| `sitemap.xml` | Google | **Per request.** Edge function queries Supabase live |
| `sitemap.html` | People | **Per build.** Regenerated whenever the site deploys |

`robots.txt` and `llms.txt` are built alongside `sitemap.html`.

## Adding a blog post

1. Insert the row in Supabase with `published = true`.
2. **`sitemap.xml` has it immediately** - the edge function reads Supabase on
   request, cached one hour. Google can find it straight away.
3. **`sitemap.html` has it on the next deploy.** Any deploy, for any reason.

Nothing to edit, nothing to remember.

## Adding a franchise region

Identical. Insert the row; `/franchises/<slug>` is served by the edge function
and both sitemaps pick it up on the same schedule as above.

## Adding a normal static page

Add **one line** to `_redirects`:

```
/new-page   /new-page.html   200   # Explore | New Page | Short description
```

The category before the first `|` decides which section it lands in and its
priority. Everything else - `sitemap.xml`, `sitemap.html`, `robots.txt`,
`llms.txt` - follows automatically.

**Tag it `# exclude` instead if it should not be indexed**, or `# util | Label`
for internal tools, which appear on the sitemap page only.

## Where the build gets its data

`scripts/generate-sitemaps.js` tries **Supabase first, local files as a fallback**:

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` set and returning rows -> live data
- absent, unreachable, or returning nothing -> `regions.json` and
  `data/blog-posts.json`

The build prints which it used, e.g.
`dynamic pages: 127 from local files (set SUPABASE_URL/ANON_KEY for live)`.

**An empty Supabase response is treated as a failure, not as "no pages".** On
05/08 an earlier version queried Supabase alone, found it unseeded, and produced
a sitemap missing 112 regions and 15 posts with no error at all. The fallback
exists so that cannot recur.

**Until Dixit populates Supabase, the local files are the source of truth.** If a
post is added to Supabase before then, add it to `data/blog-posts.json` too, or it
will be in `sitemap.xml` but not on `sitemap.html`.

## The safety net

`scripts/check-sitemap.js` runs on every build and **fails the deploy** if:

- a `200` route points at a file that does not exist
- a non-excluded route is missing from `sitemap.html`
- any region or post is missing from the sitemap
- (warning only) an orphaned `.html` exists that no route points at

So a page can no longer go missing quietly. It has happened twice; the third
attempt breaks the build instead.
