# Dynamic franchise regions + blog - what was built

Built 04/08/2026 in response to: *"I deploy code and it did not include dynamic
code for blog and region franchise page, there is no code."*

Correct - the previous session settled the architecture across several rounds but
never produced the code. This is that code.

## Approach, as agreed

Runtime fetch from Supabase, one template each, **no static generation**, real
404 when the slug has no row. Both pages render **server-side at the edge**, which
is what makes the SEO work: Googlebot renders JavaScript but social scrapers
(Facebook, WhatsApp, LinkedIn, X) do not, so client-side meta would leave all 112
regions and 16 posts sharing one link preview.

## Files

| File | Purpose |
|---|---|
| `supabase/franchise-and-blog.sql` | schema, indexes, RLS, `regions_by_outcode()` |
| `supabase/seed-franchise-regions.sql` | 112 regions + 1,482 postcodes, upsert-safe |
| `netlify/edge-functions/franchise-region.js` | serves `/franchises/<slug>` |
| `netlify/edge-functions/blog-post.js` | serves `/post/<slug>` |
| `franchise-region-template.html` | the one region template |
| `post-template.html` | already existed, already placeholder-driven |

## Routing changed

```
/franchises/*   /franchise-region-template.html   200
/post/*         /post-template.html               200
```

The edge functions intercept before these rules; the splats exist so a request
resolves to a template at all. **16 hardcoded `/post/` routes and the single
`/franchises/norfolk-west` route were removed**, along with the 16 static post
pages and the one built region page - they would otherwise be a second crawlable
copy of the same content.

Both templates are 301'd so they cannot be reached directly.

## Verified, with stubbed Supabase and the real templates

- region hit → 200, **0 leftover `{{}}`**, correct title, OG tags present, region
  name in body, Ricos rich text flattened to paragraphs, map iframe receiving the
  right slug
- region miss → **404 status** (not a 200 with 404 content)
- malformed slug → 404, no database round trip
- post hit → 200, 0 leftover placeholders, read time computed from body, FAQPage
  and BlogPosting JSON-LD emitted, related posts rendered
- post miss → 404

## Two things to check on first deploy

1. **`SUPABASE_URL` and `SUPABASE_ANON_KEY` must be set** on the Netlify site.
   Both functions log clearly when they are missing. This is the same gap that
   404s `/memory-catcher/<slug>` today.
2. **`curl -I` a made-up slug** on both paths. Expect `HTTP/2 404`. If it returns
   200 the rewrite is not carrying the status and Google will treat every unknown
   slug as a soft 404.

## Notes on the schema

- `blog_posts` mirrors the template's tokens exactly, including `final_thoughts`,
  `read_time`, `tags`, `faqs` and `author_avatar`. Anything null renders empty.
- RLS: regions and postcodes are readable by anon; **blog posts only when
  `published = true`**, so a draft is not fetchable by URL.
- `franchise_postcodes` is a child table with an index on `outcode`, so a search
  is an index seek rather than `LIKE '%IP1%'` - which would also wrongly match
  IP11 when someone types IP1.
- `regions_by_outcode()` returns **all** regions claiming an outcode. 30 are
  shared between two regions; Ryan's call was to show them all.

## Still to do

The **franchise region listing page** (`/franchise-region`) and the **blog
listing** (`/blog`) still read their static arrays. They need pointing at
Supabase too - listing, search, and the postcode lookup via
`regions_by_outcode()`. The detail pages are done; the indexes are not.
