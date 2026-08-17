# The UGC reel - how to add content

**One source of truth: `data/ugc-reel.json`.** Heading, lede, tiles and the
rotation pool all come from that one file. The reel appears on three pages and
is generated into all of them by the build. Never edit the markup in the HTML - it
gets overwritten.

## Adding new content

1. Drop the files into `assets/` (photos) or `assets/videos/` (clips).
2. Add a line per item to `data/ugc-reel.json`:

```json
{ "type": "video", "src": "/assets/videos/bb-vid-10.mp4",
  "poster": "/assets/videos/bb-vid-10-poster.jpg", "alt": "" }

{ "type": "image", "src": "/assets/bb-44.webp",
  "alt": "A baby's handprint drying on the kitchen table" }
```

3. Deploy. The build regenerates the reel on every page that has it.

That is the whole process. No HTML to touch, no risk of the three copies drifting.

## Videos need a poster

Without one the tile is a black box until the clip decodes. Generate with:

```bash
ffmpeg -ss 0.5 -i assets/videos/bb-vid-10.mp4 -frames:v 1 \
  -vf "scale=300:-2" -q:v 4 assets/videos/bb-vid-10-poster.jpg
```

300px is deliberate - tiles render at 248px, so anything larger is wasted weight
on a section that sits below the fold.

## The order reshuffles when the content changes

The shuffle is seeded from the item list itself, which means:

- **same items** -> same order every build, so an unrelated deploy produces no
  diff noise in the HTML
- **add or remove anything** -> the whole reel reshuffles

That is the "scatter and rejig when we upload" behaviour, without the page
changing every time something unrelated ships.

## Alt text

Optional on videos, worth writing on photos. It is what a screen reader announces
and what search engines read. One short line describing what is happening.

## The build will stop you shipping a broken reel

`scripts/build-ugc-reel.js` **fails the deploy** if any `src` or `poster` points
at a file that is not there. A tile with a missing asset renders as a blank box
and nobody notices for weeks, so it is treated as an error rather than a warning.

## Where the reel appears

| Page | Gallery button |
|---|---|
| `/` | yes |
| `/product-page/foil-handprint-footprint-kit-baby-keepsake` | no |
| affiliate keepsake page | no |

The surrounding markup - heading, lede, and the gallery button where it exists -
is left alone by the build. Only the tiles are regenerated, so the product pages
keep their no-button variant.

To add the reel to another page, copy the `<section class="ugc">` block from
`home.html` and run the build; it will be picked up automatically. **Check first
whether that page loads `shared/styles.css`** - `our-kit.html` and
`keepsake-standalone.html` do not, so they carry an inlined copy of the reel CSS.

## The build enforces the weight budget

Speed is not a thing anyone has to remember. `build-ugc-reel.js` checks every
asset and **stops the deploy** if something is oversized:

| Asset | Budget | If exceeded |
|---|---|---|
| Photo tile | 300 KB | **fails the build** |
| Video poster | 80 KB | **fails the build** |
| Video clip | 1400 KB | warns only |

Tiles render at **248px**, so around 500px covers a retina screen. A straight
camera-roll photo is 3-5MB and a raw phone clip is 50MB - either would sail into
the JSON unnoticed without this.

Photos and posters fail outright because at this size the extra weight is pure
waste. Videos only warn, because a slightly heavy clip can be a fair trade and
they are lazy-loaded below the fold either way.

**Getting an asset under budget:**

```bash
# photo - 1000px is ample for a 248px tile
cwebp -q 80 -resize 1000 0 input.jpg -o assets/bb-44.webp

# poster - 300px, nothing larger is ever displayed
ffmpeg -ss 0.5 -i clip.mp4 -frames:v 1 -vf "scale=300:-2" -q:v 4 poster.jpg

# video - 576px wide, audio stripped, roughly 500KB for a short clip
ffmpeg -i raw.mov -vf "scale=576:-2" -an -c:v libx264 -crf 30 \
  -maxrate 620k -bufsize 1200k -movflags +faststart out.mp4
```

---

## Why the reel costs nothing on page load (06/08/2026)

**Posters are emitted as `data-poster`, not `poster`.** This is the single most
important thing in the component and it is easy to undo by accident.

`preload="none"` governs **video data only**. A real `poster` attribute is an
ordinary image fetch and happens as soon as the element renders, whether or not
the reel is anywhere near the viewport. With 56 clips that was 865KB downloading
on every page load for a section most visitors never scroll to.

The build now writes `data-poster` and the observer promotes it. **The build
fails if a real `poster="` attribute ever appears in a page**, so this cannot
quietly regress.

`loading="lazy"` on `<video>` does the same thing natively and is now widely
supported, but it also changes `preload` and autoplay behaviour, and the reel
calls `.play()` explicitly. Not worth the interaction risk when the observer has
to exist anyway.

## The tiles are NOT observed individually

This is the most important thing in the file after the poster rule, and it is
counter-intuitive.

The marquee is a compositor-driven `transform` animation. **IntersectionObserver
does not reliably fire for elements moved that way.** The compositor holds the
real position while the main thread keeps a stale one, so intersection is
computed against where the tile used to be. Mozilla bug 1419339 documents it;
WebKit only fixed their version of it in 2024.

It was broken from the day the reel shipped. Nobody noticed because `poster` was
a real attribute, so every tile had an image whether the observer fired or not.
Deferring the posters removed the mask and the tiles came up empty on scroll.

**What happens instead:**

| Element | Mechanism | Why |
|---|---|---|
| `.ugc` section | IntersectionObserver, `rootMargin: 200px` | Static, never moves, so IO is reliable |
| Each tile | `getBoundingClientRect` on a throttled rAF sweep | Forces a style flush, so always the live animated position |

The sweep runs every 150ms while the section is on screen and stops entirely
when it is not. rAF rather than `setInterval` so it pauses in a background tab.
Each sweep reads every rect first and only then acts, because reading and
writing in the same pass would thrash layout once per tile.

**A bonus from doing the geometry by hand:** `.ugc-viewport` has
`overflow: hidden`, and `rootMargin` only expands the *root*, never an
intermediate clipping ancestor. `getBoundingClientRect` ignores ancestor
clipping, so the 600px poster lead time is something IO could not have delivered
here at all.

Posters get 600px of lead either side. Video starts only for tiles genuinely on
screen, capped at 8 concurrent (4 on narrow screens). A tile waiting for its
poster shows `--bone` (#DDD6CE), not black.

**Save-Data and 2G get posters and no video**, via `navigator.connection`.

## The scroll duration scales with the item count

The stylesheet says `animation: ugc-scroll 90s linear infinite`. That number was
only ever correct for 24 items.

- 24 items = 6,432px of track. 90s means **71px/s**.
- 66 items = 17,688px. The same 90s becomes **197px/s** - 2.75x too fast.

The build now writes `animation-duration` inline on the track, at 3.75s per item
(90/24, the original cadence). Inline beats the stylesheet shorthand on
specificity, so no CSS edit is needed in three places. `prefers-reduced-motion`
still wins, because it clears `animation-name` and a duration alone animates
nothing.

**Adding clips no longer speeds the reel up.** This was a real bug for one
build.

## `renderLimit` - the pool is bigger than the page

Set in `data/ugc-reel.json`, currently **32**:

```json
{ "renderLimit": 32, "items": [ ... ] }
```

The page ships 32 tiles. **The full pool of 66 is inlined as JSON alongside them
and the browser picks a fresh 32 on every single page load.** Every visitor gets
a different mix, and a returning visitor sees something new.

### Why the rotation is client-side and not in the build

This is a static site. A build-time seed - content-derived, time-based, random,
any of them - only re-evaluates when a deploy runs. Go two months without
deploying and the same tiles show for two months while the rest of the library
never appears. Rotation has to happen in the browser or it is not rotation.

### Why it costs nothing

At the moment the script runs, every tile carries `data-src` and `data-poster`
and has fetched precisely nothing. Reassigning them is free. The inline pool is
4.1KB, and it replaces more tile markup than it adds.

### The two rules it must keep

1. **Both halves of the track get the same selection.** The marquee animates to
   -50%, so if the copies differed the loop would visibly jump. Verified in
   jsdom across repeated loads.
2. **The rendered 32 are a real fallback.** They are correct tiles, not
   placeholders, so a visitor without JavaScript still gets a reel and there is
   no layout shift while the swap happens.

### Sizing it

At 71px/s a visitor has to sit for the full cycle to see everything on the page -
120s at 32 tiles. Rendering all 66 would mean a 248s cycle and double the DOM to
show the same thing any real visitor sees, which is why the limit exists.

Raise it if the reel ever looks repetitive within a single visit. Lower it if
`<video>` element count becomes a problem on low-end phones.


## Changing the heading or the lede

They live in `data/ugc-reel.json`:

```json
{
  "heading": "From our press to your wall",
  "lede": "The foiling, the packing, the sessions, and what families send us afterwards.",
  "renderLimit": 32,
  "items": [ ... ]
}
```

One line, not three edits and a diff check. They were hand-written into all three
pages and happened to be identical, which was luck rather than design.

**The gallery CTA is still left alone.** `home` has one inside the reel section,
the two product pages do not, and that difference is deliberate. The build
rewrites the `<h2>` and the `<p class="lede">` and nothing else in that block.

`.ugc .lede` is `max-width: 56ch`, so anything past roughly 56 characters wraps
to a second line. That is fine, it just wants to read well broken.

**If the `<h2>` or the lede is missing, the build stops.** Silent no-op copy is
worse than a failed deploy.
