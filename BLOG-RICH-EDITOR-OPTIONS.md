# Rich editor for the blog body - options and recommendation

Reply to: *"Blog detail page content area require to rich editor, so we can use
html code and also multiple image and planning to use that fields from supabase,
so suggest some solution."*

## First: the storage side is already right

`blog_posts.body` is `text` holding HTML, and `blog-post.js` injects it **raw**
into `{{body}}`, deliberately - it is trusted CMS content, not user input.

`post-template.html` already styles everything a rich post needs:

```
.post-body > p, h2, h3, a, ul, ol, li, blockquote, img
.post-body img { width:100%; border-radius:var(--r-img); margin:28px 0 }
```

So inline images and rich markup already render correctly. **Nothing needs to
change in the schema or the template.** The gap is purely authoring - Supabase
Studio gives you a plain textarea, which is fine for pasting HTML and miserable
for writing a post.

## The three realistic options

### Option 1 - Small admin page (recommended)

A token-protected page at `/blog-admin`, exactly the pattern already used for
`gallery-upload.html`: list posts, create, edit, publish. Editor is **TipTap**
(~40KB, headless, outputs clean HTML) or **Quill** if you prefer something more
off-the-shelf.

Image handling is the part that matters: paste or drag an image into the editor,
it uploads to Supabase Storage and inserts the `<img>` inline. Multiple images per
post work naturally.

**Why this one:** it fits the stack you already have - static pages, edge
functions, Supabase - and adds no new service, no new hosting, no monthly cost. It
is also the only option where the image upload and the post body live in the same
interface, which is what makes it pleasant to use.

**Cost:** roughly a day. Editor, image upload, list/edit/publish, token auth.

**Watch for:** TipTap can emit `<p></p>` soup and inline styles if configured
loosely. Restrict the schema to the tags `.post-body` actually styles - `p`, `h2`,
`h3`, `a`, `ul`, `ol`, `li`, `blockquote`, `img`, `strong`, `em` - and strip the
rest on save. That keeps the output matching the existing design instead of
fighting it.

### Option 2 - Markdown in the field

Store markdown rather than HTML, convert at the edge with something like `marked`.

**Pros:** no editor to build. Ryan or Ashley could draft anywhere - Notion,
Obsidian, plain Notes - and paste it in.

**Cons:** images become the awkward part. `![alt](url)` means uploading to Supabase
Storage separately and pasting URLs by hand, which is exactly the friction the
question is trying to remove. Also adds a markdown dependency to the edge
function, which is currently dependency-free.

**Reasonable if** posts are mostly text with one hero image. Not if they are
image-heavy.

### Option 3 - A CMS on top of Postgres

Directus or Strapi can point at the same database and give you a full admin UI
including a rich editor and media library, without changing the schema.

**Pros:** nothing to build; roles and permissions come free.

**Cons:** another service to host, keep updated and secure, for **15 posts**.
Directus needs a persistent container - it is not going on Netlify alongside the
rest. It also becomes a second source of truth about the schema, which is the sort
of thing that quietly drifts.

**Worth it if** the plan is many editors and a lot of content types. Overkill for
a blog that gains a post every few weeks.

## Recommendation

**Option 1.** It is proportionate to the volume, adds no infrastructure, and reuses
a pattern already in the codebase. Option 3 solves a bigger problem than the one
you have.

If time is tight this week, **Option 2 is a valid interim** - it needs no UI at
all, and posts can be moved to a proper editor later without touching the schema,
since the body column does not care what it holds.

## Two things to build in whichever route you take

**1. Sanitise on save, not on render.** The edge function injects `body` raw, which
is correct and fast, but it means whatever reaches the column is what ships. Clean
it at the point of writing.

**2. Images need the same treatment as the gallery.** A post image pasted straight
from a phone is 3-5MB with GPS attached. In the first gallery batch, **24 of 43
photos carried GPS coordinates**. Run post images through the same `sharp` resize
and metadata strip already specced in `GALLERY-AUTOMATION-SPEC.md`, and write them
to Storage at a sensible width - `.post-body img` renders at 760px, so 1520px
covers retina with nothing wasted.

## One thing worth deciding at the same time

`data/blog-posts.json` is currently the fallback source for the sitemap when
Supabase is unreachable. Once posts are authored in Supabase, that file will drift.

Either regenerate it as part of the build from Supabase, or accept that it is a
frozen snapshot for emergencies only. Worth a decision rather than discovering it
six months from now when the two disagree.
