# Blog CMS Brief - The Bespoke Foil Company

**For:** Dixit
**Goal:** Wire the `/blog` hub and `/post/<slug>` posts to a CMS **without losing any existing SEO**. Templates and a working reference renderer are already built and in the repo.

---

## 1. The golden SEO rule (read first)

The existing Wix blog is indexed and ranking. **Keep every URL exactly as it is now.** Do not change slugs, do not move posts to a new path.

- Hub stays at **`/blog`**
- Posts stay at **`/post/<slug>`** (e.g. `/post/why-every-parent-needs-a-baby-footprint-keepsake`)

If URLs match one-to-one, there is **nothing to redirect** and no ranking is lost. Only if a slug genuinely has to change do we add a `301` from the old `/post/<old-slug>` to the new one in `_redirects`.

Before go-live, export the full list of live Wix post URLs (Wix dashboard or the live XML sitemap) and diff it against the slugs the CMS will publish. Every old URL must either resolve to the same post or 301 to its replacement. **No old URL may 404.**

---

## 2. What's already in the repo

| File | What it is |
|------|-----------|
| `blog.html` | The `/blog` hub. Renders a featured post + searchable card grid from a `POSTS` array in the page's `<script>`. That array is the CMS feed - same shape. |
| `post-template.html` | The `/post/<slug>` template. Every dynamic value is a `{{token}}`. |
| `scripts/build-blog-post.js` | **Reference renderer.** Takes one post's JSON and fills `post-template.html`. Your CMS output must match what this produces. |
| `scripts/blog-example-post.json` | A fully worked example post (the real "Why Every Parent..." post) showing every field. |
| `post-why-every-parent-needs-a-baby-footprint-keepsake.html` | The example post, rendered. This is the exact HTML the CMS should emit per post. |

Run the reference renderer to see it work:
```bash
node scripts/build-blog-post.js scripts/blog-example-post.json
```

---

## 3. CMS fields per post (map these to the tokens)

The Wix blog uses **separate SEO fields** that differ from the on-page title. The CMS must preserve that distinction or we lose the tuned meta. Note especially `title` vs `seo_title` vs `og_title` - they are allowed to differ.

| CMS field | Token in template | Notes |
|-----------|-------------------|-------|
| `slug` | `{{slug}}` | The URL segment. Must equal the current Wix slug. Never changes silently. |
| `title` | `{{title}}` | The visible **H1** on the page. |
| `seo_title` | `{{seo_title}}` | The `<title>` tag text. Can differ from H1 (Wix does this). Falls back to `title`. |
| `og_title` | `{{og_title}}` | Social share title. Falls back to `seo_title` then `title`. |
| `meta_description` | `{{meta_description}}` | The `<meta name="description">`. |
| `og_description` | `{{og_description}}` | Social share description. Can differ from meta description. |
| `author` | `{{author}}` | e.g. "Ashley Eccleston". |
| `author_avatar` | `{{author_avatar}}` | Absolute path, e.g. `/assets/ff-ashley-700.webp`. |
| `published_iso` | `{{published_iso}}` | ISO 8601, e.g. `2025-07-14T05:54:12.000Z`. Feeds `article:published_time` + schema. |
| `modified_iso` | `{{modified_iso}}` | ISO 8601. Falls back to published. |
| `published_display` | `{{published_display}}` | Human date shown in the byline, e.g. "14 July 2025". |
| `read_time` | `{{read_time}}` | Integer minutes. |
| `hero_image` | `{{hero_image}}` | Absolute path to the post's hero (in-page + preload). |
| `og_image` | `{{og_image}}` | **Absolute URL** (with domain) for social cards. |
| `body_html` | `{{body}}` | The article body as clean HTML (see section 4). |
| `final_thoughts_html` | `{{final_thoughts}}` | Optional closing section. Sits after the FAQs. |
| `faqs[]` | `{{faqs_html}}` + `{{faqs_jsonld}}` | Array of `{q, a}`. Renders the accordion AND the FAQPage schema. |
| `tags[]` | `{{tags_html}}` | Array of strings. |
| `related[]` | `{{related_html}}` | Array of `{slug, title, image, meta}` - the "Recent Posts" strip. |

`{{blogposting_jsonld}}` is generated from the fields above - no separate CMS field.

---

## 4. Body HTML rules (important for SEO + design)

The CMS rich-text output for `body_html` must use plain semantic tags so the article CSS styles it correctly and Google reads the structure:

- Paragraphs as `<p>`.
- Section headings as `<h2>`; sub-headings as `<h3>`. **Never** a second `<h1>` - the post title is the only H1 on the page.
- Lists as `<ul>`/`<ol>` with `<li>`.
- Links as `<a href>`. **Product links must point to** `https://www.thebespokefoilcompany.co.uk/product-page/foil-handprint-footprint-kit-baby-keepsake` (not `/our-kit`).
- No inline styles, no Wix wrapper divs, no `<font>` tags. Clean HTML only.
- British English, no em dashes.

The single H1 rule matters: Google treats multiple H1s as a structure smell. The template supplies the H1; the body must not add one.

---

## 5. Structured data (this is upside, not just parity)

Each post emits two JSON-LD blocks (already in the template):

1. **BlogPosting** - headline, description, image, dates, author, publisher. Standard article schema.
2. **FAQPage** - built from the `faqs[]` array. This is the win: posts with a FAQ section can earn **rich results** (expandable Q&As) in Google. The Wix version likely isn't emitting clean FAQPage schema, so this is a genuine improvement, not just a like-for-like migration.

The reference renderer builds both with `JSON.stringify`, so escaping is always valid. Your CMS must do the same - never string-concatenate JSON-LD by hand, or an apostrophe in a question will break it. If a post has no FAQs, emit `{}` for the FAQPage block (or omit the block) - do not emit an empty `mainEntity`.

---

## 6. The hub feed (`/blog`)

`blog.html` renders from a `POSTS` array. Each item:

```js
{slug, title, excerpt, image, author, avatar, date, read, featured?:true}
```

- Order newest-first.
- Exactly one post may carry `featured:true` - it fills the large featured slot at the top. If none is flagged, the first post is used.
- Search filters title + excerpt live, client-side. While searching, the featured slot collapses into the grid so results are complete.
- When the CMS is wired, replace the hard-coded `POSTS` array with the CMS feed in the same shape. Everything else (render, search, featured, empty state) keeps working untouched.

---

## 7. Routing (`_redirects`)

Two lines are already added:

```
/blog   /blog.html   200   # Resources | Stories & Inspiration | ...
/post/why-every-parent-needs-a-baby-footprint-keepsake   /post-...html   200   # Stories | ...
```

For a CMS that outputs one HTML file per post, add one `200` line per post following that pattern (the inline `# Stories | <title>` comment files it in the sitemap - see `scripts/README.md`). If instead the CMS serves posts dynamically at `/post/:slug`, wire that route in your platform and the sitemap generator will need the post list from the CMS rather than from `_redirects` - flag this and we'll adjust the generator (same as the plan for the 112 franchise regions).

---

## 8. Go-live checklist

1. Slugs published by CMS == current Wix slugs (diff the two lists).
2. Every post: one H1, valid `<title>`, `meta_description`, canonical `/post/<slug>`, OG + Twitter tags, both JSON-LD blocks valid.
3. `og_image` is an absolute URL (with domain).
4. Test 2-3 posts in Google's Rich Results Test - BlogPosting + FAQPage should both validate.
5. `/blog` and a few `/post/<slug>` return 200; old Wix URLs resolve or 301 (never 404).
6. Submit the updated `sitemap.xml` in Search Console after launch and watch coverage for a couple of weeks.

---

## 9. Placeholder images flagged

The example post and hub currently use existing asset-bank images as stand-ins (`founders-074`, `ff-ashley`, `gallery-01..13`) so the pages render for review. Real per-post hero/OG images come from the CMS `hero_image` / `og_image` fields. Search the templates for `IMAGE PLACEHOLDER` comments.
