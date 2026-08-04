# Change manifest - 31/07/2026

Against Dixit's `thebespokefoilcompany_co_uk-main_latest_file_30-07-2026.zip` baseline.

**55 files changed, 74 added, 2 removed.**

## Why almost every page changed

Google Analytics went on all 50 pages, so nearly every HTML file has one new line
in `<head>`. That is the bulk of the diff and it is one line per page. The pages
with substantive changes are listed separately below.

## Substantive page changes

| Page | What |
|---|---|
| `upload-portal-form.html` | 30 JSON snags, 9 screenshot amends, 21 customer photos, real video player, gallery slider |
| `bespoke-baby-gallery.html` | rebuilt as a 73-tile mixed media wall, CSS Grid, autoplay policing |
| `our-story.html` | brand video wired, 16:9 poster |
| `kit-walkthrough-video.html` | YouTube facade embed wired, placeholder copy removed |
| all others | analytics tag only |

## New files

| File | Purpose |
|---|---|
| `shared/analytics.js` | GA4 + Consent Mode v2 + consent banner |
| `scripts/check-analytics.js` | build-time check, FAILS THE DEPLOY if a page lacks the tag |
| `GALLERY-AUTOMATION-SPEC.md` | pipeline spec, already sent to Dixit separately |
| `.gitignore` | restored, was missing from the 30/07 export |
| `assets/bb-01..43.webp` | 43 customer photos, metadata stripped |
| `assets/videos/bb-vid-01..09.mp4` | 9 customer clips, optimised to the mc-* spec |
| `assets/upf-*`, `assets/*-poster-*` | upload portal artwork and video posters |

## Config changes

- `netlify.toml` build command now runs `check-analytics.js` as a third step.
- `scripts/sitemap-template.html` got the analytics tag plus the two fixes flagged
  on 30/07 that it would otherwise have reverted on the next deploy.

## Read before merging

1. **Dixit's Supabase schema is ahead of the copy in here.** Once `gallery_state`
   is added for the gallery pipeline, his version is newer. Do not reapply
   `supabase/upload-portal.sql` from this package over the top of it.
2. **The gallery feed schema changed** from `{src, full, alt}` to
   `{type, src, poster, alt}`. Any webhook written against the old shape needs updating.
3. The 13 `gallery-*` images were removed from the gallery page's feed only.
   The files stay: 20 other pages reference them.

Full reasoning for every change is in `BFC-WEBSITE-THREAD.md` under dated blocks.
