# sitemap.xml is now served by an edge function

Built 04/08/2026. Replaces the build-time `sitemap.xml`.

## Why

Regions and posts are served from Supabase by edge functions - no files on disk,
no `_redirects` lines. `generate-sitemaps.js` only reads `_redirects`, so a
build-time sitemap would list 39 static pages and none of the ~128 dynamic ones.

## What changed

| File | Change |
|---|---|
| `netlify/edge-functions/sitemap.js` | **new** - serves `/sitemap.xml` |
| `netlify.toml` | edge function registered on `/sitemap.xml` |
| `scripts/generate-sitemaps.js` | writes `sitemap-static.json` instead of `sitemap.xml` |
| `sitemap.xml` | **deleted** - see the warning below |

`sitemap.html`, `robots.txt` and `llms.txt` are unchanged and still built.

## Do not let the build write sitemap.xml again

A real file at `/sitemap.xml` wins over an edge function claiming that path. If
`generate-sitemaps.js` is ever changed back to writing it, the sitemap silently
reverts to the static half only - no error, no warning, just 128 pages quietly
missing from search.

That is why the build now writes `sitemap-static.json`: same routes, same lastmod,
same priorities, as data for the function to read.

## Two column names to confirm

The function reads:

```
franchise_regions   slug, updated_at   where is_available = true
blog_posts          slug, updated_at   where published    = true
```

If your schema names those differently, three lines need changing near the top of
the function. Everything else is generic.

## Behaviour worth knowing

- **Cached one hour** at the edge. A crawler does not trigger a Supabase read per
  request, and a new post still appears the same day.
- **Supabase failure is non-fatal.** If either read fails it logs and returns the
  static routes rather than a 500. Tested: a 500 from `franchise_regions` still
  produces a valid 39-URL sitemap. A short sitemap is recoverable; an error page
  tells Google nothing.
- **De-duplicated on `loc`**, so a URL present both statically and in Supabase
  cannot appear twice. Duplicate `<loc>` is a validation error.
- Priorities match the generator's own table: regions 0.5, posts 0.6.

## Verify after deploy

```bash
curl -s https://www.thebespokefoilcompany.co.uk/sitemap.xml | head -20
curl -s https://www.thebespokefoilcompany.co.uk/sitemap.xml | grep -c "<url>"
```

Expect roughly 39 + your region count + your post count. If it is exactly 39, the
Supabase reads are failing - check the function log, it prints the three counts on
every request.

## Related, still open

`check-analytics.js` scans HTML files on disk, so it will never see the dynamic
pages. The analytics tag needs to be in the region and post templates, and that
will not be enforced automatically. Worth a manual check once they are live.
