# Ashley Gallery Upload - specification

Route: `/gallery-upload` (already added to `_redirects` as a util entry, so it
appears on the sitemap page but stays out of `sitemap.xml`, `robots.txt` and
`llms.txt`).

## The problem this solves

Most of the content for the Bespoke Baby Gallery does not arrive through the
upload portal. It is Ashley's own footage, shot on her phone at classes and
events, plus clips parents send her directly on WhatsApp. Today that content has
no route onto the wall at all.

**Consent is not in scope.** Ryan has confirmed it is handled - the footage is
largely Ashley's own, with verbal consent given in person. No consent capture is
required in this tool.

## What it is

A single page, mobile-first, that Ashley opens on her phone and uses to push
media straight into the existing gallery pipeline.

- **Token in the URL**, e.g. `/gallery-upload?k=<token>`, so there is no password
  to remember. She bookmarks it to her home screen once.
- **Multi-select from the camera roll**, or share straight into it from WhatsApp.
- **Optional caption per item.** Not required, but it becomes the `alt` text,
  which helps both accessibility and search. She knows what is in the clip better
  than anyone.
- Upload progress per file, and a clear "done" state. She will often be doing this
  on a phone signal between classes.

## Where it hooks in

**Straight into the existing pipeline. Do not build a parallel path.**

Files land in the same `gallery` bucket, with the same row shape, so they go
through the identical `sharp` and `ffmpeg` processing already specced in
`GALLERY-AUTOMATION-SPEC.md`. That processing is not optional:

- **`sharp` strips metadata by default.** In the first hand-processed batch,
  **24 of 43 customer photos carried GPS coordinates.** Baby photos with home
  locations embedded. Do not pass `withMetadata()`.
- Raw phone video is 50MB+. The ffmpeg recipe brings clips to roughly 500KB.
  Straight-to-wall uploads would make the gallery unusable on mobile data.

Mark rows with a `source` value (`portal` vs `ashley`) so the two can be told
apart later if needed.

## THE ONE THING THAT WILL BREAK THIS: iPhone formats

**iPhones shoot HEIC photos and `.mov` video by default.** The pipeline as
specced expects JPEG and MP4:

- `sharp` **does not handle HEIC** without libheif compiled in. On Netlify's
  default build image it will throw.
- The ffmpeg recipe assumes `.mp4` input.

If this is not handled, a large share of Ashley's uploads will silently fail and
she will have no way of knowing which. Handle both on the way in:

- Convert HEIC to JPEG before `sharp` (or use a build with libheif).
- Let ffmpeg accept `.mov` - it does natively, but the input filter needs to not
  reject the extension.
- **Surface failures back to her in the UI.** A file that fails must say so on
  screen, not just disappear. This matters more than it sounds: she will assume
  anything without an error worked.

## Deliberately not included

- **Consent capture** - confirmed out of scope.
- **Instant publishing.** Ryan has confirmed the existing **nightly** rebuild is
  fine. She uploads at a class, it appears the next morning. No change needed to
  the build hook.
- **Approval queue.** Everything Ashley uploads is trusted; she is the franchisor.
  If that ever changes, `gallery_state` already supports it.

## Acceptance checks

- [ ] Bookmarked to an iPhone home screen, opens without a login prompt
- [ ] Multi-select of 10 mixed photos and videos completes on 4G
- [ ] A HEIC photo uploads and appears correctly, not as a broken tile
- [ ] A `.mov` clip uploads and appears correctly
- [ ] A deliberately corrupt file shows an error in the UI rather than vanishing
- [ ] Uploaded photos have **no GPS data** - check with `exiftool` on the output
- [ ] Video output is roughly 500KB, not 50MB
- [ ] Items appear on `/bespoke-baby-gallery` after the next nightly build
- [ ] The token is required: the page rejects a request without it
